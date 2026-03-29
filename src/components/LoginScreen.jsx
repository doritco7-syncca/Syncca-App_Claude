// LoginScreen.jsx — Syncca
import { useState } from "react";

const COLORS = {
  stone: "#F9F6EE", stoneLight: "#FCFAF5", frame: "#E8E0F0",
  primary: "#C62828", primaryHover: "#B71C1C",
  secondary: "#757575", secondaryH: "#616161",
  text: "#1a1a1a", muted: "#6b7280",
};

const STONE_SHADOW = `
  0 2px 4px rgba(0,0,0,0.06),
  0 6px 12px rgba(0,0,0,0.07),
  0 18px 36px -6px rgba(0,0,0,0.11),
  0 40px 80px -16px rgba(0,0,0,0.14),
  inset 0 1px 0px rgba(255,255,255,0.90)
`;

const LogoSymbol = ({ size = 64 }) => (
  <svg width={size} height={size * 289/357} viewBox="0 0 357 289" fill="none">
    <path fill="#C62828" d="M 177.98 13.80 C 185.90 13.76 193.02 16.01 200.74 17.42 C 208.14 19.43 215.55 22.00 222.24 25.77 C 241.68 35.95 258.08 52.59 270.53 70.47 C 289.26 96.82 301.12 126.36 309.31 157.49 C 311.25 165.56 313.46 173.52 314.53 181.78 C 316.20 189.97 317.68 198.14 318.27 206.49 C 318.90 215.83 320.96 224.65 320.99 234.00 C 321.03 240.76 320.99 247.52 321.00 254.29 C 310.69 247.14 300.61 239.65 290.31 232.49 C 289.24 222.32 288.03 212.18 286.84 202.03 C 286.10 193.54 283.67 185.38 282.47 176.94 C 279.31 164.12 276.28 151.06 271.41 138.76 C 264.67 119.21 255.01 100.82 242.93 84.04 C 235.97 74.73 227.91 66.35 218.62 59.35 C 212.47 54.88 205.53 51.42 198.53 48.52 C 187.82 44.26 176.29 43.95 165.08 46.17 C 151.65 49.07 138.95 56.77 128.59 65.62 C 121.81 71.41 116.61 78.23 111.28 85.30 C 90.71 113.36 79.04 146.42 71.96 180.21 C 69.75 188.60 69.32 197.01 67.72 205.47 C 66.08 213.13 66.23 221.20 65.31 229.03 C 65.08 230.30 65.16 232.14 64.11 233.04 C 60.76 236.39 56.38 238.66 52.75 241.75 C 49.42 244.64 45.59 246.30 42.67 249.64 C 40.52 252.23 37.38 252.96 34.37 254.28 C 34.48 244.24 33.80 233.88 34.98 224.00 C 35.77 217.61 35.43 211.35 36.72 205.02 C 38.57 196.30 38.88 187.44 40.89 178.76 C 42.62 171.77 43.53 164.66 45.69 157.77 C 48.50 146.06 52.47 134.79 56.45 123.43 C 64.44 104.11 73.94 84.28 86.44 67.45 C 97.38 52.83 110.77 38.97 126.42 29.40 C 131.35 26.00 136.88 23.46 142.49 21.40 C 147.52 19.95 151.78 17.54 156.99 16.86 C 164.21 15.83 170.56 13.41 177.98 13.80 Z"/>
    <path fill="#757575" d="M 193.03 66.99 C 205.13 70.58 216.03 78.27 224.55 87.46 C 238.86 102.30 248.21 121.75 254.99 141.02 C 260.21 154.98 263.19 169.22 266.15 183.77 C 267.29 190.58 267.58 197.44 268.67 204.26 C 269.42 208.93 270.07 213.60 270.50 218.32 C 261.09 211.52 251.93 204.41 242.60 197.52 C 241.76 192.57 240.51 187.70 239.60 182.77 C 236.79 165.83 231.43 149.26 224.37 133.64 C 219.07 121.94 212.13 111.10 202.77 102.23 C 196.23 95.56 187.23 91.36 178.05 90.04 C 169.59 90.69 161.21 94.20 154.81 99.78 C 144.30 108.76 136.33 121.10 130.57 133.56 C 122.02 152.08 116.94 171.78 113.54 191.84 C 113.08 194.68 111.25 196.43 109.10 198.13 C 101.01 204.47 92.70 210.60 84.88 217.27 C 86.09 207.71 86.15 198.17 88.40 188.75 C 89.55 178.72 91.88 168.97 94.30 159.19 C 100.48 137.46 108.07 116.88 121.40 98.42 C 125.69 92.61 130.41 86.60 136.01 82.02 C 142.16 77.05 147.95 72.31 155.42 69.41 C 167.23 64.14 180.66 62.87 193.03 66.99 Z"/>
  </svg>
);

