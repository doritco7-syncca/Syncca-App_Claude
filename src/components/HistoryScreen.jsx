// HistoryScreen.jsx — Syncca
// Shows last 10 sessions: date, duration, concepts, insight, feedback.

import { useState, useEffect } from "react";
import { fetchFullHistory } from "../AirtableService";

const COLORS = {
  stone:     "#F9F6EE",
  frame:     "#E8E0F0",
  primary:   "#ea580c",
  secondary: "#1e3a8a",
  success:   "#16a34a",
  text:      "#374151",
  muted:     "#9ca3af",
};

const CARD_SHADOW = `
  0 1px 2px rgba(0,0,0,0.04),
  0 4px 16px rgba(30,58,138,0.07),
  0 8px 32px rgba(234,88,12,0.05),
  inset 0 1px 0 rgba(255,255,255,0.9)
`.trim();

function LogoSymbol({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      style={{ transform: "rotate(180deg)", display: "block", flexShrink: 0 }}>
      <path d="M25 20C15 30 10 45 10 60C10 82 28 100 50 100C72 100 90 82 90 60C90 45 85 30 75 20C82 30 85 42 85 55C85 75 70 90 50 90C30 90 15 75 15 55C15 42 18 30 25 20Z" fill="#ea580c"/>
      <path d="M40 35C35 40 32 48 32 58C32 70 40 80 50 80C60 80 68 70 68 58C68 48 65 40 60 35C65 40 68 48 68 55C68 65 60 73 50 73C40 73 32 65 32 55C32 48 35 40 40 35Z" fill="#1e3a8a"/>
    </svg>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

export default function HistoryScreen({ username, firstName, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [expanded, setExpanded]             = useState(null);
  const [transcriptOpen, setTranscriptOpen] = useState(null);
  const storageKey = username ? `syncca_hidden_sessions_${username}` : null;

  // Load previously deleted session IDs from localStorage
  const deletedIds = (() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); }
    catch { return []; }
  })();

  function deleteSession(id, e) {
    e.stopPropagation();
    e.preventDefault();
    // Remove from UI immediately
    setSessions(prev => prev.filter(s => s.id !== id));
    // Persist deletion in localStorage
    if (storageKey) {
      const updated = [...deletedIds, id];
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
  }

  useEffect(() => {
    if (!username) { setLoading(false); setError("לא נמצא מזהה משתמש."); return; }
    fetchFullHistory(username, 30)
      .then(data => {
        const withContent = data.filter(s =>
          s.transcript?.trim() || s.insight?.trim() || s.concepts?.length > 0 || s.feedback?.trim()
        );
        setSessions(withContent.filter(s => !deletedIds.includes(s.id)));
        setLoading(false);
      })
      .catch(e => { console.error("[HistoryScreen]", e); setError(e?.message || "שגיאה בטעינת השיחות."); setLoading(false); });
  }, [username]);


  const name = firstName ? `, ${firstName}` : "";

  return (
    <div style={{
      position: "fixed", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(30,58,138,0.10)",
      zIndex: 200,
      padding: "10px",
    }}>
      <div style={{
        width: "100%", maxWidth: 480,
        height: "calc(100dvh - 20px)", maxHeight: 880,
        background: COLORS.stone,
        borderRadius: 32,
        boxShadow: CARD_SHADOW,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        direction: "rtl",
      }}>

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div style={{
          padding: "18px 20px 14px",
          background: "white",
          borderBottom: `1px solid ${COLORS.frame}`,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={onClose} style={{
              background: "none", border: "none", cursor: "pointer",
              color: COLORS.muted, fontSize: "1.1rem", padding: "4px",
              display: "flex", alignItems: "center",
            }}>✕</button>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <LogoSymbol size={18} />
                <span style={{
                  fontFamily: "'Alef', sans-serif",
                  fontSize: "1.05rem", fontWeight: 700,
                  color: COLORS.secondary, letterSpacing: "0.01em",
                }}>היסטוריית השיחות שלי</span>
              </div>
              {firstName && (
                <div style={{
                  fontFamily: "'Alef', sans-serif",
                  fontSize: "0.78rem", color: COLORS.success,
                  fontWeight: 600, marginTop: "2px",
                }}>{firstName}</div>
              )}
            </div>
            <div style={{ width: 28 }} /> {/* spacer to balance the ✕ */}
          </div>
        </div>

        {/* ── CONTENT ────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px 24px" }}>

          {loading && (
            <div style={{
              textAlign: "center", marginTop: "60px",
              fontFamily: "'Alef', sans-serif",
              fontSize: "1.1rem", color: COLORS.muted,
            }}>טוענת שיחות...</div>
          )}

          {!loading && error && (
            <div style={{
              textAlign: "center", marginTop: "60px", padding: "0 24px",
              fontFamily: "'Alef', sans-serif",
              fontSize: "0.82rem", color: "#dc2626",
            }}>{error}</div>
          )}

          {!loading && !error && sessions.length === 0 && (
            <div style={{
              textAlign: "center", marginTop: "60px",
              fontFamily: "'Alef', sans-serif",
              fontSize: "1.1rem", color: COLORS.muted,
            }}>עדיין אין שיחות שמורות{name}.</div>
          )}

          {!loading && !error && sessions.map((s, i) => {
            const isOpen = expanded === i;
            const hasConcepts  = s.concepts?.length > 0;
            const hasInsight   = !!s.insight;
            const hasFeedback  = !!s.feedback;
            const hasTranscript = !!s.transcript;

            return (
              <div key={s.id || i} style={{
                background: "white",
                borderRadius: 20,
                border: `1.5px solid ${isOpen ? COLORS.primary : COLORS.frame}`,
                marginBottom: 12,
                overflow: "hidden",
                transition: "border-color 0.2s",
                boxShadow: "0 2px 8px rgba(30,58,138,0.05)",
                position: "relative",
              }}>
                {/* Delete button — outside clickable area */}
                <button
                  onClick={e => deleteSession(s.id, e)}
                  title="מחק שיחה"
                  style={{
                    position: "absolute", top: 10, left: 10,
                    background: "none", border: "none", cursor: "pointer",
                    color: COLORS.muted, fontSize: "0.85rem",
                    padding: "4px 6px", borderRadius: 8,
                    lineHeight: 1, zIndex: 10,
                  }}>🗑</button>

                {/* Card header — always visible */}
                <div
                  onClick={() => setExpanded(isOpen ? null : i)}
                  style={{
                    padding: "14px 16px 10px",
                    cursor: "pointer",
                  }}>

                  {/* Top row: number + date + delete + chevron */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* Session circle */}
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: i === 0 ? COLORS.primary : COLORS.frame,
                      color: i === 0 ? "white" : COLORS.secondary,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'Alef', sans-serif",
                      fontSize: "1rem", fontWeight: 400, flexShrink: 0,
                    }}>{sessions.length - i}</div>

                    {/* Date + time */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: "'Alef', sans-serif",
                        fontSize: "1.05rem", fontWeight: 400,
                        color: COLORS.secondary,
                      }}>{formatDate(s.date)}</div>
                      <div style={{
                        fontFamily: "'Alef', sans-serif",
                        fontSize: "0.76rem", color: COLORS.muted,
                        marginTop: "1px",
                      }}>
                        {formatTime(s.date)}
                        {s.duration ? ` · ${s.duration} דקות` : ""}
                      </div>
                    </div>

                    {/* Chevron */}
                    <span style={{
                      color: COLORS.muted, fontSize: "0.75rem",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s", display: "inline-block",
                    }}>▼</span>
                  </div>

                  {/* Preview row: insight snippet + concept count */}
                  {(hasInsight || hasConcepts) && (
                    <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                      {hasInsight && !isOpen && (
                        <div style={{
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          borderRadius: 10,
                          padding: "4px 10px",
                          fontFamily: "'Alef', sans-serif",
                          fontSize: "0.76rem", color: "#166534",
                          maxWidth: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {s.insight.length > 80 ? s.insight.slice(0, 80) + "…" : s.insight}
                        </div>
                      )}
                      {hasConcepts && (
                        <div style={{
                          background: "rgba(234,88,12,0.1)",
                          color: COLORS.primary,
                          borderRadius: 9999,
                          padding: "3px 10px",
                          fontFamily: "'Alef', sans-serif",
                          fontSize: "0.74rem", fontWeight: 400,
                        }}>{s.concepts.length} מושגים</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div style={{
                    borderTop: `1px solid ${COLORS.frame}`,
                    padding: "14px 16px 16px",
                    display: "flex", flexDirection: "column", gap: "12px",
                  }}>

                    {/* Insight */}
                    {hasInsight && (
                      <div>
                        <div style={{
                          fontFamily: "'Alef', sans-serif",
                          fontSize: "0.85rem", fontWeight: 400,
                          color: COLORS.secondary, marginBottom: "6px",
                          letterSpacing: "0.02em",
                        }}>✦ תמצית</div>
                        <div style={{
                          fontFamily: "'Alef', sans-serif",
                          fontSize: "0.86rem", color: COLORS.text,
                          lineHeight: 1.6,
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          borderRadius: 12, padding: "10px 12px",
                        }}>{s.insight}</div>
                      </div>
                    )}

                    {/* Concepts */}
                    {hasConcepts && (
                      <div>
                        <div style={{
                          fontFamily: "'Alef', sans-serif",
                          fontSize: "0.78rem", fontWeight: 700,
                          color: COLORS.secondary, marginBottom: "6px",
                          textTransform: "uppercase", letterSpacing: "0.04em",
                        }}>✦ מושגים</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {s.concepts.map((c, ci) => (
                            <span key={ci} style={{
                              padding: "3px 11px", borderRadius: 9999,
                              background: "rgba(254,215,170,0.45)",
                              border: "1.5px solid rgba(234,88,12,0.3)",
                              color: COLORS.primary,
                              fontFamily: "'Alef', sans-serif",
                              fontSize: "0.76rem", fontWeight: 600,
                            }}>{c}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Feedback */}
                    {hasFeedback && (
                      <div>
                        <div style={{
                          fontFamily: "'Alef', sans-serif",
                          fontSize: "0.85rem", fontWeight: 400,
                          color: COLORS.secondary, marginBottom: "6px",
                          letterSpacing: "0.02em",
                        }}>✦ פידבק</div>
                        <div style={{
                          fontFamily: "'Alef', sans-serif",
                          fontSize: "0.86rem",
                          lineHeight: 1.5,
                          fontStyle: "italic",
                          color: COLORS.muted,
                        }}>"{s.feedback}"</div>
                      </div>
                    )}

                    {/* Transcript toggle */}
                    {hasTranscript && (
                      <div>
                        <button
                          onClick={() => setTranscriptOpen(transcriptOpen === i ? null : i)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            padding: "6px 0", display: "flex", alignItems: "center", gap: "6px",
                            fontFamily: "'Alef', sans-serif",
                            fontSize: "0.78rem", fontWeight: 700,
                            color: COLORS.secondary,
                            textTransform: "uppercase", letterSpacing: "0.04em",
                          }}>
                          <span style={{
                            transform: transcriptOpen === i ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s", display: "inline-block", fontSize: "0.65rem",
                          }}>▼</span>
                          ✦ השיחה המלאה
                        </button>
                        {transcriptOpen === i && (
                          <div style={{
                            background: COLORS.frame,
                            borderRadius: 12,
                            padding: "12px 14px",
                            maxHeight: "300px",
                            overflowY: "auto",
                            direction: "rtl",
                          }}>
                            {s.transcript.split("\n").filter(Boolean).map((line, li) => {
                              const isUser    = line.startsWith("[User]:");
                              const isSyncca  = line.startsWith("[Syncca]:");
                              const text      = line.replace(/^\[(User|Syncca)\]:\s*/, "");
                              return (
                                <div key={li} style={{
                                  marginBottom: "8px",
                                  textAlign: isUser ? "right" : "left",
                                }}>
                                  <span style={{
                                    display: "inline-block",
                                    padding: "6px 11px",
                                    borderRadius: 14,
                                    background: isUser ? "#FED7AA" : "white",
                                    color: COLORS.text,
                                    fontFamily: "'Alef', sans-serif",
                                    fontSize: "0.78rem",
                                    lineHeight: 1.5,
                                    maxWidth: "85%",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                                  }}>{text}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {!hasInsight && !hasConcepts && !hasFeedback && !hasTranscript && (
                      <div style={{
                        fontFamily: "'Alef', sans-serif",
                        fontSize: "0.8rem", color: COLORS.muted,
                        textAlign: "center", padding: "8px 0",
                      }}>אין פרטים נוספים לשיחה זו.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
