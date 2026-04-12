// api/cron-finalize.js — Syncca
// ─────────────────────────────────────────────────────────────
// Vercel Cron Job — runs every hour.
// Finds sessions with a transcript but no Title that are older
// than 45 minutes, then writes Title, Session_Insight, and
// Session_Complete to Airtable.
//
// Cron schedule: "0 * * * *" (top of every hour)
// Manual trigger: GET /api/cron-finalize  (with CRON_SECRET header)

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE  = process.env.AIRTABLE_BASE_ID;
const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY;
const CRON_SECRET    = process.env.CRON_SECRET; // set this in Vercel env vars
const TABLE          = "Conversation_Logs";
const BATCH_SIZE     = 15;
const MIN_TRANSCRIPT = 300;
const STALE_MINUTES  = 45;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function detectLangCode(languageUsed = "") {
  const val = languageUsed.toLowerCase().trim();
  if (val === "hebrew" || val === "he") return "he";
  if (val === "german"  || val === "de") return "de";
  if (val === "french"  || val === "fr") return "fr";
  if (val === "arabic"  || val === "ar") return "ar";
  return "en";
}

const TITLE_INSTRUCTIONS = {
  he: "כתוב כותרת קצרה בעברית (3-5 מילים) שנותנת את תמצית השיחה. רק הכותרת, ללא גרשיים.",
  en: "Write a short title in English (3–5 words) capturing the emotional journey — poetic, not clinical. Return only the title, no quotes.",
  de: "Schreibe einen kurzen Titel auf Deutsch (3–5 Wörter) für die emotionale Reise — poetisch, nicht klinisch. Nur den Titel, keine Anführungszeichen.",
  fr: "Écris un titre court en français (3 à 5 mots) capturant le voyage émotionnel — poétique, pas clinique. Renvoie uniquement le titre, sans guillemets.",
  ar: "اكتب عنوانًا قصيرًا بالعربية (3-5 كلمات) يعبّر عن الرحلة العاطفية — شعري، غير سريري. أعد العنوان فقط، بدون علامات اقتباس.",
};

async function callClaude(prompt, maxTokens) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
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
  const data = await res.json();
  const text = data.content?.[0]?.text?.trim();
  if (!text) throw new Error("Empty response from Claude");
  return text;
}

async function fetchStaleRecords() {
  // Airtable formula:
  // - Has a transcript
  // - Title is empty (not yet processed)
  // - Session_Insight is empty (double-check)
  // - Created_At is older than STALE_MINUTES minutes
  const formula = encodeURIComponent(
    `AND(
      LEN({Full_Transcript}) > 0,
      {Title} = "",
      {Session_Insight} = "",
      DATETIME_DIFF(NOW(), {Created_At}, 'minutes') > ${STALE_MINUTES}
    )`
  );

  const fields = ["Full_Transcript", "Language_Used", "Created_At"];
  const fieldQs = fields.map(f => `fields%5B%5D=${encodeURIComponent(f)}`).join("&");

  let all = [], offset = null;

  do {
    let url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${TABLE}?${fieldQs}&filterByFormula=${formula}&pageSize=100`;
    if (offset) url += `&offset=${encodeURIComponent(offset)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Airtable fetch error: ${JSON.stringify(data)}`);

    all = all.concat(data.records || []);
    offset = data.offset || null;
  } while (offset);

  // Secondary guard: minimum transcript length (proxy for ≥3 user messages)
  return all.filter(rec => (rec.fields?.Full_Transcript || "").length >= MIN_TRANSCRIPT);
}

module.exports = async function handler(req, res) {
  // ── Security: validate cron secret ──────────────────────────
  // Vercel sends: Authorization: Bearer <CRON_SECRET>
  // Also allow manual GET if the same header is present.
  if (CRON_SECRET) {
    const authHeader = req.headers["authorization"] || "";
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  if (req.method !== "GET") return res.status(405).end();

  const results = {
    runAt:     new Date().toISOString(),
    remaining: 0,
    processed: 0,
    succeeded: 0,
    failed:    0,
    details:   [],
  };

  try {
    const allStale = await fetchStaleRecords();
    results.remaining = Math.max(0, allStale.length - BATCH_SIZE);
    const batch = allStale.slice(0, BATCH_SIZE);
    results.processed = batch.length;

    if (batch.length === 0) {
      return res.status(200).json({
        message: "✅ אין שיחות לטיפול כרגע.",
        ...results,
      });
    }

    for (const rec of batch) {
      const transcript = rec.fields.Full_Transcript;
      const langCode   = detectLangCode(rec.fields?.Language_Used);

      try {
        // Generate Title
        const title = await callClaude(
          `${TITLE_INSTRUCTIONS[langCode] || TITLE_INSTRUCTIONS.en}\n\nתמליל:\n${transcript.slice(-2000)}`,
          30
        );

        // Generate Session_Insight
        const insight = await callClaude(
          `You are analyzing a therapy-style conversation between Syncca and a user.\n` +
          `Write 2-3 sentences in Hebrew (third person) summarizing: what topic the user brought, ` +
          `what emerged, and where they ended up emotionally.\n` +
          `Return only the Hebrew summary, no quotes, no titles.\n\n` +
          `Transcript:\n${transcript.slice(-3000)}`,
          300
        );

        // Write Title + Session_Insight + Session_Complete to Airtable
        const patchRes = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE}/${TABLE}/${rec.id}`,
          {
            method: "PATCH",
            headers: {
              Authorization:  `Bearer ${AIRTABLE_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fields: {
                Title:            title,
                Session_Insight:  insight,
                Session_Complete: "yes",   // ← new: marks session as fully closed
              },
            }),
          }
        );

        if (!patchRes.ok) {
          const errBody = await patchRes.json();
          throw new Error(`Airtable PATCH failed: ${JSON.stringify(errBody)}`);
        }

        results.succeeded++;
        results.details.push({
          id:      rec.id,
          title,
          insight: insight.slice(0, 80) + "…",
        });

        await sleep(300); // stay within Airtable rate limits

      } catch (err) {
        results.failed++;
        results.details.push({ id: rec.id, error: err.message });
      }
    }

    const doneMsg = results.remaining > 0
      ? `✅ סבב הושלם. נותרו עוד ${results.remaining} שיחות לסבב הבא.`
      : "✅ כל השיחות הישנות טופלו.";

    return res.status(200).json({ message: doneMsg, ...results });

  } catch (err) {
    return res.status(500).json({ error: err.message, ...results });
  }
};
