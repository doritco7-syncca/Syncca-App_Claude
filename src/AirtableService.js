// AirtableService.js — Syncca
// All Airtable calls go through /api/airtable proxy (server-side)
// so the API key is never exposed in the browser.

export const FIELD_MAPS = {
  Marital_Status: {
    "רווק/ה": "Single", "זוגיות": "In a relationship",
    "נשוי/ה": "Married", "גרוש/ה": "Divorced",
    "נפרד/ה": "Separated", "אלמן/ה": "Widowed",
  },
  Gender: {
    "אישה": "Female", "גבר": "Male",
    "נון-בינארי/ת": "Other", "מעדיף/ה לא לציין": "Prefer not to say",
  },
  Age_Range: {
    "20-29":"20-29","30-39":"30-39","40-49":"40-49",
    "50-59":"50-59","60-69":"60-69","70-79":"70-79","80-100":"80-100",
  },
};

// ─── Core fetch wrapper — via server proxy ────────────────────────
async function airtableFetch(path, options = {}) {
  // path may already contain query params — pass as-is, don't double-encode
  const url = `/api/airtable?path=${path}`;
  const res = await fetch(url, {
    method:  options.method || "GET",
    headers: { "Content-Type": "application/json" },
    body:    options.body || undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || data?.error?.type || `HTTP ${res.status}`;
    console.error(`[Airtable] ✗ ${res.status} on ${path}:`, msg, JSON.stringify(data));
    throw new Error(`Airtable (${res.status}): ${msg}`);
  }
  return data;
}

// ═══════════ RELATIONSHIP_LEXICON ═══════════════════════════════════
export async function fetchLexicon() {
  let all = [], offset = null;
  do {
    const q    = "Relationship_Lexicon" + (offset ? `?offset=${encodeURIComponent(offset)}` : "");
    const data = await airtableFetch(q);
    if (data.records) all = all.concat(data.records);
    offset = data.offset || null;
  } while (offset);

  const result = all
    .map(r => ({
      englishTerm:   r.fields.English_Term    || "",
      word:          r.fields.Hebrew_Term     || r.fields.English_Term || "",
      explanation:   r.fields.Description_HE  || r.fields.Description_EN || "",
      explanationEN: r.fields.Description_EN  || "",
      germanTerm:    r.fields.German_Term     || "",
      explanationDE: r.fields.Description_Ger || r.fields.Description_EN || "",
      category:      r.fields.Category        || "",
      aliases:       r.fields.Aliases_Heb
                       ? r.fields.Aliases_Heb.split(",").map(a => a.trim()).filter(Boolean)
                       : [],
    }))
    .filter(c => c.englishTerm);

  const missing = result.filter(c => !c.explanation).map(c => c.englishTerm);
  if (missing.length > 0) {
    console.warn("[fetchLexicon] Missing Description_HE for these English_Terms:", missing);
  }
  return result;
}

// ═══════════ USERS ══════════════════════════════════════════════════
export async function findUserByEmail(email) {
  const f    = `LOWER({Email})="${email.toLowerCase()}"`;
  const data = await airtableFetch(`Users?filterByFormula=${encodeURIComponent(f)}`);
  if (data.records?.length > 0)
    return { recordId: data.records[0].id, fields: data.records[0].fields, isNew: false };
  return null;
}

export async function createUser(email) {
  const uid  = "USER_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7).toUpperCase();
  const data = await airtableFetch("Users", {
    method: "POST",
    body: JSON.stringify({ fields: { Username: uid, Email: email, Sync_Count: 0, Created_At: new Date().toISOString() } }),
  });
  return { recordId: data.id, fields: data.fields, isNew: true };
}

export async function findOrCreateUser(email) {
  return (await findUserByEmail(email)) || createUser(email);
}

// ─── Email Verification ───────────────────────────────────────
export async function saveVerificationCode(email, code) {
  const codeStr = String(code);
  const user = await findUserByEmail(email);
  if (user) {
    const rid = user.recordId || user.id;
    await airtableFetch(`Users/${rid}`, {
      method: "PATCH",
      body: JSON.stringify({ fields: { Verification_Code: codeStr } }),
    });
    return { recordId: rid, fields: user.fields };
  } else {
    const data = await airtableFetch("Users", {
      method: "POST",
      body: JSON.stringify({ fields: {
        Email:             email.toLowerCase().trim(),
        Username:          email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") + "_" + Date.now().toString(36),
        Verification_Code: codeStr,
      }}),
    });
    return { recordId: data.id, fields: data.fields };
  }
}

export async function verifyCode(email, inputCode) {
  const user = await findUserByEmail(email);
  if (!user) return { success: false, reason: "user_not_found" };
  const stored = user.fields?.Verification_Code || "";
  if (stored.trim() !== String(inputCode).trim()) return { success: false, reason: "wrong_code" };
  const rid = user.recordId || user.id;
  await airtableFetch(`Users/${rid}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: { Verification_Code: null } }),
  });
  return { success: true, user };
}

export async function incrementSyncCount(recordId, _ignoredCurrentCount) {
  const rec     = await airtableFetch(`Users/${recordId}`);
  const current = Number(rec.fields?.Sync_Count) || 0;
  const n       = current + 1;
  await airtableFetch(`Users/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: { Sync_Count: n } }),
  });
  return n;
}

