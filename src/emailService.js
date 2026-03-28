// emailService.js — Syncca
// קורא ל-Vercel serverless function שמדברת עם Resend

export async function sendVerificationCode(toEmail, code) {
  try {
    const res = await fetch("/api/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: toEmail, code }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[emailService] error:", data);
      return { success: false, reason: "send_failed", error: data };
    }

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
