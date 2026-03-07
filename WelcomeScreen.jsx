// WelcomeScreen.jsx — Syncca · Heavy Stone Slab Edition
// Props: userEmail (string), onEnter (fn), onLogout (fn)

import { useState } from "react";

const COLORS = {
  stone: "#F9F6EE", stoneLight: "#FCFAF5", frame: "#E8E0F0",
  primary: "#ea580c", primaryH: "#c2410c",
  secondary: "#1e3a8a", secondaryH: "#1e40af",
  text: "#1a1a1a", muted: "#6b7280",
};

const STONE_SHADOW = `
  0 2px 4px rgba(0,0,0,0.06),
  0 6px 12px rgba(0,0,0,0.07),
  0 18px 36px -6px rgba(0,0,0,0.11),
  0 40px 80px -16px rgba(0,0,0,0.14),
  inset 0 1px 0px rgba(255,255,255,0.90)
`;

const LogoSymbol = ({ size = 72 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
    style={{ transform: "rotate(180deg)", display: "block" }}>
    <path d="M25 20C15 30 10 45 10 60C10 82 28 100 50 100C72 100 90 82 90 60C90 45 85 30 75 20C82 30 85 42 85 55C85 75 70 90 50 90C30 90 15 75 15 55C15 42 18 30 25 20Z" fill="#ea580c"/>
    <path d="M40 35C35 40 32 48 32 58C32 70 40 80 50 80C60 80 68 70 68 58C68 48 65 40 60 35C65 40 68 48 68 55C68 65 60 73 50 73C40 73 32 65 32 55C32 48 35 40 40 35Z" fill="#1e3a8a"/>
  </svg>
);

export default function WelcomeScreen({ userEmail = "", onEnter, onLogout }) {
  const [hovered, setHovered] = useState(false);

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
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .welcome-slab { animation: stoneRise 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .wr { opacity: 0; animation: fadeUp 0.5s ease both; }
        .wr:nth-child(1) { animation-delay: 0.20s; }
        .wr:nth-child(2) { animation-delay: 0.30s; }
        .wr:nth-child(3) { animation-delay: 0.40s; }
        .wr:nth-child(4) { animation-delay: 0.50s; }
        .wr:nth-child(5) { animation-delay: 0.60s; }
        .wr:nth-child(6) { animation-delay: 0.70s; }
        .wr:nth-child(7) { animation-delay: 0.78s; }
      `}</style>

      <div style={{
        minHeight: "100dvh", height: "100dvh",
        background: COLORS.frame,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "10px", fontFamily: "'Inter', sans-serif",
      }}>
        <div className="welcome-slab" style={{
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

          {/* TOP: Logo block */}
          <div className="wr" style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: "12px",
          }}>
            <LogoSymbol size={68} />
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2.8rem,9vw,3.4rem)",
              fontWeight: 700, color: COLORS.primary,
              letterSpacing: "-0.01em", lineHeight: 1,
            }}>
              Syncca
            </div>
          </div>

          {/* MIDDLE: Tagline + rule + body */}
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: "20px",
            flex: 1, justifyContent: "center",
            width: "100%",
          }}>
            <div className="wr" style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(1.3rem,4.5vw,1.6rem)",
              fontWeight: 700, color: COLORS.secondary,
              textAlign: "center", direction: "rtl", lineHeight: 1.35,
            }}>
              המרחב שבו האהבה נושמת
            </div>

            <div className="wr" style={{
              width: "52px", height: "1.5px",
              background: `linear-gradient(90deg, transparent, ${COLORS.primary}55, transparent)`,
            }} />

            <div className="wr" style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(0.87rem,3vw,0.96rem)",
              color: COLORS.text, textAlign: "center",
              lineHeight: 1.78, direction: "rtl",
              maxWidth: "300px", opacity: 0.82,
            }}>
              אנחנו כאן כדי לעזור להחליף את מאבקי הכוח שמכבים יום אחר יום את האהבה,
              בשפה של תקשורת ישירה ובוגרת, שרואה גם את העצמי וגם את האחר.
            </div>
          </div>

          {/* BOTTOM: Button + footer */}
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: "16px", width: "100%",
          }}>
            <div className="wr" style={{ width: "100%" }}>
              <button
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={onEnter}
                style={{
                  background: hovered ? COLORS.secondaryH : COLORS.secondary,
                  color: "#fff", border: "none", borderRadius: "9999px",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "1rem", fontWeight: 600,
                  height: "56px", width: "100%", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  boxShadow: hovered
                    ? "0 8px 28px rgba(30,58,138,0.38)"
                    : "0 4px 18px rgba(30,58,138,0.28)",
                  transform: hovered ? "translateY(-2px)" : "translateY(0)",
                  transition: "all 0.18s ease",
                }}>
                <span>↺</span>
                <span>שניכנס ל"סינק"?</span>
              </button>
            </div>

            {userEmail && (
              <div className="wr" style={{
                fontFamily: "'Inter', sans-serif", fontSize: "0.8rem",
                color: COLORS.muted, direction: "rtl", textAlign: "center",
              }}>
                <span>התנתקות מ-</span>
                <span style={{ color: COLORS.secondary, fontWeight: 600 }}>{userEmail}</span>
                {onLogout && <>
                  {" · "}
                  <button onClick={onLogout} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: COLORS.muted, fontSize: "0.78rem",
                    textDecoration: "underline", fontFamily: "'Inter', sans-serif",
                  }}>יציאה</button>
                </>}
              </div>
            )}

            <div className="wr" style={{
              display: "flex", alignItems: "center", gap: "8px",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.6rem", fontWeight: 500,
              letterSpacing: "0.13em", textTransform: "uppercase",
              color: COLORS.primary,
            }}>
              <span>BETA PHASE</span>
              <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: COLORS.primary, opacity: 0.45 }} />
              <span>SECURE &amp; PRIVATE</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
