// emailService.js — Syncca

export async function sendVerificationCode(toEmail, code) {
  try {
    const res = await fetch("/api/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: toEmail, code }),
    });

    let data;
    try { data = await res.json(); }
    catch { data = { error: "non-json response" }; }

    if (!res.ok) {
      console.error("[emailService] error:", data);
      return { success: false, reason: "send_failed", error: data };
    }
    return { success: true };
  } catch (e) {
    console.error("[emailService] network error:", e.message);
    return { success: false, reason: "network_error" };
  }
}

export function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}
