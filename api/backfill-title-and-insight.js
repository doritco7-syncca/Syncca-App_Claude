// api/backfill-title-and-insight.js — Syncca
// ─────────────────────────────────────────────────────────────
// Finds sessions with a transcript but no Title, generates both
// Title and Session_Insight via Claude, and writes them to Airtable.
//
// Safe to re-run — skips sessions that already have a Title.
// Each run processes up to 15 sessions (Vercel 60s limit).
//
// Usage: https://www.syncca.app/api/backfill-title-and-insight
// Repeat until: ✅ הכל גמור!

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE  = process.env.AIRTABLE_BASE_ID;
const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY;
const TABLE          = "Conversation_Logs";
const BATCH_SIZE     = 15;
const MIN_TRANSCRIPT = 300;

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
  he: "כתוב כותרת קצרה בעברית (3-5 מילים)שנותנת את תמצית השיחה. רק הכותרת, ללא גרשיים.",
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

async function fetchRecordsNeedingWork() {
  let all = [], offset = null;
  const fields = ["Full_Transcript", "Language_Used"];
  const fieldQs = fields.map(f => `fields%5B%5D=${encodeURIComponent(f)}`).join("&");
  const formula = encodeURIComponent(`AND(LEN({Full_Transcript})>0, {Title}="")`);

  do {
    let url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${TABLE}?${fieldQs}&filterByFormula=${formula}&pageSize=100`;
    if (offset) url += `&offset=${encodeURIComponent(offset)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(`Airtable fetch error: ${JSON.stringify(data)}`);
    all = all.concat(data.records || []);
    offset = data.offset || null;
  } while (offset);

  return all.filter(rec => (rec.fields?.Full_Transcript || "").length >= MIN_TRANSCRIPT);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const results = { remaining: 0, processed: 0, succeeded: 0, failed: 0, details: [] };

  try {
    const allNeeding = await fetchRecordsNeedingWork();
    results.remaining = Math.max(0, allNeeding.length - BATCH_SIZE);
    const batch = allNeeding.slice(0, BATCH_SIZE);
    results.processed = batch.length;

    if (batch.length === 0) {
      return res.status(200).json({
        message: "✅ הכל גמור! לכל השיחות יש כעת Title ו-Session_Insight.",
        ...results,
      });
    }

    for (const rec of batch) {
      const transcript = rec.fields.Full_Transcript;
      const langCode   = detectLangCode(rec.fields?.Language_Used);
      try {
        const title   = await callClaude(`${TITLE_INSTRUCTIONS[langCode] || TITLE_INSTRUCTIONS.en}\n\nתמליל:\n${transcript.slice(-2000)}`, 30);
        const insight = await callClaude(`You are analyzing a therapy-style conversation between Syncca and a user.\nWrite 2-3 sentences in Hebrew (third person) summarizing: what topic the user brought, what emerged, and where they ended up emotionally.\nReturn only the Hebrew summary, no quotes, no titles.\n\nTranscript:\n${transcript.slice(-3000)}`, 300);

        await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${TABLE}/${rec.id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({ fields: { Title: title, Session_Insight: insight } }),
        });

        results.succeeded++;
        results.details.push({ id: rec.id, title, insight: insight.slice(0, 60) + "…" });
        await sleep(300);
      } catch (err) {
        results.failed++;
        results.details.push({ id: rec.id, error: err.message });
      }
    }

    const doneMsg = results.remaining > 0
      ? `✅ סבב הושלם. נותרו עוד ${results.remaining} שיחות — הריצי שוב את אותה כתובת.`
      : "✅ הכל גמור! לכל השיחות יש כעת Title ו-Session_Insight.";

    return res.status(200).json({ message: doneMsg, ...results });

  } catch (err) {
    return res.status(500).json({ error: err.message, ...results });
  }
};
