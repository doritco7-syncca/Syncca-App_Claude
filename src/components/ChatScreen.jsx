// ChatScreen.jsx — Syncca
// Props: userEmail, firstName, messages, isLoading, onSend,
//        onSaveConcept, savedConcepts, conceptLexicon,
//        onOpenPersonalCard, onOpenHistory, onLogout, onTimeout, sessionStartTime

import { useState, useRef, useEffect } from "react";
import { saveFeedback } from "../AirtableService";

const SESSION_SECS = 30 * 60;

const COLORS = {
  stone: "#F9F6EE", stoneLight: "#FCFAF5", frame: "#E8E0F0",
  primary: "#C62828", primaryH: "#B71C1C", primaryLight: "#FFCDD2",
  secondary: "#757575",
  text: "#1a1a1a", muted: "#6b7280", border: "#E5E0D8",
};

const STONE_SHADOW = [
  "0 2px 4px rgba(0,0,0,0.04)",
  "0 8px 24px rgba(0,0,0,0.08)",
  "0 24px 64px rgba(0,0,0,0.10)",
  "inset 0 1px 0 rgba(255,255,255,0.9)",
].join(", ");

// ─── Logo ────────────────────────────────────────────────────────
function LogoSymbol({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" style={{ display: "block", flexShrink: 0 }}>
      <path fill="#C62828" d="M 412.87 453.22 A 252 252 0 1 0 99.13 453.22 L 134.61 408.61 A 195 195 0 1 1 377.39 408.61 Z"/>
      <path fill="#757575" d="M 335.06 355.39 A 127 127 0 1 0 176.94 355.39 L 201.84 324.09 A 87 87 0 1 1 310.16 324.09 Z"/>
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
          fontFamily: "'Alef', sans-serif", fontSize: "0.9rem",
          color: COLORS.text, lineHeight: 1.65, marginBottom: "16px",
        }}>{concept.explanation || "מושג מרכזי בשפה של זוגיות נקייה."}</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => { onSave?.(concept); onClose(); }} style={{
            flex: 1, height: "44px", background: COLORS.primary, color: "white",
            border: "none", borderRadius: "9999px",
            fontFamily: "'Alef', sans-serif", fontWeight: 600, fontSize: "0.88rem",
            cursor: "pointer",
          }}>✦ שמור מושג זה</button>
          <button onClick={onClose} style={{
            height: "44px", padding: "0 18px",
            background: "transparent", color: COLORS.muted,
            border: `1px solid ${COLORS.border}`, borderRadius: "9999px",
            fontFamily: "'Alef', sans-serif", cursor: "pointer",
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

function stripHeDefiniteArticle(term) {
  return (term || "").split(" ").map(w => w.startsWith("ה") && w.length > 2 ? w.slice(1) : w).join(" ");
}

// ─── Bottom Widget: slim bar — saved concepts + feedback ─────────
function SessionEndWidget({ savedConcepts = [], conceptLexicon = [], logRecordId, chatLang = "he", onDeleteConcept }) {
  const [activeConcept, setActiveConcept] = useState(null);
  const [feedback, setFeedback]           = useState("");
  const [sent, setSent]                   = useState(false);
  const [sending, setSending]             = useState(false);

  function findEntry(concept) {
    const t = concept.englishTerm || concept.word || "";
    const w = concept.word || "";
    return conceptLexicon.find(c =>
      c.englishTerm === t ||
      c.englishTerm === w ||
      c.word === w ||
      c.word === t ||
      c.aliases?.some(a => a === w || a === t ||
        stripHeDefiniteArticle(a) === stripHeDefiniteArticle(w))
    );
  }

  function resolveWord(concept) {
    const entry = findEntry(concept);
    if (chatLang === "en") return entry?.englishTerm || concept.englishTerm || concept.word;
    return entry?.word || concept.word || concept.englishTerm;
  }

  function resolveExplanation(concept) {
    const entry = findEntry(concept);
    if (chatLang === "en") return entry?.explanationEN || concept.explanationEN || entry?.explanation || "";
    return entry?.explanation || concept.explanation || "מושג מרכזי בשפה של זוגיות נקייה.";
  }

  function toggleConcept(c) {
    setActiveConcept(prev => prev?.word === c.word ? null : c);
  }

  async function handleSendFeedback() {
    if (!feedback.trim()) return;
    setSending(true);
    if (logRecordId) saveFeedback(logRecordId, feedback.trim()).catch(() => {});
    setSent(true);
    setSending(false);
  }

  return (
    <div style={{
      borderTop: `1px solid ${COLORS.border}`,
      background: COLORS.stoneLight,
      flexShrink: 0, direction: "rtl",
    }}>

      {/* Saved concept pills — only if something saved */}
      {savedConcepts.length > 0 && (
        <div style={{ padding: "8px 16px 0" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "0.8rem", fontWeight: 700,
              color: COLORS.secondary, flexShrink: 0, marginLeft: "2px",
            }}>✦ שלי:</span>
            {savedConcepts.map((c, i) => (
              <div key={i} style={{
                display: "inline-flex", alignItems: "center", gap: "2px",
              }}>
                <button onClick={() => toggleConcept(c)} style={{
                  padding: "3px 11px", borderRadius: "9999px",
                  border: `1.5px solid ${activeConcept?.word === c.word ? COLORS.primary : "rgba(198,40,40,0.4)"}`,
                  background: activeConcept?.word === c.word ? "#FFF0E8" : "rgba(254,215,170,0.35)",
                  color: COLORS.primary,
                  fontFamily: "'Alef', sans-serif", fontSize: "0.78rem", fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s",
                }}>{resolveWord(c)}</button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (activeConcept?.word === c.word) setActiveConcept(null); onDeleteConcept?.(c); }}
                  title="הסר מושג"
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "rgba(180,80,0,0.5)", fontSize: "0.65rem",
                    padding: "0 1px", lineHeight: 1,
                    display: "flex", alignItems: "center",
                  }}>✕</button>
              </div>
            ))}
          </div>

          {/* Inline explanation — expands below pills */}
          {activeConcept && (
            <div style={{
              margin: "8px 0 4px", background: "white", borderRadius: "10px",
              border: `1px solid rgba(198,40,40,0.2)`,
              padding: "10px 32px 10px 12px", position: "relative",
            }}>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "0.95rem", fontWeight: 700,
                color: COLORS.secondary, marginBottom: "3px",
              }}>{resolveWord(activeConcept)}</div>
              <div style={{
                fontFamily: "'Alef', sans-serif", fontSize: "0.79rem",
                color: COLORS.text, lineHeight: 1.55,
              }}>{resolveExplanation(activeConcept)}</div>
              <button onClick={() => setActiveConcept(null)} style={{
                position: "absolute", top: "8px", left: "8px",
                background: "none", border: "none", cursor: "pointer",
                color: COLORS.muted, fontSize: "0.8rem", lineHeight: 1,
              }}>✕</button>
            </div>
          )}
        </div>
      )}

      {/* Feedback — single input line */}
      <div style={{ padding: "7px 16px 10px", display: "flex", gap: "7px", alignItems: "center" }}>
        {!sent ? (
          <>
            <input
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSendFeedback(); }}
              placeholder="פידבק על השיחה..."
              style={{
                flex: 1, height: "34px", borderRadius: "9999px",
                border: `1.5px solid ${COLORS.border}`,
                padding: "0 13px",
                fontFamily: "'Alef', sans-serif", fontSize: "0.82rem",
                background: "white", outline: "none", direction: "rtl",
              }}
            />
            <button onClick={handleSendFeedback} disabled={sending || !feedback.trim()} style={{
              height: "34px", padding: "0 13px", flexShrink: 0,
              background: COLORS.secondary, color: "white",
              border: "none", borderRadius: "9999px",
              fontFamily: "'Alef', sans-serif", fontWeight: 600, fontSize: "0.78rem",
              cursor: feedback.trim() ? "pointer" : "not-allowed",
              opacity: feedback.trim() ? 1 : 0.5,
            }}>שלח ✓</button>
          </>
        ) : (
          <div style={{
            flex: 1, textAlign: "center", color: "#16a34a",
            fontFamily: "'Alef', sans-serif", fontSize: "0.82rem", fontWeight: 600,
          }}>✓ תודה! נתראה בסינק הבא.</div>
        )}
      </div>
    </div>
  );
}

