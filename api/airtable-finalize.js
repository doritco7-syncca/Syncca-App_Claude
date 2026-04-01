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

  // Optionally generate insight server-side (on next login request)
  if (generateInsight && fullTranscript && ANTHROPIC_KEY) {
    try {
      const prompt = `להלן תמליל שיחה בין סינקה לבין יוזר.\n\nכתבי 2-3 משפטים קצרים בעברית שמסכמים את השיחה — מה הנושא שהיוזר הביא, מה עלה בשיחה, ואיפה הם הגיעו. כתבי בגוף שלישי.\nענה אך ורק במשפטים, ללא כותרת.\n\nתמליל:\n${fullTranscript.slice(-3000)}`;

      const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 300,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const aiData = await aiRes.json();
      const insight = aiData.content?.[0]?.text?.trim();
      if (insight) fields.Session_Insight = insight;
    } catch (e) {
      // Insight failed — still save transcript
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