export async function updateUserProfile(recordId, fields) {
  const selectFields = ["Age_Range", "Marital_Status", "Gender"];
  const textFields   = ["First_Name", "Full_Name", "Language_Preference"];
  const safeFields   = {};
  for (const [k, v] of Object.entries(fields)) {
    if (![...selectFields, ...textFields].includes(k)) continue;
    if (selectFields.includes(k)) {
      if (!v) continue;
      const mapped = FIELD_MAPS[k]?.[v];
      if (mapped) safeFields[k] = mapped;
      else if (Object.values(FIELD_MAPS[k] || {}).includes(v)) safeFields[k] = v;
    } else { safeFields[k] = v; }
  }
  if (!Object.keys(safeFields).length) return;
  return airtableFetch(`Users/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: safeFields }),
  });
}

export async function fetchSavedConcepts(recordId) {
  if (!recordId) { console.warn("[fetchSavedConcepts] no recordId"); return []; }
  try {
    const rec = await airtableFetch(`Users/${recordId}?fields%5B%5D=Saved_Concepts`);
    const raw = rec.fields?.Saved_Concepts || "";
    return raw.split(",").map(s => s.trim()).filter(Boolean);
  } catch (e) {
    console.warn("[fetchSavedConcepts] failed:", e);
    return [];
  }
}

export async function updateSavedConcepts(recordId, allConceptWords) {
  if (!recordId || !allConceptWords?.length) return;
  return airtableFetch(`Users/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: { Saved_Concepts: allConceptWords.join(", ") } }),
  });
}

