// SplashScreen.jsx — Syncca
// מוצג פעם אחת בעת טעינת האפליקציה, נעלם אחרי האנימציה

import { useEffect, useState } from "react";

const LogoSymbol = ({ size = 120 }) => (
  <svg width={size} height={size * 289/357} viewBox="0 0 357 289" fill="none">
    <path fill="#C62828" d="M 177.98 13.80 C 185.90 13.76 193.02 16.01 200.74 17.42 C 208.14 19.43 215.55 22.00 222.24 25.77 C 241.68 35.95 258.08 52.59 270.53 70.47 C 289.26 96.82 301.12 126.36 309.31 157.49 C 311.25 165.56 313.46 173.52 314.53 181.78 C 316.20 189.97 317.68 198.14 318.27 206.49 C 318.90 215.83 320.96 224.65 320.99 234.00 C 321.03 240.76 320.99 247.52 321.00 254.29 C 310.69 247.14 300.61 239.65 290.31 232.49 C 289.24 222.32 288.03 212.18 286.84 202.03 C 286.10 193.54 283.67 185.38 282.47 176.94 C 279.31 164.12 276.28 151.06 271.41 138.76 C 264.67 119.21 255.01 100.82 242.93 84.04 C 235.97 74.73 227.91 66.35 218.62 59.35 C 212.47 54.88 205.53 51.42 198.53 48.52 C 187.82 44.26 176.29 43.95 165.08 46.17 C 151.65 49.07 138.95 56.77 128.59 65.62 C 121.81 71.41 116.61 78.23 111.28 85.30 C 90.71 113.36 79.04 146.42 71.96 180.21 C 69.75 188.60 69.32 197.01 67.72 205.47 C 66.08 213.13 66.23 221.20 65.31 229.03 C 65.08 230.30 65.16 232.14 64.11 233.04 C 60.76 236.39 56.38 238.66 52.75 241.75 C 49.42 244.64 45.59 246.30 42.67 249.64 C 40.52 252.23 37.38 252.96 34.37 254.28 C 34.48 244.24 33.80 233.88 34.98 224.00 C 35.77 217.61 35.43 211.35 36.72 205.02 C 38.57 196.30 38.88 187.44 40.89 178.76 C 42.62 171.77 43.53 164.66 45.69 157.77 C 48.50 146.06 52.47 134.79 56.45 123.43 C 64.44 104.11 73.94 84.28 86.44 67.45 C 97.38 52.83 110.77 38.97 126.42 29.40 C 131.35 26.00 136.88 23.46 142.49 21.40 C 147.52 19.95 151.78 17.54 156.99 16.86 C 164.21 15.83 170.56 13.41 177.98 13.80 Z"/>
    <path fill="#757575" d="M 193.03 66.99 C 205.13 70.58 216.03 78.27 224.55 87.46 C 238.86 102.30 248.21 121.75 254.99 141.02 C 260.21 154.98 263.19 169.22 266.15 183.77 C 267.29 190.58 267.58 197.44 268.67 204.26 C 269.42 208.93 270.07 213.60 270.50 218.32 C 261.09 211.52 251.93 204.41 242.60 197.52 C 241.76 192.57 240.51 187.70 239.60 182.77 C 236.79 165.83 231.43 149.26 224.37 133.64 C 219.07 121.94 212.13 111.10 202.77 102.23 C 196.23 95.56 187.23 91.36 178.05 90.04 C 169.59 90.69 161.21 94.20 154.81 99.78 C 144.30 108.76 136.33 121.10 130.57 133.56 C 122.02 152.08 116.94 171.78 113.54 191.84 C 113.08 194.68 111.25 196.43 109.10 198.13 C 101.01 204.47 92.70 210.60 84.88 217.27 C 86.09 207.71 86.15 198.17 88.40 188.75 C 89.55 178.72 91.88 168.97 94.30 159.19 C 100.48 137.46 108.07 116.88 121.40 98.42 C 125.69 92.61 130.41 86.60 136.01 82.02 C 142.16 77.05 147.95 72.31 155.42 69.41 C 167.23 64.14 180.66 62.87 193.03 66.99 Z"/>
  </svg>
);

export default function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // אנימציה: 3s + 0.4s המתנה + 0.6s fade out
    const fadeTimer  = setTimeout(() => setFading(true),  3400);
    const doneTimer  = setTimeout(() => onDone?.(),       4000);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <>
      <style>{`
        @keyframes logo-antics {
          /* שלב 1: מותח רגל ימין — מתלבט אם לעשות את זה */
          0%   { transform: rotate(0deg) scale(1) skewX(0deg); }
          8%   { transform: rotate(-6deg) scaleX(0.9) scaleY(1.1) skewX(-4deg); }
          15%  { transform: rotate(10deg) scaleX(1.08) scaleY(0.92) skewX(6deg) translateY(3px); }
          22%  { transform: rotate(-3deg) scale(0.97) skewX(2deg); }

          /* שלב 2: וינד-אפ לסלטה */
          28%  { transform: rotate(-8deg) scale(0.93); }

          /* שלב 3: סלטה! */
          58%  { transform: rotate(368deg) scale(1.04); }

          /* שלב 4: נחיתה — קצת "נחבט" */
          63%  { transform: rotate(360deg) scale(1.08) scaleY(0.88); }
          68%  { transform: rotate(360deg) scale(0.96) scaleY(1.04); }
          73%  { transform: rotate(360deg) scale(1); }

          /* שלב 5: מזיז את אותה הרגל טיפה — "ראיתם?" */
          80%  { transform: rotate(360deg) skewX(-7deg) translateX(-4px); }
          86%  { transform: rotate(360deg) skewX(3deg)  translateX(2px); }
          91%  { transform: rotate(360deg) skewX(-2deg) translateX(-1px); }

          /* שלב 6: חוזר לעמוד ישר בצניעות */
          100% { transform: rotate(0deg) scale(1) skewX(0deg); }
        }
        .splash-logo {
          display: inline-block;
          animation: logo-antics 3s ease-in-out 1 forwards;
          transform-origin: center bottom;
        }
      `}</style>

      <div style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "#F9F6EE",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "20px",
        transition: "opacity 0.6s ease",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "auto",
      }}>
        <div className="splash-logo">
          <LogoSymbol size={130} />
        </div>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "2.2rem", fontWeight: 700,
          color: "#C62828", letterSpacing: "-0.01em",
        }}>Syncca</div>
        <div style={{
          fontFamily: "'Alef', sans-serif",
          fontSize: "0.9rem", color: "#757575",
          direction: "rtl",
        }}>המרחב שבו האהבה נושמת</div>
      </div>
    </>
  );
}