const TERMS_TEXT = [
  "השימוש בסינקה מיועד למשתמשים מעל גיל 18 בלבד.",
  "המידע והליווי הניתנים על ידי סינקה מבוססים על בינה מלאכותית ונועדו למטרות העשרה, למידה ושיפור התקשורת הבין-אישית בלבד.",
  "סינקה אינה מהווה תחליף לטיפול פסיכולוגי, ייעוץ זוגי מקצועי או ייעוץ רפואי כלשהו.",
  "השירות אינו מיועד למצבי משבר נפשי דחופים או למקרים הכוללים אלימות. במצבי חירום יש לפנות לגורמים המוסמכים.",
  "השימוש בסינקה ובכלים המוצעים בה הוא באחריות המשתמשים בלבד.",
];

function TermsModal({ onClose }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(117,117,117,0.18)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#F9F6EE", borderRadius: 24,
        padding: "32px 28px", maxWidth: 400, width: "100%",
        maxHeight: "80vh", overflowY: "auto",
        boxShadow: STONE_SHADOW, direction: "rtl",
      }}>
        <div style={{
          fontFamily: "'Alef', sans-serif", fontSize: "1rem", fontWeight: 700,
          color: "#757575", marginBottom: "16px", textAlign: "center",
        }}>תנאי שימוש — סינקה</div>
        {TERMS_TEXT.map((para, i) => (
          <p key={i} style={{
            fontFamily: "'Alef', sans-serif", fontSize: "0.72rem",
            color: "#1a1a1a", lineHeight: 1.7, marginBottom: "12px",
          }}>{para}</p>
        ))}
        <button onClick={onClose} style={{
          marginTop: "8px", width: "100%",
          background: "#C62828", color: "white", border: "none",
          borderRadius: 9999, padding: "12px", cursor: "pointer",
          fontFamily: "'Alef', sans-serif", fontSize: "0.9rem", fontWeight: 600,
        }}>הבנתי, אפשר לסגור</button>
      </div>
    </div>
  );
}

