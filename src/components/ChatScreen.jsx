// ChatScreen.jsx — Syncca · Heavy Stone Slab Edition
// Props:
//   userEmail (string), firstName (string)
//   messages  ([{ role:"user"|"syncca", text, concepts?:[{word,explanation}], timestamp? }])
//   onSend (text) => void
//   onOpenPersonalCard () => void
//   onTimeout () => void
//   sessionStartTime (Date|string)

import { useState, useEffect, useRef } from "react";

const COLORS = {
  stone: "#F9F6EE", stoneLight: "#FCFAF5", frame: "#E8E0F0",
  primary: "#ea580c", primaryH: "#c2410c", primaryLight: "#FED7AA",
  secondary: "#1e3a8a",
  text: "#1a1a1a", muted: "#6b7280", border: "#E5E0D8",
};

const STONE_SHADOW = `
  0 2px 4px rgba(0,0,0,0.06),
  0 6px 12px rgba(0,0,0,0.07),
  0 18px 36px -6px rgba(0,0,0,0.11),
  0 40px 80px -16px rgba(0,0,0,0.14),
  inset 0 1px 0px rgba(255,255,255,0.90)
`;

const SESSION_SECS = 30 * 60;

const LogoSymbol = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
    style={{ transform: "rotate(180deg)", flexShrink: 0 }}>
    <path d="M25 20C15 30 10 45 10 60C10 82 28 100 50 100C72 100 90 82 90 60C90 45 85 30 75 20C82 30 85 42 85 55C85 75 70 90 50 90C30 90 15 75 15 55C15 42 18 30 25 20Z" fill="#ea580c"/>
    <path d="M40 35C35 40 32 48 32 58C32 70 40 80 50 80C60 80 68 70 68 58C68 48 65 40 60 35C65 40 68 48 68 55C68 65 60 73 50 73C40 73 32 65 32 55C32 48 35 40 40 35Z" fill="#1e3a8a"/>
  </svg>
);

function ConceptWord({ word, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <span onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        fontWeight: 600, cursor: "pointer", paddingBottom: "1px",
        borderBottom: `2px ${hov ? "solid" : "dashed"} rgba(234,88,12,${hov ? 0.85 : 0.5})`,
        transition: "border 0.15s",
      }}>
      {word}
    </span>
  );
}

function MessageText({ text, concepts = [], onConceptClick }) {
  if (!concepts.length) return <span>{text}</span>;
  let parts = [text];
  concepts.forEach(c => {
    parts = parts.flatMap(p => {
      if (typeof p !== "string") return [p];
      const i = p.indexOf(c.word);
      if (i === -1) return [p];
      return [p.slice(0, i), <ConceptWord key={c.word} word={c.word} onClick={() => onConceptClick(c)} />, p.slice(i + c.word.length)];
    });
  });
  return <>{parts}</>;
}

function Tooltip({ concept, onClose, onSave, savedConcepts = [] }) {
  if (!concept) return null;
  const alreadySaved = savedConcepts.some(c => c.word === concept.word);

  function handleSave(e) {
    e.stopPropagation();
    onSave?.(concept);
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      padding: "0 10px 28px", background: "rgba(0,0,0,0.20)",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#FDFBF7", borderRadius: "20px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        padding: "24px 26px 20px", maxWidth: "380px", width: "100%",
        direction: "rtl", animation: "tooltipUp 0.22s ease",
        position: "relative",
      }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: "absolute", top: "14px", left: "14px",
          background: "none", border: "none", cursor: "pointer",
          color: COLORS.muted, fontSize: "1rem",
        }}>✕</button>

        {/* Concept name */}
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "1.3rem", fontWeight: 700,
          color: COLORS.secondary, marginBottom: "10px",
        }}>{concept.word}</div>

        {/* Explanation */}
        <div style={{
          fontFamily: "'Inter', sans-serif", fontSize: "0.9rem",
          color: COLORS.text, lineHeight: 1.65, marginBottom: "18px",
        }}>{concept.explanation || "מושג מרכזי בשפה של זוגיות נקייה."}</div>

        {/* Save button */}
        <button onClick={handleSave} disabled={alreadySaved} style={{
          width: "100%", height: "44px",
          background: alreadySaved ? "#e5e7eb" : COLORS.primary,
          color: alreadySaved ? COLORS.muted : "white",
          border: "none", borderRadius: "9999px",
          fontFamily: "'Inter', sans-serif", fontWeight: 600,
          fontSize: "0.88rem", cursor: alreadySaved ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
          transition: "background 0.2s",
          boxShadow: alreadySaved ? "none" : "0 3px 10px rgba(234,88,12,0.28)",
        }}>
          {alreadySaved ? "✓ נשמר בכרטיס האישי" : "✦ שמור מושג זה"}
        </button>
      </div>
    </div>
  );
}

