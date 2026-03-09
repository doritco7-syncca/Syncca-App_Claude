// PersonalCard.jsx — Syncca · Heavy Stone Slab Edition
// Props:
//   record (object), airtableRecordId (string)
//   logRecordId (string) — current session log ID for feedback
//   savedConcepts ([{word, explanation}])
//   onClose () => void
//   onLogout () => void

import { useState, useCallback } from "react";
import { updateUserProfile, saveFeedback, FIELD_MAPS } from "../AirtableService";

const COLORS = {
  stone: "#F9F6EE", stoneLight: "#FCFAF5", frame: "#E8E0F0",
  primary: "#ea580c", primaryH: "#c2410c",
  secondary: "#1e3a8a",
  text: "#1a1a1a", muted: "#6b7280", border: "#E5E0D8",
  success: "#16a34a",
};

const STONE_SHADOW = `
  0 2px 4px rgba(0,0,0,0.06),
  0 6px 12px rgba(0,0,0,0.07),
  0 18px 36px -6px rgba(0,0,0,0.11),
  0 40px 80px -16px rgba(0,0,0,0.14),
  inset 0 1px 0px rgba(255,255,255,0.90)
`;

// UI labels in Hebrew — values are what gets stored in state
// Translation to English happens in AirtableService before saving
const FIELDS = [
  { key: "First_Name",     label: "שם פרטי",    type: "text",   placeholder: "שמך" },
  { key: "Full_Name",      label: "שם מלא",      type: "text",   placeholder: "שם מלא" },
  { key: "Age_Range",      label: "טווח גיל",    type: "select",
    options: ["20-29","30-39","40-49","50-59","60-69","70-79","80-100"] },
  { key: "Marital_Status", label: "מצב משפחתי",  type: "select",
    options: ["רווק/ה","זוגיות","נשוי/ה","גרוש/ה","נפרד/ה","אלמן/ה"] },
  { key: "Gender",         label: "מגדר",        type: "select",
    options: ["אישה","גבר","נון-בינארי/ת","מעדיף/ה לא לציין"] },
  { key: "Language_Preference", label: "שפה מועדפת", type: "text", placeholder: "עברית / English" },
];

// Reverse-map English Airtable values → Hebrew for display (returning users)
function toHebrew(key, value) {
  if (!value || !FIELD_MAPS[key]) return value;
  const reverse = Object.fromEntries(
    Object.entries(FIELD_MAPS[key]).map(([he, en]) => [en, he])
  );
  return reverse[value] || value;
}

