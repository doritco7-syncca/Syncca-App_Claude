// ChatScreen.jsx — Syncca
// Props: userEmail, firstName, messages, isLoading, onSend,
//        onSaveConcept, savedConcepts, conceptLexicon,
//        onOpenPersonalCard, onLogout, onTimeout, sessionStartTime

import { useState, useRef, useEffect } from "react";
import { saveFeedback } from "../AirtableService";

const SESSION_SECS = 30 * 60;

const COLORS = {
  stone: "#F9F6EE", stoneLight: "#FCFAF5", frame: "#E8E0F0",
  primary: "#ea580c", primaryH: "#c2410c", primaryLight: "#FED7AA",
  secondary: "#1e3a8a",
  text: "#1a1a1a", muted: "#6b7280", border: "#E5E0D8",
};

const STONE_SHADOW = [
  "0 2px 4px rgba(0,0,0,0.04)",
  "0 8px 24px rgba(0,0,0,0.08)",
  "0 24px 64px rgba(0,0,0,0.10)",
  "inset 0 1px 0 rgba(255,255,255,0.9)",
].join(", ");

// ─── Logo ────────────────────────────────────────────────────────
function LogoSymbol({ size = 24 }) {
  const r = size / 2, cx = r, cy = r, or = r * 0.88, ir = r * 0.55, off = r * 0.22;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <circle cx={cx - off} cy={cy} r={or} stroke="#ea580c" strokeWidth={size * 0.09} fill="none" />
      <circle cx={cx + off} cy={cy} r={ir} stroke="#1e3a8a" strokeWidth={size * 0.09} fill="none"
        style={{ transform: `rotate(180deg)`, transformOrigin: `${cx}px ${cy}px` }} />
    </svg>
  );
}

// ─── Concept Tooltip (chat bubble click) ─────────────────────────
function ConceptTooltip({ concept, onSave, onClose }) {
  if (!concept) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.18)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      padding: "0 10px 24px",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#FDFBF7", borderRadius: "20px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        padding: "24px 26px", maxWidth: "480px", width: "100%",
        direction: "rtl", animation: "tooltipUp 0.22s ease",
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "1.3rem", fontWeight: 700,
          color: COLORS.secondary, marginBottom: "10px",
        }}>{concept.word}</div>
        <div style={{
          fontFamily: "'Inter', sans-serif", fontSize: "0.9rem",
          color: COLORS.text, lineHeight: 1.65, marginBottom: "16px",
        }}>{concept.explanation || "מושג מרכזי בשפה של זוגיות נקייה."}</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => { onSave?.(concept); onClose(); }} style={{
            flex: 1, height: "44px", background: COLORS.primary, color: "white",
            border: "none", borderRadius: "9999px",
            fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "0.88rem",
            cursor: "pointer",
          }}>✦ שמור מושג זה</button>
          <button onClick={onClose} style={{
            height: "44px", padding: "0 18px",
            background: "transparent", color: COLORS.muted,
            border: `1px solid ${COLORS.border}`, borderRadius: "9999px",
            fontFamily: "'Inter', sans-serif", cursor: "pointer",
          }}>סגור</button>
        </div>
        <button onClick={onClose} style={{
          position: "absolute", top: "14px", left: "14px",
          background: "none", border: "none", cursor: "pointer",
          color: COLORS.muted, fontSize: "1rem",
        }}>✕</button>
      </div>
    </div>
  );
}

// ─── Message text renderer — makes [[concepts]] tappable ─────────
function MessageText({ text, concepts = [], onConceptClick }) {
  if (!concepts.length) return <span style={{ whiteSpace: "pre-wrap" }}>{text}</span>;
  const parts = [];
  let remaining = text;
  concepts.forEach(c => {
    const idx = remaining.indexOf(c.word);
    if (idx === -1) return;
    if (idx > 0) parts.push({ type: "text", value: remaining.slice(0, idx) });
    parts.push({ type: "concept", value: c.word, concept: c });
    remaining = remaining.slice(idx + c.word.length);
  });
  if (remaining) parts.push({ type: "text", value: remaining });
  return (
    <span style={{ whiteSpace: "pre-wrap" }}>
      {parts.map((p, i) =>
        p.type === "text" ? <span key={i}>{p.value}</span> : (
          <span key={i} onClick={() => onConceptClick?.(p.concept)} style={{
            color: COLORS.primary, fontWeight: 700,
            textDecoration: "underline dotted",
            cursor: "pointer", borderRadius: "4px",
          }}>{p.value}</span>
        )
      )}
    </span>
  );
}

