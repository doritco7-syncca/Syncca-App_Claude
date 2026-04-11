const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE  = process.env.AIRTABLE_BASE_ID;
const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY;
const TABLE          = "Conversation_Logs";
const MIN_TRANSCRIPT = 200;

const LANG_INSTRUCTIONS = {
  he: "כתוב כותרת קצרה בעברית (3-5 מילים) שנותנת את תמצית השיחה. רק הכותרת, ללא גרשיים.",
  en: "Write a short title in English (3–5 words) capturing the emotional journey — poetic, not clinical. Return only the title, no quotes.",
  de: "Schreibe einen kurzen Titel auf Deutsch (3–5 Wörter) für die emotionale Reise — poetisch, nicht klinisch. Nur den Titel, keine Anführungszeichen.",
};

function detectLangCode(languageUsed = "") {
  const val = languageUsed.toLowerCase().trim();
  if (val === "hebrew" || val === "he") return "he";
  if (val === "german"  || val === "de") return "de";
  return "en";
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchAllRecords() {
  let all = [], offset = null;
  const fields = ["Full_Transcript", "Language_Used", "Title"];
  const fieldQs = fields.map(f => `fields%5B%5D=${encodeURIComponent(f)}`).join("&");
  const formula = encodeURIComponent("LEN({Full_Transcript})>0");
  do {
    let url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${TABLE}?${fieldQs}&filterByFormula=${formula}&pageSize=100`;
    if (offset) url += `&offset=${encodeURIComponent(offset)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(`Airtable: ${JSON.stringify(data)}`);
    all = all.concat(data.records || []);
    offset = data.offset || null;
  } while (offset);
  return all;
}

async function generateTitle(transcript, langCode) {
  const instruction = LANG_INSTRUCTIONS[langCode] || LANG_INSTRUCTIONS.en;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 30,
      messages: [{ role: "user", content: `${instruction}\n\nתמליל:\n${transcript.slice(-2000)}` }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text?.trim() || null;
}

async function patchTitle(recordId, title) {
  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${TABLE}/${recordId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { Title: title } }),
  });
  if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const results = { succeeded: 0, failed: 0, skipped: 0, titles: [] };
  try {
    const all = await fetchAllRecords();
    const toProcess = all.filter(rec => {
      const t = rec.fields?.Full_Transcript || "";
      const title = rec.fields?.Title || "";
      return t.length >= MIN_TRANSCRIPT && !title.trim();
    });
    results.skipped = all.length - toProcess.length;
    for (const rec of toProcess) {
      const langCode = detectLangCode(rec.fields?.Language_Used);
      try {
        const title = await generateTitle(rec.fields.Full_Transcript, langCode);
        if (!title) throw new Error("Empty title");
        await patchTitle(rec.id, title);
        results.succeeded++;
        results.titles.push({ id: rec.id, title });
        await sleep(300);
      } catch (err) {
        results.failed++;
        results.titles.push({ id: rec.id, error: err.message });
      }
    }
    return res.status(200).json({ message: `✅ ${results.succeeded} כותרות נכתבו, ${results.failed} נכשלו, ${results.skipped} כבר היו.`, ...results });
  } catch (err) {
    return res.status(500).json({ error: err.message, ...results });
  }
};
