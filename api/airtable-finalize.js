// api/airtable-finalize.js — Vercel Serverless Function
// Called via sendBeacon on tab close — saves transcript without insight
// Also called on next login to generate insight retroactively

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE  = process.env.AIRTABLE_BASE_ID;
const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { logRecordId, fullTranscript, conceptsSurfaced, generateInsight } = req.body || {};
  if (!logRecordId) return res.status(400).json({ error: "Missing logRecordId" });

  const fields = {};
  if (fullTranscript) fields.Full_Transcript = fullTranscript;
  if (Array.isArray(conceptsSurfaced) && conceptsSurfaced.length > 0)
    fields.Concepts_Surfaced = conceptsSurfaced.join(", ");

  // Generate structured session analysis via AI (on next login request)
  if (generateInsight && fullTranscript && ANTHROPIC_KEY) {
    try {
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
${fullTranscript.slice(-3000)}`;

      const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 400,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const aiData = await aiRes.json();
      const raw = aiData.content?.[0]?.text?.trim();

      if (raw) {
        try {
          // Strip accidental markdown fences if present
          const clean = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
          const parsed = JSON.parse(clean);

          if (parsed.insight)            fields.Session_Insight       = parsed.insight;
          if (parsed.core_theme)         fields.Core_Theme            = parsed.core_theme;
          if (parsed.emotional_arc)      fields.Emotional_Arc         = parsed.emotional_arc;

          // Validate ladder_step is a number 1-6
          const step = parseInt(parsed.ladder_step, 10);
          if (!isNaN(step) && step >= 1 && step <= 6)
            fields.Ladder_Step_Reached = step;

          // Validate controlled vocabulary fields
          const validPatterns = ["Compliance", "War", "Both", "Unclear"];
          if (validPatterns.includes(parsed.pattern_identified))
            fields.Pattern_Identified = parsed.pattern_identified;

          const validModes = ["mirror", "coach"];
          if (validModes.includes(parsed.mode_at_end))
            fields.Mode_At_End = parsed.mode_at_end;

        } catch (parseErr) {
          // JSON parse failed — try to salvage at least the insight as plain text
          console.warn("[airtable-finalize] JSON parse failed, falling back to plain text insight:", parseErr);
          if (raw.length > 10 && raw.length < 1000) {
            fields.Session_Insight = raw;
          }
        }
      }
    } catch (e) {
      // AI call failed entirely — still save transcript
      console.warn("[airtable-finalize] AI insight generation failed:", e);
    }
  }

  if (Object.keys(fields).length === 0) return res.status(200).json({ ok: true });

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/Conversation_Logs/${logRecordId}`,
      {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${AIRTABLE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields }),
      }
    );
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Failed to save" });
  }
}
