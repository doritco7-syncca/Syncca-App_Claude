// PersonalCard.jsx — Syncca · Heavy Stone Slab Edition
// Props:
//   record (object), airtableBaseId, airtableTableId, airtableToken, airtableRecordId
//   savedConcepts ([{word, explanation}]), onClose () => void

import { useState, useCallback, useRef } from "react";
import { updateUserProfile, FIELD_MAPS } from "../AirtableService";

const COLORS = {
  stone: "#F9F6EE", stoneLight: "#FCFAF5", frame: "#E8E0F0",
  primary: "#C62828", primaryH: "#B71C1C",
  secondary: "#757575",
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
  { key: "Marital_Status",      label: "מצב משפחתי",     type: "select", options: ["רווק/ה","זוגיות","נשוי/ה","גרוש/ה","אלמן/ה"] },
  { key: "Gender",              label: "מגדר",           type: "select", options: ["אישה","גבר","נון-בינארי/ת","מעדיף/ה לא לציין"] },
  { key: "Language_Preference", label: "שפה מועדפת",     type: "text",   placeholder: "עברית / English" },
];

export default function PersonalCard({
  record = {},
  airtableRecordId,
  savedConcepts = [], conceptLexicon = [], chatLang = "he", onClose, onRecordUpdate, onDeleteConcept,
}) {
  console.log("[PersonalCard] render — savedConcepts:", savedConcepts, "airtableRecordId:", airtableRecordId);
  // Reverse-map: Airtable stores English values, UI shows Hebrew
  function fromAirtable(key, val) {
    if (!val) return "";
    const map = FIELD_MAPS[key];
    if (!map) return val;
    // If val is already Hebrew (direct match) — use it
    if (Object.keys(map).includes(val)) return val;
    // If val is English — find the Hebrew key
    return Object.keys(map).find(k => map[k] === val) || val;
  }

  const [form, setForm] = useState({
    First_Name:          record.First_Name          || "",
    Full_Name:           record.Full_Name           || "",
    Age_Range:           fromAirtable("Age_Range",      record.Age_Range),
    Marital_Status:      fromAirtable("Marital_Status", record.Marital_Status),
    Gender:              fromAirtable("Gender",         record.Gender),
    Language_Preference: record.Language_Preference || "",
  });
  const [saveState, setSaveState] = useState("idle");
  const [errMsg, setErrMsg]       = useState("");
  const [activeConcept, setActiveConcept] = useState(null);



  function stripHe(term) {
    return (term || "").split(" ").map(w => w.startsWith("ה") && w.length > 2 ? w.slice(1) : w).join(" ");
  }

  function findEntry(c) {
    const t = c.englishTerm || c.word || "";
    const w = c.word || "";
    return conceptLexicon.find(e =>
      e.englishTerm === t || e.englishTerm === w ||
      e.word === w || e.word === t ||
      e.aliases?.some(a => a === w || a === t ||
        stripHe(a) === stripHe(w) || stripHe(a) === stripHe(t))
    );
  }

  function resolveWord(c) {
    const entry = findEntry(c);
    if (chatLang === "en") return entry?.englishTerm || c.englishTerm || c.word;
    return entry?.word || c.word || c.englishTerm;
  }

  function resolveExplanation(c) {
    const entry = findEntry(c);
    if (chatLang === "en") return entry?.explanationEN || c.explanationEN || entry?.explanation || "";
    return entry?.explanation || c.explanation || "מושג מרכזי בשפה של זוגיות נקייה.";
  }

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
      // Notify parent so userRecord stays in sync — prevents dropdown reset on reopen
      if (onRecordUpdate) {
        // Translate form back to Airtable values for the parent record
        const updatedRecord = { ...record, ...form };
        // Select fields are stored as Airtable English values in the parent
        const selectKeys = ["Marital_Status", "Gender", "Age_Range"];
        selectKeys.forEach(k => {
          if (form[k] && FIELD_MAPS[k]?.[form[k]]) {
            updatedRecord[k] = FIELD_MAPS[k][form[k]];
          }
        });
        onRecordUpdate(updatedRecord);
      }
      setTimeout(() => setSaveState("idle"), 2800);
    } catch (e) {
      setSaveState("error"); setErrMsg(e.message || "שגיאה בשמירה");
    }
  }, [form, airtableRecordId]);

  const saveBg    = { idle: COLORS.primary, saving: "#E53935", saved: COLORS.success, error: "#dc2626" }[saveState];
  const saveLabel = { idle: "שמירה  💾", saving: "שומר...", saved: "✓  נשמר!", error: "שגיאה — כדאי לנסות שוב" }[saveState];
  const saveShadow = saveState === "saved"
    ? "0 4px 14px rgba(22,163,74,0.35)"
    : "0 4px 14px rgba(198,40,40,0.30)";

  const initials = (form.First_Name?.[0] || form.Full_Name?.[0] || "?").toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@400;500;600;700&family=Alef:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }

        @keyframes stoneRise {
          from { opacity: 0; transform: translateX(40px) scale(0.985); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .pc-slab { animation: stoneRise 0.45s cubic-bezier(0.22,1,0.36,1) both; }

        .pc-field {
          width: 100%; height: 36px;
          background: ${COLORS.stoneLight};
          border: 1.5px solid transparent; border-radius: 9999px;
          padding: 0 12px; font-family: 'Alef', sans-serif;
          font-size: 0.8rem; color: ${COLORS.text};
          outline: none; direction: rtl; text-align: right;
          transition: border-color 0.18s, background 0.18s;
          appearance: none; -webkit-appearance: none;
        }
        .pc-field:focus { border-color: ${COLORS.primary}; }
        .pc-field::placeholder { color: ${COLORS.muted}; }
        .pc-field:placeholder-shown,
        .pc-field option:checked[value=""] ~ .pc-field,
        select.pc-field:invalid { background: #f0fdf4; }

        .pc-label {
          display: block; margin-bottom: 3px;
          font-family: 'Alef', sans-serif; font-size: 0.6rem;
          font-weight: 600; color: ${COLORS.primary};
          letter-spacing: 0.08em; text-transform: uppercase;
          direction: rtl; text-align: right;
        }

        .concept-pill {
          display: inline-flex; align-items: center; gap: 5px;
          background: ${COLORS.stoneLight};
          border: 1.5px solid ${COLORS.border};
          border-radius: 9999px; padding: 5px 13px;
          font-family: 'Alef', sans-serif; font-size: 0.77rem;
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
        padding: "10px", fontFamily: "'Alef', sans-serif",
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
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <svg width={36} height={29.2} viewBox="0 0 357 289" fill="none" style={{ display: "block", flexShrink: 0 }}>
                <path fill="#C62828" d="M 177.98 13.80 C 185.90 13.76 193.02 16.01 200.74 17.42 C 208.14 19.43 215.55 22.00 222.24 25.77 C 241.68 35.95 258.08 52.59 270.53 70.47 C 289.26 96.82 301.12 126.36 309.31 157.49 C 311.25 165.56 313.46 173.52 314.53 181.78 C 316.20 189.97 317.68 198.14 318.27 206.49 C 318.90 215.83 320.96 224.65 320.99 234.00 C 321.03 240.76 320.99 247.52 321.00 254.29 C 310.69 247.14 300.61 239.65 290.31 232.49 C 289.24 222.32 288.03 212.18 286.84 202.03 C 286.10 193.54 283.67 185.38 282.47 176.94 C 279.31 164.12 276.28 151.06 271.41 138.76 C 264.67 119.21 255.01 100.82 242.93 84.04 C 235.97 74.73 227.91 66.35 218.62 59.35 C 212.47 54.88 205.53 51.42 198.53 48.52 C 187.82 44.26 176.29 43.95 165.08 46.17 C 151.65 49.07 138.95 56.77 128.59 65.62 C 121.81 71.41 116.61 78.23 111.28 85.30 C 90.71 113.36 79.04 146.42 71.96 180.21 C 69.75 188.60 69.32 197.01 67.72 205.47 C 66.08 213.13 66.23 221.20 65.31 229.03 C 65.08 230.30 65.16 232.14 64.11 233.04 C 60.76 236.39 56.38 238.66 52.75 241.75 C 49.42 244.64 45.59 246.30 42.67 249.64 C 40.52 252.23 37.38 252.96 34.37 254.28 C 34.48 244.24 33.80 233.88 34.98 224.00 C 35.77 217.61 35.43 211.35 36.72 205.02 C 38.57 196.30 38.88 187.44 40.89 178.76 C 42.62 171.77 43.53 164.66 45.69 157.77 C 48.50 146.06 52.47 134.79 56.45 123.43 C 64.44 104.11 73.94 84.28 86.44 67.45 C 97.38 52.83 110.77 38.97 126.42 29.40 C 131.35 26.00 136.88 23.46 142.49 21.40 C 147.52 19.95 151.78 17.54 156.99 16.86 C 164.21 15.83 170.56 13.41 177.98 13.80 Z"/>
                <path fill="#757575" d="M 193.03 66.99 C 205.13 70.58 216.03 78.27 224.55 87.46 C 238.86 102.30 248.21 121.75 254.99 141.02 C 260.21 154.98 263.19 169.22 266.15 183.77 C 267.29 190.58 267.58 197.44 268.67 204.26 C 269.42 208.93 270.07 213.60 270.50 218.32 C 261.09 211.52 251.93 204.41 242.60 197.52 C 241.76 192.57 240.51 187.70 239.60 182.77 C 236.79 165.83 231.43 149.26 224.37 133.64 C 219.07 121.94 212.13 111.10 202.77 102.23 C 196.23 95.56 187.23 91.36 178.05 90.04 C 169.59 90.69 161.21 94.20 154.81 99.78 C 144.30 108.76 136.33 121.10 130.57 133.56 C 122.02 152.08 116.94 171.78 113.54 191.84 C 113.08 194.68 111.25 196.43 109.10 198.13 C 101.01 204.47 92.70 210.60 84.88 217.27 C 86.09 207.71 86.15 198.17 88.40 188.75 C 89.55 178.72 91.88 168.97 94.30 159.19 C 100.48 137.46 108.07 116.88 121.40 98.42 C 125.69 92.61 130.41 86.60 136.01 82.02 C 142.16 77.05 147.95 72.31 155.42 69.41 C 167.23 64.14 180.66 62.87 193.03 66.99 Z"/>
              </svg>
              <div style={{
                fontFamily: "'Alef', sans-serif",
                fontSize: "0.95rem", fontWeight: 700,
                color: COLORS.secondary, direction: "rtl",
              }}>הכרטיס האישי שלי</div>
            </div>
            <div style={{ width: 30 }} />
          </div>

          {/* TOP PANEL — personal details, 2/3 */}
          <div style={{ flex: 2, overflowY: "auto", padding: "14px 18px 14px", minHeight: 0 }}>

            {/* Avatar + name */}
            <div style={{
              display: "flex", alignItems: "center", gap: "12px",
              direction: "rtl", marginBottom: "12px",
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: "0.6rem", fontWeight: 700,
                fontFamily: "'Alef', sans-serif",
              }}>{initials}</div>
              <div>
                <div style={{
                  fontFamily: "'Alef', sans-serif",
                  fontSize: "0.95rem", fontWeight: 700, color: COLORS.text,
                }}>{form.Full_Name || form.First_Name || "שם מלא"}</div>
                <div style={{
                  fontFamily: "'Alef', sans-serif",
                  fontSize: "0.86rem", color: COLORS.muted, direction: "rtl",
                }}>{record.email || ""}</div>
              </div>
            </div>

            {/* Fields — 2-col grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {FIELDS.map(f => (
                <div key={f.key}>
                  <label className="pc-label">{f.label}</label>
                  {f.type === "select" ? (
                    <select className="pc-field" value={form[f.key]}
                      onChange={e => update(f.key, e.target.value)}
                      style={{ background: !form[f.key] ? "#f0fdf4" : undefined }}>
                      <option value="">בחרי...</option>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input className="pc-field" placeholder={f.placeholder}
                      value={form[f.key]} onChange={e => update(f.key, e.target.value)}
                      style={{ background: !form[f.key] ? "#f0fdf4" : undefined }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* DIVIDER with label */}
          <div style={{ flexShrink: 0, position: "relative", margin: "0 18px" }}>
            <div style={{ height: "2px", background: COLORS.border }} />
            <span style={{
              position: "absolute", top: "-10px", left: "50%",
              transform: "translateX(-50%)",
              background: COLORS.stone, padding: "0 12px",
              fontFamily: "'Alef', sans-serif",
              fontSize: "0.82rem", fontWeight: 700,
              color: COLORS.secondary, whiteSpace: "nowrap",
            }}>✦ המושגים שלי</span>
          </div>

          {/* BOTTOM PANEL — saved concepts, 1/3 */}
          <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 12px", minHeight: 0 }}>
            {(() => {
              const displayConcepts = savedConcepts;
              return displayConcepts.length === 0 ? (
              <div style={{
                color: COLORS.muted, fontSize: "0.82rem",
                fontFamily: "'Alef', sans-serif",
                direction: "rtl", lineHeight: 1.6,
              }}>
                לחיצה על מושג מודגש בשיחה תשמור אותו כאן.
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", direction: "rtl" }}>
                {displayConcepts.map((c, i) => (
                  <div key={i} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                    <div className="concept-pill"
                      onClick={() => setActiveConcept(prev => prev?._idx === i ? null : { ...c, _idx: i })}
                      style={{ cursor: "pointer", userSelect: "none", paddingLeft: "22px" }}>
                      <span>✦</span><span>{resolveWord(c)}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (activeConcept?._idx === i) setActiveConcept(null); onDeleteConcept?.(c); }}
                      title="הסר מושג"
                      style={{
                        position: "absolute", left: "6px",
                        background: "none", border: "none", cursor: "pointer",
                        color: "rgba(198,40,40,0.45)", fontSize: "0.6rem", lineHeight: 1,
                        padding: "2px", display: "flex", alignItems: "center",
                      }}>✕</button>
                  </div>
                ))}
              </div>
            );
            })()}

            {activeConcept && (
              <div style={{
                marginTop: "10px", background: "#f0fdf4",
                border: "1.5px solid #bbf7d0",
                borderRadius: "14px", padding: "12px 16px",
                direction: "rtl", position: "relative",
                boxShadow: "0 2px 12px rgba(22,163,74,0.08)",
              }}>
                <div style={{
                  fontFamily: "'Alef', sans-serif",
                  fontSize: "1rem", fontWeight: 700,
                  color: "#757575", marginBottom: "6px",
                }}>{resolveWord(activeConcept)}</div>
                <div style={{
                  fontFamily: "'Alef', sans-serif",
                  fontSize: "0.82rem", color: "#374151", lineHeight: 1.6,
                }}>{resolveExplanation(activeConcept)}</div>
                <button onClick={() => setActiveConcept(null)} style={{
                  position: "absolute", top: "10px", left: "10px",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#6b7280", fontSize: "0.9rem", lineHeight: 1,
                }}>✕</button>
              </div>
            )}
          </div>

          {/* STICKY SAVE BUTTON */}
          <div style={{
            padding: "14px 22px 22px",
            borderTop: `1px solid ${COLORS.border}`,
            background: COLORS.stone, flexShrink: 0,
          }}>
            {saveState === "error" && errMsg && (
              <div style={{
                color: "#dc2626", fontSize: "0.91rem",
                textAlign: "right", direction: "rtl",
                marginBottom: "8px", paddingRight: "4px",
              }}>{errMsg}</div>
            )}
            <button onClick={handleSave} disabled={saveState === "saving"}
              style={{
                background: saveBg, color: "#fff",
                border: "none", borderRadius: "9999px",
                fontFamily: "'Alef', sans-serif",
                fontSize: "1rem", fontWeight: 600,
                height: "36px", width: "100%",
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