export default function ChatScreen({
  userEmail = "", firstName = "",
  messages = [], onSend,
  onSaveConcept,
  savedConcepts = [],
  onOpenPersonalCard, onTimeout,
  sessionStartTime,
}) {
  const [input, setInput] = useState("");
  const [activeConcept, setActiveConcept] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (sessionStartTime) {
      const elapsed = Math.floor((Date.now() - new Date(sessionStartTime)) / 1000);
      return Math.max(0, SESSION_SECS - elapsed);
    }
    return SESSION_SECS;
  });
  const [timedOut, setTimedOut] = useState(false);
  const bottomRef = useRef(null);

  const displayName = firstName?.trim() ||
    (userEmail?.includes("@") ? userEmail.split("@")[0] : "");

  useEffect(() => {
    if (timedOut || secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft(s => {
      if (s <= 1) { clearInterval(id); setTimedOut(true); onTimeout?.(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [timedOut]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const t = input.trim();
    if (!t || timedOut) return;
    setInput(""); onSend?.(t);
  }

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");
  const isLow = secondsLeft < 300;

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
        @keyframes bubbleIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes tooltipUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .chat-slab { animation: stoneRise 0.65s cubic-bezier(0.22,1,0.36,1) both; }
        .chat-bubble-anim { animation: bubbleIn 0.28s ease both; }

        .chat-input {
          flex: 1; height: 46px;
          background: ${COLORS.stoneLight};
          border: 1.5px solid transparent; border-radius: 9999px;
          padding: 0 18px; font-family: 'Inter', sans-serif;
          font-size: 0.93rem; color: ${COLORS.text};
          outline: none; direction: rtl; text-align: right;
          transition: border-color 0.18s;
        }
        .chat-input:focus { border-color: ${COLORS.primary}; }
        .chat-input::placeholder { color: ${COLORS.muted}; }
        .chat-input:disabled { opacity: 0.45; }

        .send-btn {
          width: 46px; height: 46px; flex-shrink: 0;
          background: ${COLORS.primary}; border: none; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #fff; font-size: 1rem;
          box-shadow: 0 3px 10px rgba(234,88,12,0.35);
          transition: background 0.15s, transform 0.1s;
        }
        .send-btn:hover:not(:disabled) { background: ${COLORS.primaryH}; transform: scale(1.06); }
        .send-btn:disabled { opacity: 0.35; cursor: default; }

        .icon-btn {
          background: none; border: none; cursor: pointer;
          color: ${COLORS.muted}; border-radius: 50%;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.95rem; transition: background 0.15s, color 0.15s;
        }
        .icon-btn:hover { background: ${COLORS.border}; color: ${COLORS.text}; }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
      `}</style>

      <div style={{
        minHeight: "100dvh", height: "100dvh",
        background: COLORS.frame,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "10px", fontFamily: "'Inter', sans-serif",
      }}>
        <div className="chat-slab" style={{
          background: COLORS.stone,
          borderRadius: "32px",
          boxShadow: STONE_SHADOW,
          width: "100%", maxWidth: "480px",
          height: "calc(100dvh - 20px)",
          maxHeight: "880px",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>

          {/* HEADER */}
          <div style={{
            padding: "18px 20px 14px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0, position: "relative",
          }}>
            {/* Left: timer + icons */}
            <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.8rem", fontWeight: 600,
                color: isLow ? COLORS.primary : COLORS.muted,
                letterSpacing: "0.03em",
                transition: "color 0.4s",
              }}>⏱ {mins}:{secs}</span>
              <button className="icon-btn" title="הגדרות">⚙</button>
              <button className="icon-btn" title="ייצא">↗</button>
            </div>

            {/* Center logo */}
            <div style={{
              position: "absolute", left: "50%", transform: "translateX(-50%)",
              display: "flex", alignItems: "center", gap: "7px",
            }}>
              <LogoSymbol size={22} />
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.15rem", fontWeight: 700, color: COLORS.primary,
              }}>Syncca</span>
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "0.8rem", color: COLORS.secondary, fontWeight: 600,
              }}>| Conscious Love</span>
            </div>

            {/* Right: personal card */}
            <button className="icon-btn" onClick={onOpenPersonalCard}
              title="כרטיס אישי" style={{ fontSize: "1.05rem" }}>👤</button>
          </div>

          {/* GREETING */}
          {displayName && (
            <div style={{
              padding: "9px 20px",
              background: COLORS.stoneLight,
              borderBottom: `1px solid ${COLORS.border}`,
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "0.98rem", fontWeight: 600,
              color: COLORS.secondary, textAlign: "center",
              direction: "rtl", flexShrink: 0,
            }}>
              {`בסינק עם ${displayName}`}
            </div>
          )}

          {/* MESSAGES */}
          <div style={{
            flex: 1, overflowY: "auto",
            padding: "20px 16px 8px",
            display: "flex", flexDirection: "column", gap: "12px",
          }}>
            {messages.length === 0 && (
              <div style={{
                textAlign: "center", color: COLORS.muted, marginTop: "40px",
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.1rem", direction: "rtl", lineHeight: 1.7,
              }}>
                שלום, אני כאן להקשיב.<br/>
                <span style={{ fontSize: "0.88rem", fontFamily: "'Inter', sans-serif" }}>
                  מה עולה לך היום?
                </span>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className="chat-bubble-anim" style={{
                display: "flex", flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  fontSize: "0.66rem", fontWeight: 600,
                  color: COLORS.muted, marginBottom: "3px",
                  paddingLeft: "4px", paddingRight: "4px",
                }}>
                  {msg.role === "user" ? "את" : "Syncca"}
                </div>
                <div style={msg.role === "user" ? {
                  background: COLORS.primaryLight,
                  borderRadius: "18px 0 18px 18px",
                  padding: "13px 17px",
                  fontFamily: "'Inter', sans-serif", fontSize: "0.93rem",
                  color: COLORS.text, lineHeight: 1.68,
                  direction: "rtl", textAlign: "right", width: "100%",
                } : {
                  background: "#FDFBF7",
                  border: `1.5px solid ${COLORS.primaryLight}`,
                  borderRadius: "0 18px 18px 18px",
                  padding: "13px 17px",
                  fontFamily: "'Inter', sans-serif", fontSize: "0.93rem",
                  color: COLORS.text, lineHeight: 1.68,
                  direction: "rtl", textAlign: "right", width: "100%",
                }}>
                  <MessageText text={msg.text} concepts={msg.concepts || []}
                    onConceptClick={setActiveConcept} />
                </div>
                {msg.timestamp && (
                  <div style={{
                    fontSize: "0.6rem", color: COLORS.muted,
                    marginTop: "3px", paddingLeft: "4px", paddingRight: "4px",
                  }}>
                    {new Date(msg.timestamp).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* INPUT BAR */}
          <div style={{
            padding: "12px 16px 20px",
            borderTop: `1px solid ${COLORS.border}`,
            flexShrink: 0,
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              marginBottom: "8px", padding: "0 2px",
            }}>
              <div style={{
                fontSize: "0.6rem", color: COLORS.muted,
                fontFamily: "'Inter', sans-serif",
                letterSpacing: "0.08em", textTransform: "uppercase",
              }}>🔒 פרטי ומאובטח</div>
              <div style={{
                fontSize: "0.6rem", color: COLORS.muted,
                fontFamily: "'Inter', sans-serif", direction: "rtl",
              }}>
                {input.length > 0 ? `${input.length} תווים` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button className="send-btn"
                onClick={handleSend} disabled={!input.trim() || timedOut}
                title="שלחי">➤</button>
              <input className="chat-input"
                placeholder={timedOut ? "השיחה הסתיימה" : "כתבי כאן..."}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                disabled={timedOut} />
            </div>
          </div>

        </div>
      </div>

      <Tooltip
        concept={activeConcept}
        onClose={() => setActiveConcept(null)}
        onSave={(concept) => { onSaveConcept?.(concept); setActiveConcept(null); }}
        savedConcepts={savedConcepts}
      />
    </>
  );
}
