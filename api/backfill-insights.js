// api/backfill-insights.js — Syncca One-Time Insight Backfill
// ─────────────────────────────────────────────────────────────
// Finds Conversation_Logs records with Full_Transcript but no Session_Insight,
// generates structured AI analysis, and writes it back to Airtable.
//
// Run multiple times — safe to repeat, skips already-processed records.
// Each run processes up to 15 sessions (to stay within Vercel's 60s limit).
//
// Usage: https://www.syncca.app/api/backfill-insights
// After all done: delete this file from GitHub.

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE  = process.env.AIRTABLE_BASE_ID;
const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY;
const TABLE          = "Conversation_Logs";
const BATCH_SIZE     = 15;
const MIN_TRANSCRIPT = 300;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchRecordsNeedingInsight() {
  let all = [], offset = null;
  const fields = ["Full_Transcript", "Language_Used", "Session_Insight"];
  const fieldQs = fields.map(f => `fields%5B%5D=${encodeURIComponent(f)}`).join("&");
  // Only fetch records with a transcript but no insight yet
  const formula = encodeURIComponent(`AND(LEN({Full_Transcript})>0, {Session_Insight}="")`);

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

  return all.filter(rec =>
    (rec.fields?.Full_Transcript || "").length >= MIN_TRANSCRIPT
  );
}

async function generateInsight(transcript) {
  const prompt = `You are analyzing a therapy-style conversation between Syncca (an AI relationship communication guide) and a user.

Read the transcript below and respond with ONLY a valid JSON object — no explanation, no markdown, no backticks.

The JSON must have exactly these keys:

{
  "insight": "2-3 sentences in Hebrew (third person) summarizing: what topic the user brought, what emerged in the conversation, and where they ended up.",
  "ladder_step": <integer 1-6, the highest ladder step reached: 1=Holding, 2=Diagnostic, 3=Biological Bridge, 4=Poison Identification, 5=Separateness, 6=Clean Request>,
  "emotional_arc": "<starting state> → <ending state>, using only these values: flooded, reflective, cortical",
  "pattern_identified": "<exactly one of: Compliance, War, Both, Unclear>",
  "mode_at_end": "<exactly one of: mirror, coach>",
  "core_theme": "one short phrase in English describing the core issue (e.g. 'unmet need for appreciation', 'fear of abandonment', 'control vs autonomy')"
}

Rules:
- insight must be in Hebrew
- ladder_step must be a number between 1 and 6
- emotional_arc must use only the allowed state values
- pattern_identified must be exactly one of: Compliance, War, Both, Unclear
- mode_at_end must be exactly one of: mirror, coach
- core_theme must be in English, one short phrase
- Return ONLY the JSON object. Nothing else.

Transcript (last 3000 characters):
${transcript.slice(-3000)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type":      "application/json",
      "x-api-key":         ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 400,
      messages:   [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  const raw  = data.content?.[0]?.text?.trim();
  if (!raw) throw new Error("Empty response from Claude");

  const clean  = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(clean);
}

async function patchInsight(recordId, parsed) {
  const fields = {};

  if (parsed.insight)       fields.Session_Insight = parsed.insight;
  if (parsed.core_theme)    fields.Core_Theme       = parsed.core_theme;
  if (parsed.emotional_arc) fields.Emotional_Arc    = parsed.emotional_arc;

  const step = parseInt(parsed.ladder_step, 10);
  if (!isNaN(step) && step >= 1 && step <= 6)
    fields.Ladder_Step_Reached = step;

  if (["Compliance", "War", "Both", "Unclear"].includes(parsed.pattern_identified))
    fields.Pattern_Identified = parsed.pattern_identified;

  if (["mirror", "coach"].includes(parsed.mode_at_end))
    fields.Mode_At_End = parsed.mode_at_end;

  if (!Object.keys(fields).length) return;

  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE}/${TABLE}/${recordId}`,
    {
      method: "PATCH",
      headers: {
        Authorization:  `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    }
  );
  if (!res.ok) throw new Error(`Airtable PATCH failed: ${res.status}`);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const results = { remaining: 0, processed: 0, succeeded: 0, failed: 0, details: [] };

  try {
    const allNeeding = await fetchRecordsNeedingInsight();
    results.remaining = Math.max(0, allNeeding.length - BATCH_SIZE);

    const batch = allNeeding.slice(0, BATCH_SIZE);
    results.processed = batch.length;

    if (batch.length === 0) {
      return res.status(200).json({
        message: "✅ הכל גמור! לכל השיחות יש כעת Session_Insight.",
        ...results,
      });
    }

    for (const rec of batch) {
      try {
        const parsed = await generateInsight(rec.fields.Full_Transcript);
        await patchInsight(rec.id, parsed);
        results.succeeded++;
        results.details.push({ id: rec.id, insight: parsed.insight?.slice(0, 80) + "…" });
        await sleep(300);
      } catch (err) {
        results.failed++;
        results.details.push({ id: rec.id, error: err.message });
      }
    }

    const doneMsg = results.remaining > 0
      ? `✅ סבב הושלם. נותרו עוד ${results.remaining} שיחות — הריצי שוב את אותה כתובת.`
      : "✅ הכל גמור! לכל השיחות יש כעת Session_Insight.";

    return res.status(200).json({ message: doneMsg, ...results });

  } catch (err) {
    return res.status(500).json({ error: err.message, ...results });
  }
};
