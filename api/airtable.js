// api/airtable.js — Vercel Serverless Function
// Proxy לכל קריאות Airtable — מסתיר את ה-API key מהדפדפן

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE  = process.env.AIRTABLE_BASE_ID;
const BASE_URL       = `https://api.airtable.com/v0/${AIRTABLE_BASE}`;

export default async function handler(req, res) {
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE) {
    return res.status(500).json({ error: "Missing Airtable configuration" });
  }

  // Reconstruct the full path from the raw URL to avoid double-encoding
  const urlObj = new URL(req.url, "http://localhost");
  const rawPath = urlObj.searchParams.get("path");
  if (!rawPath) return res.status(400).json({ error: "Missing path" });

  const url = `${BASE_URL}/${rawPath}`;

  try {
    const response = await fetch(url, {
      method:  req.method,
      headers: {
        "Authorization": `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type":  "application/json",
      },
      body: ["POST", "PATCH", "PUT"].includes(req.method)
        ? JSON.stringify(req.body)
        : undefined,
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (e) {
    console.error("[airtable proxy] error:", e);
    return res.status(500).json({ error: "Proxy error" });
  }
}
