// api/cron-finalize.js — Syncca
// ─────────────────────────────────────────────────────────────
// Vercel Cron Job — runs every hour.
// Finds sessions with a transcript older than 45 minutes where
// Title or Session_Insight is still missing,
// then fills only what's missing — never overwrites existing data.
// Session_Complete is written as a stamp only — never used as a filter.
//
// Key fix: Airtable returns "\n" (not "") when a Long Text field is cleared.
// All field checks use .trim() to handle this correctly.
//
// Cron schedule: "0 * * * *" (top of every hour)
// Manual trigger: GET /api/cron-finalize  (with Authorization header)

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE  = process.env.AIRTABLE_BASE_ID;
const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY;
const CRON_SECRET    = process.env.CRON_SECRET;
const TABLE          = "Conversation_Logs";
const BATCH_SIZE     = 15;
const MIN_TRANSCRIPT = 300;
const STALE_MINUTES  = 45;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function detectLangCode(languageUsed) {
  var val = (languageUsed || "").toLowerCase().trim();
  if (val === "hebrew" || val === "he") return "he";
  if (val === "german"  || val === "de") return "de";
  if (val === "french"  || val === "fr") return "fr";
  if (val === "arabic"  || val === "ar") return "ar";
  return "en";
}

var TITLE_INSTRUCTIONS = {
  he: "כתוב כותרת קצרה בעברית (3-5 מילים) שנותנת את תמצית השיחה. רק הכותרת, ללא גרשיים.",
  en: "Write a short title in English (3-5 words) that captures the essence of the conversation — clear and specific, so the user can easily find this session later. Return only the title, no quotes.",
  de: "Schreibe einen kurzen Titel auf Deutsch (3-5 Woerter), der den Kern des Gespraechs zusammenfasst — klar und konkret, damit der Nutzer diese Sitzung leicht wiederfinden kann. Nur den Titel, keine Anfuehrungszeichen.",
  fr: "Ecris un titre court en francais (3 a 5 mots) qui capture l'essentiel de la conversation — clair et precis, pour que l'utilisateur puisse retrouver facilement cette session. Renvoie uniquement le titre, sans guillemets.",
  ar: "اكتب عنواناً قصيراً بالعربية (3-5 كلمات) يعبّر عن جوهر المحادثة — واضح ومحدد، حتى يتمكن المستخدم من العثور على هذه الجلسة بسهولة. أعد العنوان فقط، بدون علامات اقتباس.",
};

async function callClaude(prompt, maxTokens) {
  var res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type":      "application/json",
      "x-api-key":         ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model:      "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages:   [{ role: "user", content: prompt }],
    }),
  });
  var data = await res.json();
var text = data.content && data.content[0] && data.content[0].text
    ? data.content[0].text.trim()
    : null;
  if (!text) {
    console.log("[CLAUDE ERROR]", JSON.stringify(data));
    throw new Error("Empty response from Claude: " + (data.error ? data.error.message : JSON.stringify(data).slice(0, 200)));
  }
  return text;
}

async function fetchStaleRecords() {
  // Filter: has transcript + older than STALE_MINUTES + Title OR Insight missing
  // Session_Complete is intentionally NOT used here — it is write-only
  var filterParts = [
    "LEN({Full_Transcript}) > 0",
    "DATETIME_DIFF(NOW(), {Created_At}, 'minutes') > " + STALE_MINUTES,
    "OR({Title} = \"\", {Session_Insight} = \"\")",
  ];
  var formula = encodeURIComponent("AND(" + filterParts.join(", ") + ")");

  var fields = ["Full_Transcript", "Language_Used", "Created_At", "Title", "Session_Insight"];
  var fieldQs = fields.map(function(f) {
    return "fields%5B%5D=" + encodeURIComponent(f);
  }).join("&");

  var all = [];
  var offset = null;

  do {
    var url = "https://api.airtable.com/v0/" + AIRTABLE_BASE + "/" + TABLE +
              "?" + fieldQs + "&filterByFormula=" + formula + "&pageSize=100";
    if (offset) url += "&offset=" + encodeURIComponent(offset);

    var res = await fetch(url, {
      headers: { Authorization: "Bearer " + AIRTABLE_TOKEN },
    });
    var data = await res.json();
    if (!res.ok) throw new Error("Airtable fetch error: " + JSON.stringify(data));

    all = all.concat(data.records || []);
    offset = data.offset || null;
  } while (offset);

  // Secondary guard: minimum transcript length
  return all.filter(function(rec) {
    var t = (rec.fields && rec.fields.Full_Transcript) || "";
    return t.length >= MIN_TRANSCRIPT;
  });
}

