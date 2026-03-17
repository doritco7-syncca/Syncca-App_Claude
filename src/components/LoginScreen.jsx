// LoginScreen.jsx — Syncca
import { useState } from "react";

const COLORS = {
  stone: "#F9F6EE", stoneLight: "#FCFAF5", frame: "#E8E0F0",
  primary: "#C62828",
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

const LogoSymbol = ({ size = 62 }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="none">
    <path fill="#C62828" d="M 412.87 453.22 A 252 252 0 1 0 99.13 453.22 L 134.61 408.61 A 195 195 0 1 1 377.39 408.61 Z"/>
    <path fill="#757575" d="M 335.06 355.39 A 127 127 0 1 0 176.94 355.39 L 201.84 324.09 A 87 87 0 1 1 310.16 324.09 Z"/>
  </svg>
);

const TERMS_TEXT = [
  "השימוש בסינקה מיועד למשתמשים מעל גיל 18 בלבד.",
  "המידע והליווי הניתנים על ידי סינקה מבוססים על בינה מלאכותית ונועדו למטרות העשרה, למידה ושיפור התקשורת הבין-אישית בלבד.",
  "סינקה אינה מהווה תחליף לטיפול פסיכולוגי, ייעוץ זוגי מקצועי או ייעוץ רפואי כלשהו.",
  "השירות אינו מיועד למצבי משבר נפשי דחופים או למקרים הכוללים אלימות. במצבי חירום יש לפנות לגורמים המוסמכים.",
  "השימוש בסינקה ובכלים המוצעים בה הוא באחריות המשתמש/ת בלבד.",
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
          fontFamily: "'Alef', sans-serif", fontSize: "1.1rem", fontWeight: 700,
          color: "#757575", marginBottom: "16px", textAlign: "center",
        }}>תנאי שימוש — סינקה</div>
        {TERMS_TEXT.map((para, i) => (
          <p key={i} style={{
            fontFamily: "'Alef', sans-serif", fontSize: "0.86rem",
            color: "#1a1a1a", lineHeight: 1.7, marginBottom: "12px",
          }}>{para}</p>
        ))}
        <button onClick={onClose} style={{
          marginTop: "8px", width: "100%",
          background: "#757575", color: "white", border: "none",
          borderRadius: 9999, padding: "12px", cursor: "pointer",
          fontFamily: "'Alef', sans-serif", fontSize: "0.9rem", fontWeight: 600,
        }}>הבנתי, סגור</button>
      </div>
    </div>
  );
}

export default function LoginScreen({ onLogin, onBack }) {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [btnHover, setBtnHover] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleSubmit() {
    if (!isValid) { setError("נא להזין כתובת אימייל תקינה"); return; }
    setError(""); setLoading(true);
    try { await onLogin?.(email.trim()); }
    catch { setError("אירעה שגיאה, נסי שוב"); }
    finally { setLoading(false); }
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
          width: 100%; height: 52px;
          background: #FCFAF5; border: 1.5px solid transparent;
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
          padding: "clamp(44px,9vh,72px) clamp(28px,7vw,44px) clamp(36px,7vh,56px)",
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
            }}>ברוכים הבאים!</div>
          </div>

          {/* MIDDLE: Body text */}
          <div className="lr" style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", width: "100%",
          }}>
            <div style={{
              fontFamily: "'Alef', sans-serif", fontSize: "0.9rem",
              color: COLORS.text, textAlign: "center", lineHeight: 1.72,
              direction: "rtl", maxWidth: "290px", opacity: 0.82,
            }}>
              כדי להבטיח בקרת איכות ולשמור על התובנות – נבקש להזדהות.
            </div>
          </div>

          {/* BOTTOM: Input + button + footer */}
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: "12px", width: "100%",
          }}>
            <div className="lr" style={{ width: "100%" }}>
              <div style={{
                fontFamily: "'Alef', sans-serif", fontSize: "0.68rem", fontWeight: 700,
                color: COLORS.secondary, letterSpacing: "0.09em", textTransform: "uppercase",
                textAlign: "right", direction: "rtl", marginBottom: "7px",
              }}>כתובת אימייל</div>
              <input
                className={`syncca-field${error ? " err" : ""}`}
                type="email" placeholder="your@email.com" value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                autoComplete="email" inputMode="email"
              />
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
              <button onClick={handleSubmit} disabled={loading}
                onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}
                style={{
                  background: loading ? COLORS.secondaryH : (btnHover ? COLORS.secondaryH : COLORS.secondary),
                  color: "#fff", border: "none", borderRadius: "9999px",
                  fontFamily: "'Alef', sans-serif", fontSize: "1rem", fontWeight: 700,
                  height: "36px", width: "75%", cursor: loading ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  boxShadow: btnHover && !loading ? "0 8px 28px rgba(117,117,117,0.38)" : "0 4px 18px rgba(117,117,117,0.28)",
                  transform: btnHover && !loading ? "translateY(-2px)" : "translateY(0)",
                  transition: "all 0.18s ease",
                }}>
                {loading ? <div className="spinner" /> : <><span>✦</span><span>שמור והתחל שיחה</span></>}
              </button>
            </div>

            {/* Disclaimer */}
            <div className="lr" style={{
              fontFamily: "'Alef', sans-serif", fontSize: "0.72rem", color: COLORS.muted,
              textAlign: "center", direction: "rtl", lineHeight: 1.6, maxWidth: "280px",
            }}>
              השימוש מיועד למשתמשים מעל גיל 18. סינקה אינה תחליף לטיפול מקצועי.{" "}
              <button onClick={() => setShowTerms(true)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: COLORS.secondary, fontFamily: "'Alef', sans-serif",
                fontSize: "0.72rem", textDecoration: "underline", padding: 0,
              }}>תנאי שימוש</button>
            </div>

            <div className="lr" style={{
              fontFamily: "'Alef', sans-serif", fontSize: "0.6rem", fontWeight: 700,
              letterSpacing: "0.13em", textTransform: "uppercase",
              color: COLORS.primary, textAlign: "center",
            }}>SECURE &amp; PRIVATE CONNECTION</div>

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
