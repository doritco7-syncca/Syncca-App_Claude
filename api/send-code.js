// api/send-code.js — Vercel Serverless Function

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, code } = req.body || {};
  if (!to || !code) {
    return res.status(400).json({ error: "Missing to or code" });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error("[send-code] RESEND_API_KEY not set");
    return res.status(500).json({ error: "Server configuration error: missing API key" });
  }

  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#F9F6EE;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-family:Georgia,serif;font-size:2rem;font-weight:700;color:#C62828;">Syncca</span>
      </div>
      <p style="font-size:1rem;color:#1a1a1a;line-height:1.7;text-align:right;">
        שלום! כדי להיכנס לשיחה עם סינקה, נא להשתמש בקוד הבא:
      </p>
      <div style="text-align:center;margin:28px 0;">
        <span style="font-size:2.8rem;font-weight:700;letter-spacing:0.3em;color:#C62828;background:#FFCDD2;padding:12px 24px;border-radius:12px;">
          ${code}
        </span>
      </div>
      <p style="font-size:0.9rem;color:#757575;text-align:center;">
        הקוד תקף ל-10 דקות. 😊 אני, סינקה, כבר כאן.
      </p>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    "Syncca <noreply@syncca.app>",
        to:      [to],
        subject: `${code} — קוד הגישה שלך לסינקה`,
        html,
      }),
    });

    let data;
    try { data = await response.json(); }
    catch { data = { message: "non-json response from Resend" }; }

    if (!response.ok) {
      console.error("[send-code] Resend error:", data);
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (e) {
    console.error("[send-code] error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
