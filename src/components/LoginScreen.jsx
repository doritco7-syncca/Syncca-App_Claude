// LoginScreen.jsx — Syncca
import { useState, useRef, useEffect } from "react";

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
  "Use of Syncca is intended for individuals 18 years of age and older.",
  "The information and guidance provided by Syncca are powered by artificial intelligence and are intended solely for enrichment, self-reflection, and improving interpersonal communication.",
  "Syncca is not a substitute for psychological therapy, professional relationship counseling, or any form of medical advice.",
  "This service is not intended for urgent mental health crises or cases involving violence. In emergencies, please contact your local emergency services or authorized professionals immediately.",
  "The use of Syncca and its tools is entirely at the user's own risk and responsibility."
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
        boxShadow: STONE_SHADOW, direction: "ltr",
      }}>
        <div style={{
          fontFamily: "'Alef', sans-serif", fontSize: "1rem", fontWeight: 700,
          color: "#757575", marginBottom: "16px", textAlign: "center",
        }}>Terms of Use — Syncca</div>
        {TERMS_TEXT.map((para, i) => (
          <p key={i} style={{
            fontFamily: "'Alef', sans-serif", fontSize: "0.72rem",
            color: "#1a1a1a", lineHeight: 1.7, marginBottom: "12px",
            textAlign: "left"
          }}>{para}</p>
        ))}
        <button onClick={onClose} style={{
          marginTop: "8px", width: "100%",
          background: "#C62828", color: "white", border: "none",
          borderRadius: 9999, padding: "12px", cursor: "pointer",
          fontFamily: "'Alef', sans-serif", fontSize: "0.9rem", fontWeight: 600,
        }}>I understand, close window</button>
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
  const isRateLimit = error.includes("Glad to have you back") || error.includes("שמחה שחזרת");
  const [btnHover, setBtnHover]   = useState(false);
  const [showTerms, setShowTerms]     = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(() => localStorage.getItem("syncca_terms_accepted") ===
