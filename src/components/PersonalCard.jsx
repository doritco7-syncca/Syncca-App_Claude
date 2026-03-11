// PersonalCard.jsx — Syncca · Heavy Stone Slab Edition
// Props:
//   record (object), airtableBaseId, airtableTableId, airtableToken, airtableRecordId
//   savedConcepts ([{word, explanation}]), onClose () => void

import { useState, useCallback, useRef } from "react";
import { updateUserProfile } from "../AirtableService";

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

const FIELDS = [
  { key: "First_Name",          label: "שם פרטי",       type: "text",   placeholder: "שמך" },
  { key: "Full_Name",           label: "שם מלא",         type: "text",   placeholder: "שם מלא" },
  { key: "Age_Range",           label: "טווח גיל",       type: "select", options: ["20-29","30-39","40-49","50-59","60-69","70-79","80-100"] },
  { key: "Marital_Status",      label: "מצב משפחתי",     type: "select", options: ["רווק/ה","זוגיות","נשוי/אה","גרוש/ה","אלמן/ה"] },
  { key: "Gender",              label: "מגדר",           type: "select", options: ["אישה","גבר","נון-בינארי/ת","מעדיף/ה לא לציין"] },
  { key: "Language_Preference", label: "שפה מועדפת",     type: "text",   placeholder: "עברית / English" },
];

export default function PersonalCard({
  record = {},
  airtableRecordId,
  savedConcepts = [], onClose,
}) {
  const [form, setForm] = useState({
    First_Name:          record.First_Name          || "",
    Full_Name:           record.Full_Name           || "",
    Age_Range:           record.Age_Range           || "",
    Marital_Status:      record.Marital_Status      || "",
    Gender:              record.Gender              || "",
    Language_Preference: record.Language_Preference || "",
  });
  const [saveState, setSaveState] = useState("idle");
  const [errMsg, setErrMsg]       = useState("");
  const [activeConcept, setActiveConcept] = useState(null); // for concept tooltip

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
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2800);
    } catch (e) {
      setSaveState("error"); setErrMsg(e.message || "שגיאה בשמירה");
    }
  }, [form, airtableRecordId]);

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

        .close-btn {
          background: none; border: none; cursor: pointer;
          color: ${COLORS.muted}; font-size: 1rem;
          width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .close-btn:hover { background: ${COLORS.border}; color: ${COLORS.text}; }

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
          background: COLORS.stone,   // 100% opaque — hides chat completely
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
            padding: "20px 22px 16px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <button className="close-btn" onClick={onClose} title="חזרה לשיחה">✕</button>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.35rem", fontWeight: 700,
              color: COLORS.secondary, direction: "rtl",
            }}>הכרטיס האישי שלי</div>
            <div style={{ width: 30 }} />
          </div>

          {/* SCROLLABLE BODY */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 22px 0" }}>

            {/* Avatar + name */}
            <div style={{
              display: "flex", alignItems: "center", gap: "14px",
              direction: "rtl", marginBottom: "28px",
            }}>
              <div style={{
                width: 54, height: 54, borderRadius: "50%", flexShrink: 0,
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: "1.35rem", fontWeight: 700,
                fontFamily: "'Cormorant Garamond', serif",
              }}>{initials}</div>
              <div>
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.15rem", fontWeight: 700, color: COLORS.text,
                }}>{form.Full_Name || form.First_Name || "שם מלא"}</div>
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.78rem", color: COLORS.muted, direction: "rtl",
                }}>{record.email || ""}</div>
              </div>
            </div>

            {/* Fields — 2-col grid */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: "14px", marginBottom: "14px",
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

            {/* Full-width remaining fields */}
            {FIELDS.slice(4).map(f => (
              <div key={f.key} style={{ marginBottom: "14px" }}>
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
            <div style={{ height: "1px", background: COLORS.border, margin: "22px 0 18px" }} />

            {/* Saved concepts */}
            <div style={{ marginBottom: "28px" }}>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.1rem", fontWeight: 700,
                color: COLORS.secondary, direction: "rtl", marginBottom: "12px",
              }}>מושגים ששמרתי ✦</div>
              {savedConcepts.length === 0 ? (
                <div style={{
                  color: COLORS.muted, fontSize: "0.83rem",
                  fontFamily: "'Inter', sans-serif",
                  direction: "rtl", lineHeight: 1.6,
                }}>
                  לחיצה על מושג מודגש בשיחה תשמור אותו כאן.
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", direction: "rtl" }}>
                  {savedConcepts.map((c, i) => (
                    <div key={i} className="concept-pill"
                      onClick={() => setActiveConcept(activeConcept?.word === c.word ? null : c)}
                      style={{ cursor: "pointer" }}>
                      <span>✦</span><span>{c.word}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Concept explanation popup */}
              {activeConcept && (
                <div style={{
                  marginTop: "14px", background: "#FDFBF7",
                  border: "1.5px solid rgba(30,58,138,0.15)",
                  borderRadius: "16px", padding: "16px 18px",
                  direction: "rtl", position: "relative",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}>
                  <div style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "1.1rem", fontWeight: 700,
                    color: "#1e3a8a", marginBottom: "8px",
                  }}>{activeConcept.word}</div>
                  <div style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.85rem", color: "#374151", lineHeight: 1.65,
                  }}>
                    {activeConcept.explanation || "מושג מרכזי בשפה של זוגיות נקייה."}
                  </div>
                  <button onClick={() => setActiveConcept(null)} style={{
                    position: "absolute", top: "12px", left: "12px",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#6b7280", fontSize: "1rem", lineHeight: 1,
                  }}>✕</button>
                </div>
              )}
            </div>

          </div>

          {/* STICKY SAVE BUTTON */}
          <div style={{
            padding: "14px 22px 22px",
            borderTop: `1px solid ${COLORS.border}`,
            background: COLORS.stone, flexShrink: 0,
          }}>
            {saveState === "error" && errMsg && (
              <div style={{
                color: "#dc2626", fontSize: "0.76rem",
                textAlign: "right", direction: "rtl",
                marginBottom: "8px", paddingRight: "4px",
              }}>{errMsg}</div>
            )}
            <button onClick={handleSave} disabled={saveState === "saving"}
              style={{
                background: saveBg, color: "#fff",
                border: "none", borderRadius: "9999px",
                fontFamily: "'Inter', sans-serif",
                fontSize: "1rem", fontWeight: 600,
                height: "56px", width: "100%",
                cursor: saveState === "saving" ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: saveShadow,
                transition: "background 0.3s, box-shadow 0.3s",
              }}>
              {saveState === "saving"
                ? <span className="spinner" />
                : saveLabel}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
