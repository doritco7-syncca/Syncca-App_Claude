// emailService.js — Syncca
// שולח קוד אימות באמצעות Resend API

const RESEND_API_KEY = process.env.REACT_APP_RESEND_API_KEY;
const FROM_EMAIL     = "syncca@syncca.app"; // צריך להיות מאומת ב-Resend

export async function sendVerificationCode(toEmail, code) {
  if (!RESEND_API_KEY) {
    console.warn("[emailService] No RESEND_API_KEY — skipping email send");
    return { success: false, reason: "no_api_key" };
  }

  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #F9F6EE; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-family: 'Georgia', serif; font-size: 2rem; font-weight: 700; color: #C62828;">Syncca</span>
      </div>
      <p style="font-size: 1rem; color: #1a1a1a; line-height: 1.7; text-align: right;">
        שלום! כדי להיכנס לשיחה עם סינקה, נא להשתמש בקוד הבא:
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <span style="font-size: 2.8rem; font-weight: 700; letter-spacing: 0.3em; color: #C62828; background: #FFCDD2; padding: 12px 24px; border-radius: 12px;">
          ${code}
        </span>
      </div>
      <p style="font-size: 0.9rem; color: #757575; text-align: center;">
        הקוד תקף ל-10 דקות. 😊 אני, סינקה, כבר כאן.
      </p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      [toEmail],
        subject: "קוד הגישה שלך לסינקה",
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("[emailService] Resend error:", err);
      return { success: false, reason: "send_failed", error: err };
    }

    const data = await res.json();
    console.log("[emailService] ✓ Email sent:", data.id);
    return { success: true, id: data.id };
  } catch (e) {
    console.error("[emailService] fetch error:", e);
    return { success: false, reason: "network_error" };
  }
}

export function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}