// ─── Main ChatScreen ─────────────────────────────────────────────
export default function ChatScreen({
  userEmail = "", firstName = "",
  messages = [], isLoading = false,
  onSend, onSaveConcept, onDeleteConcept, savedConcepts = [],
  conceptLexicon = [],
  onOpenPersonalCard, onOpenHistory, onLogout, onTimeout,
  sessionStartTime, logRecordId, chatLang = "he",
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
  const [timedOut, setTimedOut]       = useState(false);
  const [showWarning, setShowWarning] = useState(false); // 5-min warning
  const bottomRef = useRef(null);

  const displayName = firstName?.trim() ||
    (userEmail?.includes("@") ? userEmail.split("@")[0] : "");

  useEffect(() => {
    if (timedOut || secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft(s => {
      const next = s - 1;
      if (next <= 1)   { clearInterval(id); setTimedOut(true); onTimeout?.(); return 0; }
      if (next === 300) setShowWarning(true);  // exactly 5 minutes left
      return next;
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
          box-shadow: 0 3px 12px rgba(198,40,40,0.32);
          transition: background 0.15s;
        }
        .send-btn:hover:not(:disabled) { background: ${COLORS.primaryH}; }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .chat-input {
          flex: 1; height: 44px; border-radius: 9999px;
          border: 1.5px solid ${COLORS.border};
          padding: 0 18px; font-size: 0.93rem;
          font-family: 'Alef', sans-serif;
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
        padding: "10px", fontFamily: "'Alef', sans-serif",
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
            padding: "10px 14px 8px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            {/* Left: red arrow logout + timer */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 60 }}>
              <button onClick={onLogout} title="יציאה" style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "4px", lineHeight: 1, display: "flex", alignItems: "center",
                transition: "transform 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.2)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
              <span style={{
                fontFamily: "'Alef', sans-serif",
                fontSize: "0.72rem", fontWeight: 600,
                color: isLow ? COLORS.primary : COLORS.muted,
                letterSpacing: "0.03em", transition: "color 0.4s",
              }}>⏱ {mins}:{secs}</span>
            </div>

            {/* Center: logo + name */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: "1px",
              flex: 1,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <LogoSymbol size={18} />
                <span style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1rem", fontWeight: 700, color: COLORS.primary,
                }}>Syncca</span>
                <span style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "0.7rem", color: COLORS.secondary, fontWeight: 600,
                }}>| Conscious Love</span>
              </div>
              {displayName && (
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "0.78rem", fontWeight: 700,
                  color: "#16a34a", direction: "rtl",
                }}>{`בסינק עם ${displayName}`}</div>
              )}
            </div>

            {/* Right: history + personal card */}
            <div style={{ minWidth: 60, display: "flex", justifyContent: "flex-end", gap: "4px" }}>
              <button className="icon-btn" onClick={onOpenHistory}
                title="היסטוריית שיחות" style={{ fontSize: "1rem" }}>📋</button>
              <button className="icon-btn" onClick={onOpenPersonalCard}
                title="כרטיס אישי" style={{ fontSize: "1.05rem" }}>👤</button>
            </div>
          </div>

          {/* 5-MINUTE WARNING BANNER */}
          {showWarning && !timedOut && (
            <div style={{
              background: "rgba(198,40,40,0.08)",
              borderBottom: "1px solid rgba(198,40,40,0.2)",
              padding: "12px 16px",
              display: "flex", alignItems: "flex-start", justifyContent: "space-between",
              direction: "rtl", flexShrink: 0, gap: "8px",
            }}>
              <span style={{
                fontFamily: "'Alef', sans-serif", fontSize: "0.85rem",
                color: "#92400e", lineHeight: 1.6,
              }}>
                סליחה {displayName || ""}, אנחנו מתקרבים לסיום הזמן. האם תרצה לכתוב לי משהו שאתה לוקח מהשיחה שלנו? אתה גם מוזמן להישאר ולמלא פידבק עבורנו.
              </span>
              <button onClick={() => setShowWarning(false)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#92400e", fontSize: "0.85rem", padding: 0, flexShrink: 0,
              }}>✕</button>
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
                  fontFamily: "'Alef', sans-serif", fontSize: "0.93rem",
                  color: COLORS.text, lineHeight: 1.68,
                  direction: "rtl", textAlign: "right", width: "100%",
                } : {
                  background: "#FDFBF7",
                  border: `1.5px solid ${COLORS.primaryLight}`,
                  borderRadius: "0 18px 18px 18px",
                  padding: "13px 17px",
                  fontFamily: "'Alef', sans-serif", fontSize: "0.93rem",
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
                  fontFamily: "'Alef', sans-serif",
                }}>...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* INPUT BAR */}
            <div style={{
              padding: "12px 16px 16px",
              borderTop: `1px solid ${COLORS.border}`,
              flexShrink: 0,
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                marginBottom: "8px", padding: "0 2px",
              }}>
                <div style={{
                  fontSize: "0.6rem", color: COLORS.muted,
                  fontFamily: "'Alef', sans-serif",
                  letterSpacing: "0.08em", textTransform: "uppercase",
                }}>🔒 פרטי ומאובטח</div>
                <div style={{
                  fontSize: "0.6rem", color: COLORS.muted,
                  fontFamily: "'Alef', sans-serif", direction: "rtl",
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

          {/* BOTTOM WIDGET — saved concepts + feedback, always at very bottom */}
          <SessionEndWidget
            savedConcepts={savedConcepts}
            conceptLexicon={conceptLexicon}
            logRecordId={logRecordId}
            chatLang={chatLang}
            onDeleteConcept={onDeleteConcept}
          />
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