// ─── End-of-session widget: Lexicon + Feedback ────────────────────
function SessionEndWidget({ conceptLexicon = [], logRecordId }) {
  const [activeConcept, setActiveConcept] = useState(null);
  const [feedback, setFeedback]           = useState("");
  const [sent, setSent]                   = useState(false);
  const [sending, setSending]             = useState(false);

  async function handleSendFeedback() {
    if (!feedback.trim()) return;
    setSending(true);
    if (logRecordId) {
      saveFeedback(logRecordId, feedback.trim())
        .catch(e => console.warn("[saveFeedback]", e));
    }
    setSent(true);
    setSending(false);
  }

  return (
    <div style={{
      borderTop: `1px solid ${COLORS.border}`,
      background: COLORS.stoneLight,
      padding: "18px 16px 22px",
      flexShrink: 0, direction: "rtl",
    }}>
      {/* Visual Lexicon */}
      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "1rem", fontWeight: 700,
        color: COLORS.secondary, marginBottom: "10px",
      }}>✦ המושגים שעלו בשיחה</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "18px" }}>
        {conceptLexicon.map((c, i) => (
          <button key={i} onClick={() => setActiveConcept(activeConcept?.word === c.word ? null : c)}
            style={{
              padding: "5px 13px", borderRadius: "9999px",
              border: `1.5px solid ${activeConcept?.word === c.word ? COLORS.primary : COLORS.border}`,
              background: activeConcept?.word === c.word ? "#FFF0E8" : "white",
              color: activeConcept?.word === c.word ? COLORS.primary : COLORS.text,
              fontFamily: "'Inter', sans-serif", fontSize: "0.82rem",
              cursor: "pointer", transition: "all 0.15s",
            }}>{c.word}</button>
        ))}
      </div>

      {/* Concept explanation */}
      {activeConcept && (
        <div style={{
          background: "white", borderRadius: "14px",
          border: `1.5px solid ${COLORS.border}`,
          padding: "14px 16px", marginBottom: "16px",
          position: "relative",
        }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.05rem", fontWeight: 700,
            color: COLORS.secondary, marginBottom: "6px",
          }}>{activeConcept.word}</div>
          <div style={{
            fontFamily: "'Inter', sans-serif", fontSize: "0.85rem",
            color: COLORS.text, lineHeight: 1.65,
          }}>{activeConcept.explanation || "מושג מרכזי בשפה של זוגיות נקייה."}</div>
          <button onClick={() => setActiveConcept(null)} style={{
            position: "absolute", top: "10px", left: "10px",
            background: "none", border: "none", cursor: "pointer",
            color: COLORS.muted, fontSize: "0.9rem",
          }}>✕</button>
        </div>
      )}

      {/* Feedback */}
      {!sent ? (
        <>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.8rem", fontWeight: 600,
            color: COLORS.secondary, marginBottom: "8px",
          }}>לפני שנפרדים, מה תרצי/ה לשתף?</div>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="מה עזר, מה חסר, מה הרגשת..."
            rows={3}
            style={{
              width: "100%", borderRadius: "12px",
              border: `1.5px solid ${COLORS.border}`,
              padding: "10px 12px", resize: "none",
              fontFamily: "'Inter', sans-serif", fontSize: "0.88rem",
              background: "white", outline: "none",
              direction: "rtl", boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <button onClick={handleSendFeedback} disabled={sending || !feedback.trim()} style={{
              flex: 1, height: "44px", background: COLORS.secondary, color: "white",
              border: "none", borderRadius: "9999px",
              fontFamily: "'Inter', sans-serif", fontWeight: 600,
              cursor: feedback.trim() ? "pointer" : "not-allowed", opacity: feedback.trim() ? 1 : 0.5,
            }}>שלח פידבק ✓</button>
          </div>
        </>
      ) : (
        <div style={{
          textAlign: "center", color: "#16a34a",
          fontFamily: "'Inter', sans-serif", fontWeight: 600,
          fontSize: "0.9rem", padding: "8px 0",
        }}>✓ תודה! נתראה בסינק הבא.</div>
      )}
    </div>
  );
}

