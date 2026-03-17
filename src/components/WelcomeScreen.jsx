// WelcomeScreen.jsx — Syncca
import { useState } from "react";

const COLORS = {
  stone: "#F9F6EE", frame: "#E8E0F0",
  primary: "#C62828",
  secondary: "#757575", secondaryH: "#1e40af",
  text: "#1a1a1a", muted: "#6b7280",
};

const STONE_SHADOW = `
  0 2px 4px rgba(0,0,0,0.06),
  0 6px 12px rgba(0,0,0,0.07),
  0 18px 36px -6px rgba(0,0,0,0.11),
  0 40px 80px -16px rgba(0,0,0,0.14),
  inset 0 1px 0px rgba(255,255,255,0.90)
`;

// New horseshoe logo — gap at bottom, no rotation needed
const LogoSymbol = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="none">
    <path fill="#C62828" d="M 412.87 453.22 A 252 252 0 1 0 99.13 453.22 L 134.61 408.61 A 195 195 0 1 1 377.39 408.61 Z"/>
    <path fill="#757575" d="M 335.06 355.39 A 127 127 0 1 0 176.94 355.39 L 201.84 324.09 A 87 87 0 1 1 310.16 324.09 Z"/>
  </svg>
);

export default function WelcomeScreen({ userEmail = "", onEnter, onLogout }) {
  const [hovered, setHovered] = useState(false);

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
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .welcome-slab { animation: stoneRise 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .wr { opacity: 0; animation: fadeUp 0.5s ease both; }
        .wr:nth-child(1) { animation-delay: 0.20s; }
        .wr:nth-child(2) { animation-delay: 0.32s; }
        .wr:nth-child(3) { animation-delay: 0.44s; }
        .wr:nth-child(4) { animation-delay: 0.56s; }
        .wr:nth-child(5) { animation-delay: 0.66s; }
        .wr:nth-child(6) { animation-delay: 0.74s; }
      `}</style>

      <div style={{
        minHeight: "100dvh", height: "100dvh", background: COLORS.frame,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "10px", fontFamily: "'Alef', sans-serif",
      }}>
        <div className="welcome-slab" style={{
          background: COLORS.stone, borderRadius: "32px", boxShadow: STONE_SHADOW,
          width: "100%", maxWidth: "400px",
          height: "calc(100dvh - 20px)", maxHeight: "880px",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "space-between",
          padding: "clamp(44px,9vh,72px) clamp(28px,7vw,44px) clamp(36px,7vh,56px)",
          overflow: "hidden",
        }}>

          {/* TOP: Logo + Syncca + subtitle — tightly grouped */}
          <div className="wr" style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: "10px",
          }}>
            <LogoSymbol size={62} />
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2.8rem,9vw,3.4rem)",
              fontWeight: 700, color: COLORS.primary,
              letterSpacing: "-0.01em", lineHeight: 1,
            }}>Syncca</div>
            <div style={{
              fontFamily: "'Alef', sans-serif",
              fontSize: "clamp(1.25rem,4.2vw,1.5rem)",
              fontWeight: 700, color: COLORS.secondary,
              textAlign: "center", direction: "rtl", lineHeight: 1.3,
              marginTop: "2px",
            }}>המרחב שבו האהבה נושמת</div>
          </div>

          {/* MIDDLE: Body text — inverted triangle */}
          <div className="wr" style={{
            display: "flex", flexDirection: "column",
            alignItems: "center",
            paddingTop: "clamp(12px, 4vh, 28px)",
            gap: "0px", width: "100%",
          }}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: "6px", direction: "rtl", textAlign: "center",
              fontFamily: "'Alef', sans-serif",
              fontSize: "clamp(0.97rem,3.5vw,1.05rem)",
              color: COLORS.text, lineHeight: 1.8, opacity: 0.82,
            }}>
              <p style={{ maxWidth: "272px" }}>אנחנו כאן כדי לעזור להחליף את מאבקי הכוח שמכבים יום אחר יום את האהבה,</p>
              <p style={{ maxWidth: "200px" }}>בשפה של תקשורת ישירה ובוגרת,</p>
              <p style={{ maxWidth: "142px" }}>שרואה גם את האחר.</p>
            </div>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* BOTTOM: Button + footer */}
          <div className="wr" style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: "16px", width: "100%",
          }}>
            {/* Button — 75% width, continues triangle */}
            <button
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              onClick={onEnter}
              style={{
                background: hovered ? COLORS.primaryH : COLORS.primary,
                color: "#fff", border: "none", borderRadius: "9999px",
                fontFamily: "'Alef', sans-serif",
                fontSize: "1rem", fontWeight: 700,
                height: "52px", width: "75%", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                boxShadow: hovered ? "0 8px 28px rgba(30,58,138,0.38)" : "0 4px 18px rgba(30,58,138,0.28)",
                transform: hovered ? "translateY(-2px)" : "translateY(0)",
                transition: "all 0.18s ease",
              }}>
              <span>↺</span><span>שניכנס ל"סינק"?</span>
            </button>

            {userEmail && (
              <div style={{
                fontFamily: "'Alef', sans-serif", fontSize: "0.8rem",
                color: COLORS.muted, direction: "rtl", textAlign: "center",
              }}>
                <span>התנתקות מ-</span>
                <span style={{ color: COLORS.secondary, fontWeight: 600 }}>{userEmail}</span>
                {onLogout && <>
                  {" · "}
                  <button onClick={onLogout} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: COLORS.muted, fontSize: "0.78rem",
                    textDecoration: "underline", fontFamily: "'Alef', sans-serif",
                  }}>יציאה</button>
                </>}
              </div>
            )}

            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              fontFamily: "'Alef', sans-serif", fontSize: "0.6rem", fontWeight: 500,
              letterSpacing: "0.13em", textTransform: "uppercase", color: COLORS.#212121,
            }}>
              <span>BETA PHASE</span>
              <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: COLORS.secondary, opacity: 0.45 }} />
              <span>SECURE &amp; PRIVATE</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
