// LoginScreen.jsx — Syncca · Heavy Stone Slab Edition
// Props: onLogin(email) => void, onBack () => void

import { useState } from "react";

const COLORS = {
  stone: "#F9F6EE", stoneLight: "#FCFAF5", frame: "#E8E0F0",
  primary: "#ea580c", primaryH: "#c2410c",
  secondary: "#1e3a8a",
  text: "#1a1a1a", muted: "#6b7280",
};

const STONE_SHADOW = `
  0 2px 4px rgba(0,0,0,0.06),
  0 6px 12px rgba(0,0,0,0.07),
  0 18px 36px -6px rgba(0,0,0,0.11),
  0 40px 80px -16px rgba(0,0,0,0.14),
  inset 0 1px 0px rgba(255,255,255,0.90)
`;

const LogoSymbol = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
    style={{ transform: "rotate(180deg)", display: "block" }}>
    <path d="M25 20C15 30 10 45 10 60C10 82 28 100 50 100C72 100 90 82 90 60C90 45 85 30 75 20C82 30 85 42 85 55C85 75 70 90 50 90C30 90 15 75 15 55C15 42 18 30 25 20Z" fill="#ea580c"/>
    <path d="M40 35C35 40 32 48 32 58C32 70 40 80 50 80C60 80 68 70 68 58C68 48 65 40 60 35C65 40 68 48 68 55C68 65 60 73 50 73C40 73 32 65 32 55C32 48 35 40 40 35Z" fill="#1e3a8a"/>
  </svg>
);

export default function LoginScreen({ onLogin, onBack }) {
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [btnHover, setBtnHover] = useState(false);

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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
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
        .lr:nth-child(2) { animation-delay: 0.28s; }
        .lr:nth-child(3) { animation-delay: 0.38s; }
        .lr:nth-child(4) { animation-delay: 0.48s; }
        .lr:nth-child(5) { animation-delay: 0.58s; }
        .lr:nth-child(6) { animation-delay: 0.66s; }

        .syncca-field {
          width: 100%; height: 52px;
          background: ${COLORS.stoneLight};
          border: 1.5px solid transparent;
          border-radius: 9999px;
          padding: 0 22px;
          font-family: 'Inter', sans-serif; font-size: 1rem;
          color: ${COLORS.text}; outline: none;
          transition: border-color 0.18s;
          direction: ltr; text-align: center;
        }
        .syncca-field:focus { border-color: ${COLORS.primary}; }
        .syncca-field.err   { border-color: #dc2626; }
        .syncca-field::placeholder { color: ${COLORS.muted}; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
      `}</style>

      <div style={{
        minHeight: "100dvh", height: "100dvh",
        background: COLORS.frame,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "10px", fontFamily: "'Inter', sans-serif",
      }}>
        <div className="login-slab" style={{
          background: COLORS.stone,
          borderRadius: "32px",
          boxShadow: STONE_SHADOW,
          width: "100%", maxWidth: "400px",
          height: "calc(100dvh - 20px)",
          maxHeight: "880px",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "space-between",
          padding: "clamp(44px,9vh,72px) clamp(28px,7vw,44px) clamp(36px,7vh,56px)",
          overflow: "hidden",
        }}>

          {/* TOP: Logo */}
          <div className="lr" style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: "12px",
          }}>
            <LogoSymbol size={60} />
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2.6rem,9vw,3.2rem)",
              fontWeight: 700, color: COLORS.primary,
              letterSpacing: "-0.01em", lineHeight: 1,
            }}>
              Syncca
            </div>
          </div>

          {/* MIDDLE: Heading + body */}
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: "14px",
            flex: 1, justifyContent: "center", width: "100%",
          }}>
            <div className="lr" style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(1.4rem,5vw,1.7rem)",
              fontWeight: 700, color: COLORS.secondary,
              direction: "rtl", textAlign: "center",
            }}>
              !ברוכים הבאים
            </div>

            <div className="lr" style={{
              width: "48px", height: "1.5px",
              background: `linear-gradient(90deg, transparent, ${COLORS.primary}50, transparent)`,
            }} />

            <div className="lr" style={{
              fontFamily: "'Inter', sans-serif", fontSize: "0.9rem",
              color: COLORS.text, textAlign: "center", lineHeight: 1.72,
              direction: "rtl", maxWidth: "290px", opacity: 0.82,
            }}>
              כדי להבטיח בקרת איכות ולשמור על התובנות – נבקש להזדהות.
            </div>
          </div>

          {/* BOTTOM: Input + button + footer */}
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: "14px", width: "100%",
          }}>
            {/* Label + input */}
            <div className="lr" style={{ width: "100%" }}>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.68rem", fontWeight: 600,
                color: COLORS.primary, letterSpacing: "0.09em",
                textTransform: "uppercase", textAlign: "right",
                direction: "rtl", marginBottom: "7px",
              }}>
                כתובת אימייל
              </div>
              <input
                className={`syncca-field${error ? " err" : ""}`}
                type="email" placeholder="your@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                autoComplete="email" inputMode="email"
              />
              {error && (
                <div style={{
                  color: "#dc2626", fontSize: "0.76rem",
                  textAlign: "right", direction: "rtl",
                  marginTop: "6px", paddingRight: "8px",
                }}>{error}</div>
              )}
            </div>

            {/* Submit */}
            <div className="lr" style={{ width: "100%" }}>
              <button
                onClick={handleSubmit} disabled={loading}
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
                style={{
                  background: loading ? "#f97316" : (btnHover ? COLORS.primaryH : COLORS.primary),
                  color: "#fff", border: "none", borderRadius: "9999px",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "1rem", fontWeight: 600,
                  height: "56px", width: "100%",
                  cursor: loading ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  boxShadow: btnHover && !loading
                    ? "0 8px 28px rgba(234,88,12,0.40)"
                    : "0 4px 18px rgba(234,88,12,0.28)",
                  transform: btnHover && !loading ? "translateY(-2px)" : "translateY(0)",
                  transition: "all 0.18s ease",
                }}>
                {loading ? <div className="spinner" /> : <><span>✦</span><span>שמור והתחל שיחה</span></>}
              </button>
            </div>

            {/* Security */}
            <div className="lr" style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.6rem", fontWeight: 500,
              letterSpacing: "0.13em", textTransform: "uppercase",
              color: COLORS.primary, textAlign: "center",
            }}>
              SECURE &amp; PRIVATE CONNECTION
            </div>

            {/* Back */}
            {onBack && (
              <div className="lr">
                <button onClick={onBack} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: COLORS.muted, fontSize: "0.82rem",
                  fontFamily: "'Inter', sans-serif",
                  textDecoration: "underline", textDecorationColor: "#d1d5db",
                }}>
                  חזרה למסך הבית
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
