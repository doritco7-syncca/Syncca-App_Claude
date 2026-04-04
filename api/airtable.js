// api/airtable.js — Vercel Serverless Function
// Proxy לכל קריאות Airtable — מסתיר את ה-API key מהדפדפן

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE  = process.env.AIRTABLE_BASE_ID;
const BASE_URL       = `https://api.airtable.com/v0/${AIRTABLE_BASE}`;

export default async function handler(req, res) {
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE) {
    return res.status(500).json({ error: "Missing Airtable configuration" });
  }

  // FIX: extract raw (still-encoded) path WITHOUT using searchParams.get()
  // because searchParams.get() decodes %5B%5D → [] which Airtable rejects with 422.
  const rawQuery = req.url.split("?")[1] || "";
  const pathMatch = rawQuery.match(/(?:^|&)path=([^&]*)/);
  const rawPath = pathMatch ? pathMatch[1] : null;

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