export default function PersonalCard({
  record = {},
  airtableRecordId,
  logRecordId,
  savedConcepts = [],
  onClose,
  onLogout,
}) {
  const [form, setForm] = useState({
    First_Name:          record.First_Name          || "",
    Full_Name:           record.Full_Name           || "",
    Age_Range:           toHebrew("Age_Range",      record.Age_Range      || ""),
    Marital_Status:      toHebrew("Marital_Status", record.Marital_Status || ""),
    Gender:              toHebrew("Gender",         record.Gender         || ""),
    Language_Preference: record.Language_Preference || "",
  });
  const [feedback,   setFeedback]   = useState("");
  const [saveState,  setSaveState]  = useState("idle");
  const [errMsg,     setErrMsg]     = useState("");

  function update(k, v) {
    setForm(f => ({ ...f, [k]: v }));
    if (saveState !== "idle") setSaveState("idle");
  }

  const handleSave = useCallback(async () => {
    setSaveState("saving"); setErrMsg("");
    try {
      if (airtableRecordId) {
        await updateUserProfile(airtableRecordId, form);
      }
      if (logRecordId && feedback.trim()) {
        await saveFeedback(logRecordId, feedback.trim());
      }
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2800);
    } catch (e) {
      console.error("PersonalCard save error:", e);
      setSaveState("error");
      setErrMsg(e.message || "שגיאה בשמירה");
    }
  }, [form, feedback, airtableRecordId, logRecordId]);

  const saveBg    = { idle: COLORS.primary, saving: "#f97316", saved: COLORS.success, error: "#dc2626" }[saveState];
  const saveLabel = { idle: "שמירה  💾", saving: "שומר...", saved: "✓  נשמר!", error: "שגיאה — נסי שוב" }[saveState];
  const saveShadow = saveState === "saved"
    ? "0 4px 14px rgba(22,163,74,0.35)"
    : "0 4px 14px rgba(234,88,12,0.30)";

  const initials = (form.First_Name?.[0] || form.Full_Name?.[0] || "?").toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }

        @keyframes stoneRise {
          from { opacity: 0; transform: translateX(40px) scale(0.985); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .pc-slab { animation: stoneRise 0.45s cubic-bezier(0.22,1,0.36,1) both; }

        .pc-field {
          width: 100%; height: 44px;
          background: ${COLORS.stoneLight};
          border: 1.5px solid transparent; border-radius: 9999px;
          padding: 0 16px; font-family: 'Inter', sans-serif;
          font-size: 0.87rem; color: ${COLORS.text};
          outline: none; direction: rtl; text-align: right;
          transition: border-color 0.18s;
          appearance: none; -webkit-appearance: none;
        }
        .pc-field:focus { border-color: ${COLORS.primary}; }
        .pc-field::placeholder { color: ${COLORS.muted}; }

        .pc-textarea {
          width: 100%; min-height: 80px;
          background: ${COLORS.stoneLight};
          border: 1.5px solid transparent; border-radius: 16px;
          padding: 12px 16px; font-family: 'Inter', sans-serif;
          font-size: 0.87rem; color: ${COLORS.text};
          outline: none; direction: rtl; text-align: right;
          transition: border-color 0.18s; resize: vertical;
          line-height: 1.55;
        }
        .pc-textarea:focus { border-color: ${COLORS.primary}; }
        .pc-textarea::placeholder { color: ${COLORS.muted}; }

        .pc-label {
          display: block; margin-bottom: 5px;
          font-family: 'Inter', sans-serif; font-size: 0.66rem;
          font-weight: 600; color: ${COLORS.primary};
          letter-spacing: 0.08em; text-transform: uppercase;
          direction: rtl; text-align: right;
        }

        .concept-pill {
          display: inline-flex; align-items: center; gap: 5px;
          background: ${COLORS.stoneLight};
          border: 1.5px solid ${COLORS.border};
          border-radius: 9999px; padding: 5px 13px;
          font-family: 'Inter', sans-serif; font-size: 0.77rem;
          color: ${COLORS.secondary}; font-weight: 500;
          direction: rtl; cursor: default;
          transition: border-color 0.15s;
        }
        .concept-pill:hover { border-color: ${COLORS.primary}; }

        .icon-btn {
          background: none; border: none; cursor: pointer;
          color: ${COLORS.muted}; font-size: 0.92rem;
          padding: 6px 10px; border-radius: 9999px;
          font-family: 'Inter', sans-serif; font-weight: 500;
          display: flex; align-items: center; gap: 5px;
          transition: background 0.15s, color 0.15s;
        }
        .icon-btn:hover { background: ${COLORS.border}; color: ${COLORS.text}; }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
        .spinner {
          width: 18px; height: 18px; display: inline-block;
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
        <div className="pc-slab" style={{
          background: COLORS.stone,
          borderRadius: "32px",
          boxShadow: STONE_SHADOW,
          width: "100%", maxWidth: "420px",
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
            flexShrink: 0,
          }}>
            {/* Logout button — left side */}
            <button className="icon-btn" onClick={onLogout} title="יציאה מהחשבון">
              <span>↩</span><span>יציאה</span>
            </button>

            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.3rem", fontWeight: 700,
              color: COLORS.secondary, direction: "rtl",
            }}>הכרטיס האישי שלי</div>

            {/* Close — right side */}
            <button className="icon-btn" onClick={onClose} title="חזרה לשיחה"
              style={{ fontSize: "1rem" }}>✕</button>
          </div>

          {/* SCROLLABLE BODY */}
          <div style={{ flex: 1, overflowY: "auto", padding: "22px 20px 0" }}>

            {/* Avatar + name + email */}
            <div style={{
              display: "flex", alignItems: "center", gap: "14px",
              direction: "rtl", marginBottom: "24px",
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: "1.3rem", fontWeight: 700,
                fontFamily: "'Cormorant Garamond', serif",
              }}>{initials}</div>
              <div>
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.1rem", fontWeight: 700, color: COLORS.text,
                }}>{form.Full_Name || form.First_Name || "שם מלא"}</div>
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.76rem", color: COLORS.muted, direction: "ltr",
                }}>{record.email || ""}</div>
              </div>
            </div>

            {/* Profile fields — 2-col grid for first 4 */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: "12px", marginBottom: "12px",
            }}>
              {FIELDS.slice(0, 4).map(f => (
                <div key={f.key}>
                  <label className="pc-label">{f.label}</label>
                  {f.type === "select" ? (
                    <select className="pc-field" value={form[f.key]}
                      onChange={e => update(f.key, e.target.value)}>
                      <option value="">בחרי...</option>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input className="pc-field" placeholder={f.placeholder}
                      value={form[f.key]} onChange={e => update(f.key, e.target.value)} />
                  )}
                </div>
              ))}
            </div>

            {/* Full-width fields */}
            {FIELDS.slice(4).map(f => (
              <div key={f.key} style={{ marginBottom: "12px" }}>
                <label className="pc-label">{f.label}</label>
                {f.type === "select" ? (
                  <select className="pc-field" value={form[f.key]}
                    onChange={e => update(f.key, e.target.value)}>
                    <option value="">בחרי...</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input className="pc-field" placeholder={f.placeholder}
                    value={form[f.key]} onChange={e => update(f.key, e.target.value)} />
                )}
              </div>
            ))}

            {/* Divider */}
            <div style={{ height: "1px", background: COLORS.border, margin: "20px 0 16px" }} />

            {/* Saved concepts */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.05rem", fontWeight: 700,
                color: COLORS.secondary, direction: "rtl", marginBottom: "10px",
              }}>מושגים ששמרתי ✦</div>
              {savedConcepts.length === 0 ? (
                <div style={{
                  color: COLORS.muted, fontSize: "0.82rem",
                  fontFamily: "'Inter', sans-serif",
                  direction: "rtl", lineHeight: 1.6,
                }}>
                  לחיצה על מושג מודגש בשיחה תשמור אותו כאן.
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", direction: "rtl" }}>
                  {savedConcepts.map((c, i) => (
                    <div key={i} className="concept-pill" title={c.explanation}>
                      <span>✦</span><span>{c.word}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Feedback textarea */}
            <div style={{ marginBottom: "24px" }}>
              <label className="pc-label">פידבק על הסינק</label>
              <textarea
                className="pc-textarea"
                placeholder="מה עזר? מה היה מבלבל? מה כדאי לשנות?"
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
              />
            </div>

          </div>

          {/* STICKY SAVE BUTTON */}
          <div style={{
            padding: "12px 20px 20px",
            borderTop: `1px solid ${COLORS.border}`,
            background: COLORS.stone, flexShrink: 0,
          }}>
            {saveState === "error" && errMsg && (
              <div style={{
                color: "#dc2626", fontSize: "0.75rem",
                textAlign: "right", direction: "rtl",
                marginBottom: "8px",
              }}>{errMsg}</div>
            )}
            <button onClick={handleSave} disabled={saveState === "saving"}
              style={{
                background: saveBg, color: "#fff",
                border: "none", borderRadius: "9999px",
                fontFamily: "'Inter', sans-serif",
                fontSize: "1rem", fontWeight: 600,
                height: "54px", width: "100%",
                cursor: saveState === "saving" ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: saveShadow,
                transition: "background 0.3s, box-shadow 0.3s",
              }}>
              {saveState === "saving" ? <span className="spinner" /> : saveLabel}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