export default function LoginScreen({ onLogin, onBack }) {
  const [email, setEmail]         = useState("");
  const [code, setCode]           = useState("");
  const [step, setStep]           = useState("email"); // "email" | "verify"
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [btnHover, setBtnHover]   = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleSendCode() {
    if (!isValidEmail) { setError("נא להזין כתובת אימייל תקינה"); return; }
    setError(""); setLoading(true);
    try {
      const { generateCode, sendVerificationCode } = await import("../emailService");
      const { saveVerificationCode } = await import("../AirtableService");
      const newCode = generateCode();
      await saveVerificationCode(email.trim(), newCode);
      const result = await sendVerificationCode(email.trim(), newCode);
      if (!result.success) {
        setError("שגיאה בשליחת הקוד, נסי שוב");
      } else {
        setStep("verify");
      }
    } catch (e) {
      console.error("[handleSendCode]", e);
      setError("אירעה שגיאה, נסי שוב");
    } finally { setLoading(false); }
  }

  async function handleVerifyCode() {
    if (code.length !== 4) { setError("נא להזין קוד בן 4 ספרות"); return; }
    setError(""); setLoading(true);
    try {
      const { verifyCode } = await import("../AirtableService");
      const result = await verifyCode(email.trim(), code.trim());
      if (!result.success) {
        setError(result.reason === "wrong_code" ? "הקוד שגוי, נסי שוב" : "משהו השתבש, נסי שוב");
      } else {
        await onLogin?.(email.trim());
      }
    } catch (e) {
      console.error("[handleVerifyCode]", e);
      setError("אירעה שגיאה, נסי שוב");
    } finally { setLoading(false); }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Alef:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        @keyframes stoneRise {
          from { opacity: 0; transform: translateY(28px) scale(0.982); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .login-slab { animation: stoneRise 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .lr { opacity: 0; animation: fadeUp 0.48s ease both; }
        .lr:nth-child(1) { animation-delay: 0.18s; }
        .lr:nth-child(2) { animation-delay: 0.30s; }
        .lr:nth-child(3) { animation-delay: 0.42s; }
        .lr:nth-child(4) { animation-delay: 0.54s; }
        .lr:nth-child(5) { animation-delay: 0.64s; }
        .lr:nth-child(6) { animation-delay: 0.72s; }
        .syncca-field {
          width: 100%; height: clamp(42px, 7vh, 52px);
          background: #f0fdf4; border: 1.5px solid transparent;
          border-radius: 9999px; padding: 0 22px;
          font-family: 'Alef', sans-serif; font-size: 1rem;
          color: #1a1a1a; outline: none; transition: border-color 0.18s;
          direction: ltr; text-align: center;
        }
        .syncca-field:focus { border-color: #757575; }
        .syncca-field.err   { border-color: #dc2626; }
        .syncca-field::placeholder { color: #6b7280; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
      `}</style>

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}

      <div style={{
        minHeight: "100dvh", height: "100dvh", background: COLORS.frame,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "10px", fontFamily: "'Alef', sans-serif",
      }}>
        <div className="login-slab" style={{
          background: COLORS.stone, borderRadius: "32px", boxShadow: STONE_SHADOW,
          width: "100%", maxWidth: "400px",
          height: "calc(100dvh - 20px)", maxHeight: "880px",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "space-between",
          padding: "clamp(28px,7vh,72px) clamp(28px,7vw,44px) clamp(36px,7vh,56px)",
          overflow: "hidden",
        }}>

          {/* TOP: Logo + Syncca + heading — same structure as WelcomeScreen */}
          <div className="lr" style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: "10px",
          }}>
            <LogoSymbol size={62} />
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2.8rem,9vw,3.4rem)", fontWeight: 700,
              color: COLORS.primary, letterSpacing: "-0.01em", lineHeight: 1,
            }}>Syncca</div>
            {/* ! at end = appears on LEFT in RTL */}
            <div style={{
              fontFamily: "'Alef', sans-serif",
              fontSize: "clamp(1.25rem,4.2vw,1.5rem)",
              fontWeight: 700, color: COLORS.secondary,
              direction: "rtl", textAlign: "center", lineHeight: 1.3,
              marginTop: "2px",
            }}>טוב שהגעת!</div>
          </div>

          {/* MIDDLE+BOTTOM: Input + button + footer — centered */}
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: "12px", width: "100%",
          }}>
            <div className="lr" style={{ width: "100%" }}>
              <div style={{
                fontFamily: "'Alef', sans-serif", fontSize: "0.82rem",
                color: COLORS.secondary,
                textAlign: "center", direction: "rtl", marginBottom: "10px",
                lineHeight: 1.6,
              }}>
                {step === "email"
                  ? <>כדי שסינקה תוכל לשמור עבורך על רצף השיחות והתובנות<br/>— נבקש להזדהות</>
                  : <>שלחנו קוד בן 4 ספרות לכתובת<br/><strong>{email}</strong></>
                }
              </div>
              {step === "email" ? (
                <input
                  className={`syncca-field${error ? " err" : ""}`}
                  type="email" placeholder="your@email.com" value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleSendCode()}
                  autoComplete="email" inputMode="email"
                />
              ) : (
                <input
                  className={`syncca-field${error ? " err" : ""}`}
                  type="text" placeholder="_ _ _ _" value={code}
                  onChange={e => { setCode(e.target.value.replace(/\D/g,"")); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleVerifyCode()}
                  maxLength={4} inputMode="numeric"
                  style={{ textAlign: "center", letterSpacing: "0.5em", fontSize: "1.8rem", fontFamily: "'Courier New', monospace", fontWeight: 700 }}
                />
              )}
              {error && (
                <div style={{
                  color: "#dc2626", fontSize: "0.76rem", textAlign: "right",
                  direction: "rtl", marginTop: "6px", paddingRight: "8px",
                  fontFamily: "'Alef', sans-serif",
                }}>{error}</div>
              )}
            </div>

            {/* Button — 75% width, blue */}
            <div className="lr" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
              <button onClick={step === "email" ? handleSendCode : handleVerifyCode} disabled={loading}
                onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}
                style={{
                  background: loading ? COLORS.primaryHover : (btnHover ? COLORS.primaryHover : COLORS.primary),
                  color: "#fff", border: "none", borderRadius: "9999px",
                  fontFamily: "'Alef', sans-serif", fontSize: "1rem", fontWeight: 700,
                  height: "36px", width: "75%", cursor: loading ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  boxShadow: btnHover && !loading ? "0 8px 28px rgba(198,40,40,0.35)" : "0 4px 18px rgba(198,40,40,0.25)",
                  transform: btnHover && !loading ? "translateY(-2px)" : "translateY(0)",
                  transition: "all 0.18s ease",
                }}>
                {loading
                    ? <div className="spinner" />
                    : step === "email"
                      ? <><span>✦</span><span>שלחי לי קוד</span></>
                      : <><span>✦</span><span>כניסה לסינקה</span></>
                  }
              </button>
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Disclaimer — bottom, red border */}
            <div className="lr" style={{
              fontFamily: "'Alef', sans-serif", fontSize: "0.79rem", color: COLORS.muted,
              textAlign: "center", direction: "rtl", lineHeight: 1.7, maxWidth: "280px",
              border: "1px solid rgba(198,40,40,0.4)", borderRadius: "10px",
              padding: "10px 14px", marginTop: "8px",
            }}>
              השימוש מיועד לגיל 18 ומעלה. סינקה נועדה ללמידה והתפתחות אישית ואינה מהווה תחליף לייעוץ פסיכולוגי או רפואי מקצועי. השימוש באפליקציה מהווה הסכמה ל
              <button onClick={() => setShowTerms(true)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: COLORS.primary, fontFamily: "'Alef', sans-serif",
                fontSize: "0.87rem", fontWeight: 700, textDecoration: "underline", padding: "0 2px",
              }}>תנאי השימוש</button>
            </div>

            <div className="lr" style={{
              fontFamily: "'Alef', sans-serif", fontSize: "0.6rem", fontWeight: 700,
              letterSpacing: "0.13em", textTransform: "uppercase",
              color: COLORS.primary, textAlign: "center",
            }}>SECURE &amp; PRIVATE CONNECTION</div>
            {step === "verify" && (
              <button onClick={() => { setStep("email"); setCode(""); setError(""); }}
                style={{ background:"none", border:"none", cursor:"pointer",
                  fontFamily:"'Alef', sans-serif", fontSize:"0.78rem",
                  color: COLORS.muted, direction:"rtl" }}>
                ← שנה כתובת אימייל
              </button>
            )}

            {onBack && (
              <div className="lr">
                <button onClick={onBack} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: COLORS.muted, fontSize: "0.82rem", fontFamily: "'Alef', sans-serif",
                  textDecoration: "underline", textDecorationColor: "#d1d5db",
                }}>חזרה למסך הבית</button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
