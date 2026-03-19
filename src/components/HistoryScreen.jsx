// HistoryScreen.jsx — Syncca
// Shows last 10 sessions: date, duration, concepts, insight, feedback.

import { useState, useEffect } from "react";
import { fetchFullHistory } from "../AirtableService";

const COLORS = {
  stone:     "#F9F6EE",
  frame:     "#E8E0F0",
  primary:   "#C62828",
  secondary: "#757575",
  success:   "#16a34a",
  text:      "#374151",
  muted:     "#9ca3af",
};

const CARD_SHADOW = `
  0 1px 2px rgba(0,0,0,0.04),
  0 4px 16px rgba(117,117,117,0.07),
  0 8px 32px rgba(198,40,40,0.05),
  inset 0 1px 0 rgba(255,255,255,0.9)
`.trim();

function LogoSymbol({ size = 20 }) {
  return (
    <svg width={size} height={size * 289/357} viewBox="0 0 357 289" fill="none" style={{ display: "block", flexShrink: 0 }}>
      <path fill="#C62828" d="M 177.98 13.80 C 185.90 13.76 193.02 16.01 200.74 17.42 C 208.14 19.43 215.55 22.00 222.24 25.77 C 241.68 35.95 258.08 52.59 270.53 70.47 C 289.26 96.82 301.12 126.36 309.31 157.49 C 311.25 165.56 313.46 173.52 314.53 181.78 C 316.20 189.97 317.68 198.14 318.27 206.49 C 318.90 215.83 320.96 224.65 320.99 234.00 C 321.03 240.76 320.99 247.52 321.00 254.29 C 310.69 247.14 300.61 239.65 290.31 232.49 C 289.24 222.32 288.03 212.18 286.84 202.03 C 286.10 193.54 283.67 185.38 282.47 176.94 C 279.31 164.12 276.28 151.06 271.41 138.76 C 264.67 119.21 255.01 100.82 242.93 84.04 C 235.97 74.73 227.91 66.35 218.62 59.35 C 212.47 54.88 205.53 51.42 198.53 48.52 C 187.82 44.26 176.29 43.95 165.08 46.17 C 151.65 49.07 138.95 56.77 128.59 65.62 C 121.81 71.41 116.61 78.23 111.28 85.30 C 90.71 113.36 79.04 146.42 71.96 180.21 C 69.75 188.60 69.32 197.01 67.72 205.47 C 66.08 213.13 66.23 221.20 65.31 229.03 C 65.08 230.30 65.16 232.14 64.11 233.04 C 60.76 236.39 56.38 238.66 52.75 241.75 C 49.42 244.64 45.59 246.30 42.67 249.64 C 40.52 252.23 37.38 252.96 34.37 254.28 C 34.48 244.24 33.80 233.88 34.98 224.00 C 35.77 217.61 35.43 211.35 36.72 205.02 C 38.57 196.30 38.88 187.44 40.89 178.76 C 42.62 171.77 43.53 164.66 45.69 157.77 C 48.50 146.06 52.47 134.79 56.45 123.43 C 64.44 104.11 73.94 84.28 86.44 67.45 C 97.38 52.83 110.77 38.97 126.42 29.40 C 131.35 26.00 136.88 23.46 142.49 21.40 C 147.52 19.95 151.78 17.54 156.99 16.86 C 164.21 15.83 170.56 13.41 177.98 13.80 Z"/>
      <path fill="#757575" d="M 193.03 66.99 C 205.13 70.58 216.03 78.27 224.55 87.46 C 238.86 102.30 248.21 121.75 254.99 141.02 C 260.21 154.98 263.19 169.22 266.15 183.77 C 267.29 190.58 267.58 197.44 268.67 204.26 C 269.42 208.93 270.07 213.60 270.50 218.32 C 261.09 211.52 251.93 204.41 242.60 197.52 C 241.76 192.57 240.51 187.70 239.60 182.77 C 236.79 165.83 231.43 149.26 224.37 133.64 C 219.07 121.94 212.13 111.10 202.77 102.23 C 196.23 95.56 187.23 91.36 178.05 90.04 C 169.59 90.69 161.21 94.20 154.81 99.78 C 144.30 108.76 136.33 121.10 130.57 133.56 C 122.02 152.08 116.94 171.78 113.54 191.84 C 113.08 194.68 111.25 196.43 109.10 198.13 C 101.01 204.47 92.70 210.60 84.88 217.27 C 86.09 207.71 86.15 198.17 88.40 188.75 C 89.55 178.72 91.88 168.97 94.30 159.19 C 100.48 137.46 108.07 116.88 121.40 98.42 C 125.69 92.61 130.41 86.60 136.01 82.02 C 142.16 77.05 147.95 72.31 155.42 69.41 C 167.23 64.14 180.66 62.87 193.03 66.99 Z"/>
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

export default function HistoryScreen({ username, firstName, onClose, conceptLexicon = [] }) {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [expanded, setExpanded]             = useState(null);
  const [transcriptOpen, setTranscriptOpen] = useState(null);
  const [activeConcept, setActiveConcept]   = useState(null); // { word, explanation, sessionIdx }

  function findConceptEntry(word) {
    if (!word) return null;
    const w = word.toLowerCase().trim();
    return conceptLexicon.find(e =>
      e.word?.toLowerCase() === w ||
      e.englishTerm?.toLowerCase() === w ||
      e.aliases?.some(a => a.toLowerCase().trim() === w)
    );
  }
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
      background: "rgba(117,117,117,0.10)",
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
                  fontSize: "0.88rem", color: COLORS.success,
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
              fontSize: "0.92rem", color: "#dc2626",
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
                boxShadow: "0 2px 8px rgba(117,117,117,0.05)",
                position: "relative",
              }}>
                {/* Delete button — outside clickable area */}
                <button
                  onClick={e => deleteSession(s.id, e)}
                  title="מחק שיחה"
                  style={{
                    position: "absolute", top: 10, left: 10,
                    background: "none", border: "none", cursor: "pointer",
                    color: COLORS.muted, fontSize: "0.95rem",
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
                      fontSize: "1.1rem", fontWeight: 400, flexShrink: 0,
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
                        fontSize: "0.86rem", color: COLORS.muted,
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

                  {/* Preview row: concept count only */}
                  {hasConcepts && (
                    <div style={{ marginTop: "8px" }}>
                      <div style={{
                        background: "rgba(198,40,40,0.1)",
                        color: COLORS.primary,
                        borderRadius: 9999,
                        padding: "3px 10px",
                        fontFamily: "'Alef', sans-serif",
                        fontSize: "0.74rem", fontWeight: 400,
                        display: "inline-block",
                      }}>{s.concepts.length} מושגים</div>
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

                    {/* Concepts */}
                    {hasConcepts && (
                      <div>
                        <div style={{
                          fontFamily: "'Alef', sans-serif",
                          fontSize: "0.88rem", fontWeight: 700,
                          color: COLORS.secondary, marginBottom: "6px",
                          textTransform: "uppercase", letterSpacing: "0.04em",
                        }}>✦ מושגים</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {s.concepts.map((c, ci) => {
                            const entry = findConceptEntry(c);
                            const isActive = activeConcept?.word === c && activeConcept?.sessionIdx === i;
                            return (
                              <span key={ci}
                                onClick={() => setActiveConcept(
                                  isActive ? null : { word: c, entry, sessionIdx: i }
                                )}
                                style={{
                                  padding: "3px 11px", borderRadius: 9999,
                                  background: isActive ? "rgba(198,40,40,0.15)" : "rgba(254,215,170,0.45)",
                                  border: `1.5px solid ${isActive ? COLORS.primary : "rgba(198,40,40,0.3)"}`,
                                  color: COLORS.primary,
                                  fontFamily: "'Alef', sans-serif",
                                  fontSize: "0.86rem", fontWeight: 600,
                                  cursor: entry ? "pointer" : "default",
                                  userSelect: "none",
                                }}>{entry ? "✦ " : ""}{entry?.word || c}</span>
                            );
                          })}
                        </div>

                        {/* Concept explanation */}
                        {activeConcept?.sessionIdx === i && activeConcept.entry && (
                          <div style={{
                            marginTop: "8px",
                            background: "#f0fdf4",
                            border: "1.5px solid #bbf7d0",
                            borderRadius: 12, padding: "10px 14px",
                            direction: "rtl", position: "relative",
                          }}>
                            <div style={{
                              fontFamily: "'Alef', sans-serif",
                              fontSize: "0.98rem", fontWeight: 700,
                              color: COLORS.secondary, marginBottom: "4px",
                            }}>{activeConcept.entry.word}</div>
                            <div style={{
                              fontFamily: "'Alef', sans-serif",
                              fontSize: "0.92rem", color: COLORS.text, lineHeight: 1.65,
                            }}>{activeConcept.entry.explanation}</div>
                            <button onClick={() => setActiveConcept(null)} style={{
                              position: "absolute", top: 8, left: 10,
                              background: "none", border: "none", cursor: "pointer",
                              color: COLORS.muted, fontSize: "0.75rem",
                            }}>✕</button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Feedback */}
                    {hasFeedback && (
                      <div>
                        <div style={{
                          fontFamily: "'Alef', sans-serif",
                          fontSize: "0.95rem", fontWeight: 400,
                          color: COLORS.secondary, marginBottom: "6px",
                          letterSpacing: "0.02em",
                        }}>✦ פידבק</div>
                        <div style={{
                          fontFamily: "'Alef', sans-serif",
                          fontSize: "0.96rem",
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
                            fontSize: "0.88rem", fontWeight: 700,
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
                                    background: isUser ? "#FFCDD2" : "white",
                                    color: COLORS.text,
                                    fontFamily: "'Alef', sans-serif",
                                    fontSize: "0.88rem",
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

                    {!hasConcepts && !hasFeedback && !hasTranscript && (
                      <div style={{
                        fontFamily: "'Alef', sans-serif",
                        fontSize: "0.92rem", color: COLORS.muted,
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