export async function overwriteSavedConcepts(recordId, allConceptWords) {
  if (!recordId) return;
  const value = (allConceptWords || []).join(", ");
  return airtableFetch(`Users/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: { Saved_Concepts: value } }),
  });
}

// ═══════════ CONVERSATION_LOGS ══════════════════════════════════════
export async function createSessionLog(userRecordId) {
  const sid    = "SESS_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7).toUpperCase();
  const fields = {
    Session_Id:      sid,
    Created_At:      new Date().toISOString(),
    Full_Transcript: "",
    Feedback:        "",
    Language_Used:   "Hebrew",
  };
  if (userRecordId) fields.User_Link = [userRecordId];
  const data = await airtableFetch("Conversation_Logs", {
    method: "POST",
    body: JSON.stringify({ fields }),
  });

  if (userRecordId) {
    airtableFetch(`Users/${userRecordId}`, {
      method: "PATCH",
      body: JSON.stringify({ fields: { Last_Session_At: new Date().toISOString() } }),
    }).catch(e => console.warn("[createSessionLog] Failed to stamp Last_Session_At:", e));
  }

  return data.id;
}

export async function fetchPreviousConcepts(userRecordId) {
  if (!userRecordId) return [];
  try {
    const f    = `FIND("${userRecordId}", ARRAYJOIN({User_Link}))`;
    const data = await airtableFetch(
      `Conversation_Logs?filterByFormula=${encodeURIComponent(f)}&fields%5B%5D=Concepts_Surfaced`
    );
    const all = new Set();
    (data.records || []).forEach(rec => {
      (rec.fields?.Concepts_Surfaced || "").split(",").map(s => s.trim()).filter(Boolean).forEach(c => all.add(c));
    });
    return Array.from(all);
  } catch (e) {
    console.warn("[fetchPreviousConcepts] failed:", e);
    return [];
  }
}

// Fetches last N session summaries for memory injection into the AI system prompt.
// Returns most recent first. All structured fields included so Syncca can
// pick up exactly where the previous session left off.
export async function fetchSessionHistory(username, limit = 5) {
  if (!username) return [];
  try {
    const f = `FIND("${username}", ARRAYJOIN({User_Link}))`;
    const fieldNames = [
      "Created_At",
      "Concepts_Surfaced",
      "Session_Duration_Minutes",
      "Feedback",
      "Language_Used",
      "Session_Insight",       // narrative summary in Hebrew
      "Ladder_Step_Reached",   // integer 1-6
      "Emotional_Arc",         // e.g. "flooded → reflective"
      "Pattern_Identified",    // Compliance | War | Both | Unclear
      "Mode_At_End",           // mirror | coach
      "Core_Theme",            // short English phrase
    ];
    const qs = fieldNames.map(f => `fields%5B%5D=${encodeURIComponent(f)}`).join("&");
    const data = await airtableFetch(
      `Conversation_Logs?filterByFormula=${encodeURIComponent(f)}&sort%5B0%5D%5Bfield%5D=Created_At&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=${limit}&${qs}`
    );
 return (data.records || [])
      .map(rec => ({
        date:         rec.fields?.Created_At                || "",
        concepts:     (rec.fields?.Concepts_Surfaced || "")
                        .split(",").map(s => s.trim().replace(/[\[\]]/g, "")).filter(Boolean),
        duration:     rec.fields?.Session_Duration_Minutes  || null,
        feedback:     rec.fields?.Feedback                  || "",
        language:     rec.fields?.Language_Used             || "Hebrew",
        insight:      rec.fields?.Session_Insight           || "",
        ladderStep:   rec.fields?.Ladder_Step_Reached       || null,
        emotionalArc: rec.fields?.Emotional_Arc             || "",
        pattern:      rec.fields?.Pattern_Identified        || "",
        modeAtEnd:    rec.fields?.Mode_At_End               || "",
        coreTheme:    rec.fields?.Core_Theme                || "",
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (e) {
    console.warn("[fetchSessionHistory] failed:", e);
    return [];
  }
}

export async function syncSession({ logRecordId, fullTranscript, conceptsSurfaced, languageUsed }) {
  if (!logRecordId) {
    console.error("[syncSession] ✗ logRecordId is null — skipped");
    return;
  }
  const fields = {};
  if (fullTranscript !== undefined) fields.Full_Transcript = fullTranscript;
  if (languageUsed   !== undefined) fields.Language_Used   = languageUsed;
  if (Array.isArray(conceptsSurfaced) && conceptsSurfaced.length > 0) {
    fields.Concepts_Surfaced = [...new Set(conceptsSurfaced)].join(", ");
  }
  if (!Object.keys(fields).length) return;
  return airtableFetch(`Conversation_Logs/${logRecordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
}

export async function saveFeedback(logRecordId, feedbackText) {
  if (!logRecordId || !feedbackText) return;
  return airtableFetch(`Conversation_Logs/${logRecordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: { Feedback: feedbackText } }),
  });
}

export async function finalizeSession({ logRecordId, fullTranscript, conceptsSurfaced, sessionStartTime, sessionInsight, securityAlert }) {
  if (!logRecordId) return;
  const mins   = sessionStartTime ? Math.round((Date.now() - new Date(sessionStartTime).getTime()) / 60000) : null;
  const fields = { Full_Transcript: fullTranscript || "" };
  if (Array.isArray(conceptsSurfaced) && conceptsSurfaced.length > 0)
    fields.Concepts_Surfaced = conceptsSurfaced.join(", ");
  if (mins !== null)   fields.Session_Duration_Minutes = mins;
  if (sessionInsight)  fields.Session_Insight = sessionInsight;
  if (securityAlert)   fields.Security_Alert = "YES";
  return airtableFetch(`Conversation_Logs/${logRecordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
}

export async function fetchFullHistory(username, limit = 10) {
  if (!username) return [];
  const formula = `FIND("${username}", ARRAYJOIN({User_Link}))`;
  const fieldList = [
    "Created_At", "Concepts_Surfaced", "Session_Duration_Minutes",
    "Feedback", "Language_Used", "Session_Insight", "Full_Transcript",
    "Ladder_Step_Reached", "Emotional_Arc", "Pattern_Identified",
    "Mode_At_End", "Core_Theme",
  ];
  const fieldQs = fieldList.map(name => `fields%5B%5D=${encodeURIComponent(name)}`).join("&");
  const url = `Conversation_Logs?filterByFormula=${encodeURIComponent(formula)}&sort%5B0%5D%5Bfield%5D=Created_At&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=${limit}&${fieldQs}`;
  const data = await airtableFetch(url);
  return (data.records || [])
    .map(rec => ({
      id:           rec.id,
      date:         rec.fields?.Created_At                || "",
      concepts:     (rec.fields?.Concepts_Surfaced || "")
                      .split(",").map(s => s.trim().replace(/[\[\]]/g, "")).filter(Boolean),
      duration:     rec.fields?.Session_Duration_Minutes  || null,
      feedback:     rec.fields?.Feedback                  || "",
      language:     rec.fields?.Language_Used             || "Hebrew",
      insight:      rec.fields?.Session_Insight           || "",
      transcript:   rec.fields?.Full_Transcript           || "",
      ladderStep:   rec.fields?.Ladder_Step_Reached       || null,
      emotionalArc: rec.fields?.Emotional_Arc             || "",
      pattern:      rec.fields?.Pattern_Identified        || "",
      modeAtEnd:    rec.fields?.Mode_At_End               || "",
      coreTheme:    rec.fields?.Core_Theme                || "",
    }))
.sort((a, b) => new Date(b.date) - new Date(a.date))
    .filter(s => s.transcript && s.transcript.length > 300);
}

// ─── Session Rate Limiting ────────────────────────────────────
export async function checkSessionAllowed(recordId, fields) {
  if (fields?.Is_VIP) return { allowed: true };
  const lastSession = fields?.Last_Session_At;
  if (!lastSession) return { allowed: true };
  const last = new Date(lastSession);
  const now  = new Date();
  const minutesSince = (now - last) / (1000 * 60);
  if (minutesSince < 30) return { allowed: true, isResume: true };
  if (minutesSince < 24 * 60) {
    const minutesLeft = Math.ceil(24 * 60 - minutesSince);
    const timeMsg = minutesLeft < 60
      ? `בעוד כ-${minutesLeft} דקות`
      : `בעוד כ-${Math.ceil(minutesLeft / 60)} שעות`;
    return {
      allowed: false,
      message: `שמחה שחזרת 🙏 כדי שהשיחות יהיו ממוקדות ואפקטיביות, סינקה פתוחה לשיחה אחת ב-24 שעות. תוכל/י לחזור ${timeMsg}. מחכה לך!`
    };
  }
  return { allowed: true };
}

export async function markSessionStarted(recordId) {
  return airtableFetch(`Users/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: { Last_Session_At: new Date().toISOString() } }),
  });
}