// ─── Main ChatScreen ─────────────────────────────────────────────
export default function ChatScreen({
  userEmail = "", firstName = "",
  messages = [], isLoading = false,
  onSend, onSaveConcept, savedConcepts = [],
  conceptLexicon = [],
  onOpenPersonalCard, onLogout, onTimeout,
  sessionStartTime, logRecordId,
}) {
  const [input, setInput]               = useState("");
  const [activeConcept, setActiveConcept] = useState(null);
  const [secondsLeft, setSecondsLeft]   = useState(() => {
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

  const mins  = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs  = String(secondsLeft % 60).padStart(2, "0");
  const isLow = secondsLeft < 300;

  return (
    <>
      <style>{`
        @keyframes tooltipUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bubbleIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .chat-bubble-anim { animation: bubbleIn 0.22s ease; }
        .send-btn {
          width: 44px; height: 44px; border-radius: 9999px;
          background: ${COLORS.primary}; color: white; border: none;
          font-size: 1.05rem; cursor: pointer; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 3px 12px rgba(234,88,12,0.32);
          transition: background 0.15s;
        }
        .send-btn:hover:not(:disabled) { background: ${COLORS.primaryH}; }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .chat-input {
          flex: 1; height: 44px; border-radius: 9999px;
          border: 1.5px solid ${COLORS.border};
          padding: 0 18px; font-size: 0.93rem;
          font-family: 'Inter', sans-serif;
          background: white; outline: none;
          direction: rtl; text-align: right;
          transition: border-color 0.15s;
        }
        .chat-input:focus { border-color: ${COLORS.primary}; }
        .icon-btn {
          width: 34px; height: 34px; border-radius: 9999px;
          background: transparent; border: none;
          cursor: pointer; color: ${COLORS.muted};
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
        <div style={{
          background: COLORS.stone, borderRadius: "32px",
          boxShadow: STONE_SHADOW,
          width: "100%", maxWidth: "480px",
          height: "calc(100dvh - 20px)", maxHeight: "880px",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>

          {/* HEADER */}
          <div style={{
            padding: "18px 20px 14px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0, position: "relative",
          }}>
            {/* Left: timer + logout */}
            <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.8rem", fontWeight: 600,
                color: isLow ? COLORS.primary : COLORS.muted,
                letterSpacing: "0.03em", transition: "color 0.4s",
              }}>⏱ {mins}:{secs}</span>
              <button className="icon-btn" title="יציאה"
                onClick={onLogout}
                style={{ fontSize: "1rem" }}>↩</button>
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
                  {isLoading && i === messages.length - 1 && msg.role === "syncca" ? (
                    <span style={{ color: COLORS.muted, fontStyle: "italic" }}>...</span>
                  ) : (
                    <MessageText text={msg.text} concepts={msg.concepts || []}
                      onConceptClick={setActiveConcept} />
                  )}
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
            {isLoading && (
              <div style={{
                display: "flex", justifyContent: "flex-start", paddingLeft: "4px",
              }}>
                <div style={{
                  background: "#FDFBF7", border: `1.5px solid ${COLORS.primaryLight}`,
                  borderRadius: "0 18px 18px 18px",
                  padding: "13px 17px", color: COLORS.muted,
                  fontStyle: "italic", fontSize: "0.88rem",
                  fontFamily: "'Inter', sans-serif",
                }}>...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* END-OF-SESSION WIDGET — always visible */}
          <SessionEndWidget
            conceptLexicon={conceptLexicon}
            logRecordId={logRecordId}
          />

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
                  onClick={handleSend} disabled={!input.trim() || timedOut}>➤</button>
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

      {/* Concept tooltip overlay */}
      <ConceptTooltip
        concept={activeConcept}
        onSave={onSaveConcept}
        onClose={() => setActiveConcept(null)}
      />
    </>
  );
}
