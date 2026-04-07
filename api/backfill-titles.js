/**
 * backfill-titles.js — Syncca One-Time Title Backfill
 * ─────────────────────────────────────────────────────
 * Finds every Conversation_Logs record that has a Full_Transcript
 * but an empty Title, generates a poetic title via Claude, and
 * writes it back to Airtable.
 *
 * USAGE
 * ─────
 * 1. Set the three environment variables below (or create a .env file
 *    and run with: node -r dotenv/config backfill-titles.js)
 *
 *    export AIRTABLE_TOKEN="patXXXXXXXXXXXXXX"
 *    export AIRTABLE_BASE_ID="appXXXXXXXXXXXXXX"
 *    export ANTHROPIC_API_KEY="sk-ant-XXXXXXXXXXXXXXXX"
 *
 * 2. node backfill-titles.js
 *
 * The script is safe to re-run — it skips any record that
 * already has a Title.
 */

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE  = process.env.AIRTABLE_BASE_ID;
const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY;

// ─── Config ───────────────────────────────────────────────────────
const TABLE          = "Conversation_Logs";
const MIN_TRANSCRIPT = 200;   // characters — skip very short transcripts
const DELAY_MS       = 500;   // ms between Airtable PATCH calls (rate-limit buffer)
const MAX_RECORDS    = 200;   // safety cap per run (increase if you have more)

// ─── Title instruction per language ───────────────────────────────
const LANG_INSTRUCTIONS = {
  he: "כתוב כותרת קצרה בעברית (3-5 מילים) שמתארת את המסע הרגשי של השיחה — פואטית, לא קלינית. רק הכותרת, ללא גרשיים.",
  en: "Write a short title in English (3–5 words) capturing the emotional journey — poetic, not clinical. Return only the title, no quotes.",
  de: "Schreibe einen kurzen Titel auf Deutsch (3–5 Wörter) für die emotionale Reise — poetisch, nicht klinisch. Nur den Titel, keine Anführungszeichen.",
  fr: "Écris un titre court en français (3 à 5 mots) capturant le voyage émotionnel — poétique, pas clinique. Renvoie uniquement le titre, sans guillemets.",
  ar: "اكتب عنوانًا قصيرًا بالعربية (3-5 كلمات) يعبّر عن الرحلة العاطفية — شعري، غير سريري. أعد العنوان فقط، بدون علامات اقتباس.",
};

// ─── Helpers ──────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Map Language_Used field value → language code */
function detectLangCode(languageUsed = "") {
  const val = languageUsed.toLowerCase().trim();
  if (val === "hebrew" || val === "he")  return "he";
  if (val === "german"  || val === "de") return "de";
  if (val === "french"  || val === "fr") return "fr";
  if (val === "arabic"  || val === "ar") return "ar";
  return "en";
}

/** Fetch one page of Airtable records */
async function fetchPage(offset) {
  const fields = [
    "Full_Transcript",
    "Language_Used",
    "Title",
  ];
  const fieldQs = fields.map(f => `fields%5B%5D=${encodeURIComponent(f)}`).join("&");
  // Only fetch records that have a transcript (non-empty)
  const formula = encodeURIComponent("AND(LEN({Full_Transcript})>0)");
  let url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${TABLE}?${fieldQs}&filterByFormula=${formula}&pageSize=100`;
  if (offset) url += `&offset=${encodeURIComponent(offset)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airtable fetch failed (${res.status}): ${err}`);
  }
  return res.json();
}

/** Generate a title via Claude */
async function generateTitle(transcript, langCode) {
  const instruction = LANG_INSTRUCTIONS[langCode] || LANG_INSTRUCTIONS.en;
  const excerpt = transcript.slice(-2000); // last 2000 chars, same as production

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type":      "application/json",
      "x-api-key":         ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 30,
      messages: [{ role: "user", content: `${instruction}\n\nתמליל:\n${excerpt}` }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API failed (${res.status}): ${err}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text?.trim() || null;
}

/** Write title back to Airtable */
async function patchTitle(recordId, title) {
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE}/${TABLE}/${recordId}`,
    {
      method: "PATCH",
      headers: {
        Authorization:  `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: { Title: title } }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airtable PATCH failed (${res.status}): ${err}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────
async function main() {
  // Pre-flight checks
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE || !ANTHROPIC_KEY) {
    console.error("❌  Missing environment variables. Need:");
    console.error("    AIRTABLE_TOKEN, AIRTABLE_BASE_ID, ANTHROPIC_API_KEY");
    process.exit(1);
  }

  console.log("🔍  Fetching Conversation_Logs from Airtable...\n");

  // Paginate through all records
  let allRecords = [];
  let offset = null;
  do {
    const page = await fetchPage(offset);
    allRecords = allRecords.concat(page.records || []);
    offset = page.offset || null;
    if (allRecords.length >= MAX_RECORDS) break;
  } while (offset);

  console.log(`📦  Total records fetched: ${allRecords.length}`);

  // Filter: has transcript, no title, transcript long enough
  const toProcess = allRecords.filter(rec => {
    const transcript = rec.fields?.Full_Transcript || "";
    const title      = rec.fields?.Title           || "";
    return transcript.length >= MIN_TRANSCRIPT && !title.trim();
  });

  console.log(`✏️   Records needing a title: ${toProcess.length}\n`);

  if (toProcess.length === 0) {
    console.log("✅  Nothing to do — all records already have titles.");
    return;
  }

  let succeeded = 0;
  let failed    = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const rec        = toProcess[i];
    const id         = rec.id;
    const langCode   = detectLangCode(rec.fields?.Language_Used);
    const transcript = rec.fields?.Full_Transcript || "";

    process.stdout.write(`[${i + 1}/${toProcess.length}] ${id} (${langCode}) → `);

    try {
      const title = await generateTitle(transcript, langCode);
      if (!title) throw new Error("Empty title returned");

      await patchTitle(id, title);
      console.log(`"${title}" ✓`);
      succeeded++;
    } catch (err) {
      console.log(`FAILED — ${err.message}`);
      failed++;
    }

    // Polite delay between writes
    if (i < toProcess.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\n─────────────────────────────────`);
  console.log(`✅  Done. ${succeeded} titled, ${failed} failed.`);
  if (failed > 0) {
    console.log(`⚠️   Re-run the script to retry failed records (safe to repeat).`);
  }
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