module.exports = async function handler(req, res) {

  // Security: validate cron secret
  if (CRON_SECRET) {
    var authHeader = req.headers["authorization"] || "";
    if (authHeader !== "Bearer " + CRON_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  if (req.method !== "GET") return res.status(405).end();

  var results = {
    runAt:     new Date().toISOString(),
    remaining: 0,
    processed: 0,
    succeeded: 0,
    failed:    0,
    details:   [],
  };

  try {
    var allStale = await fetchStaleRecords();
    results.remaining = Math.max(0, allStale.length - BATCH_SIZE);
    var batch = allStale.slice(0, BATCH_SIZE);
    results.processed = batch.length;

    if (batch.length === 0) {
      console.log("[RESULTS]", JSON.stringify(results));
      return res.status(200).json({
        message: "No sessions need processing right now.",
        results: results,
      });
    }

    for (var i = 0; i < batch.length; i++) {
      var rec = batch[i];
      var transcript = (rec.fields && rec.fields.Full_Transcript) || "";
      var langCode   = detectLangCode(rec.fields && rec.fields.Language_Used);

      // .trim() is critical: Airtable returns "\n" (not "") for cleared Long Text fields
      var rawTitle    = rec.fields ? rec.fields.Title           : undefined;
      var rawInsight  = rec.fields ? rec.fields.Session_Insight : undefined;
      var existingTitle   = (rawTitle   != null) ? String(rawTitle).trim()   : "";
      var existingInsight = (rawInsight != null) ? String(rawInsight).trim() : "";

      try {
        var fieldsToWrite = {};

        // Generate Title only if missing
        if (!existingTitle) {
          var titlePrompt = (TITLE_INSTRUCTIONS[langCode] || TITLE_INSTRUCTIONS.en) +
                            "\n\nTranscript:\n" + transcript.slice(-2000);
          fieldsToWrite.Title = await callClaude(titlePrompt, 30);
        }

        // Generate Session_Insight only if missing
        if (!existingInsight) {
          var insightPrompt =
            "You are analyzing a therapy-style conversation between Syncca and a user.\n" +
            "Write 2-3 sentences in Hebrew (third person) summarizing: what topic the user brought, " +
            "what emerged, and where they ended up emotionally.\n" +
            "Return only the Hebrew summary, no quotes, no titles.\n\n" +
            "Transcript:\n" + transcript.slice(-3000);
          fieldsToWrite.Session_Insight = await callClaude(insightPrompt, 300);
        }

        // Always stamp Session_Complete — write-only, never used as filter
        fieldsToWrite.Session_Complete = "yes";

        var patchRes = await fetch(
          "https://api.airtable.com/v0/" + AIRTABLE_BASE + "/" + TABLE + "/" + rec.id,
          {
            method: "PATCH",
            headers: {
              Authorization:  "Bearer " + AIRTABLE_TOKEN,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ fields: fieldsToWrite }),
          }
        );

        if (!patchRes.ok) {
          var errBody = await patchRes.json();
          throw new Error("Airtable PATCH failed: " + JSON.stringify(errBody));
        }

        results.succeeded++;
        results.details.push({
          id:      rec.id,
          filled:  Object.keys(fieldsToWrite),
          title:   fieldsToWrite.Title || existingTitle,
          insight: ((fieldsToWrite.Session_Insight || existingInsight) + "").slice(0, 80) + "...",
        });

        await sleep(300);

      } catch (recErr) {
        results.failed++;
        results.details.push({ id: rec.id, error: recErr.message });
      }
    }

    var doneMsg = results.remaining > 0
      ? "Batch done. " + results.remaining + " sessions remaining for the next run."
      : "All stale sessions have been processed.";

    console.log("[RESULTS]", JSON.stringify(results));
    return res.status(200).json({ message: doneMsg, results: results });

  } catch (err) {
    console.log("[ERROR]", err.message, JSON.stringify(results));
    return res.status(500).json({ error: err.message, results: results });
  }
};
