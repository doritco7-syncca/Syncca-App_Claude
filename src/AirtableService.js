// AirtableService.js — Syncca
// Single source of truth for ALL Airtable API calls.
// Tables: Users, Conversation_Logs, Relationship_Lexicon

const TOKEN   = process.env.REACT_APP_AIRTABLE_TOKEN;
const BASE_ID = process.env.REACT_APP_AIRTABLE_BASE_ID;

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

// ─── Core fetch wrapper ───────────────────────────────────────────
async function airtableFetch(path, options = {}) {
  if (!TOKEN || !BASE_ID)
    throw new Error(`Airtable env vars missing. TOKEN:${!!TOKEN} BASE_ID:${!!BASE_ID}`);
  const url = `https://api.airtable.com/v0/${BASE_ID}/${path}`;
  console.log(`[Airtable] ${options.method || "GET"} → ${path}`);
  const res  = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || data?.error?.type || `HTTP ${res.status}`;
    console.error(`[Airtable] ✗ ${res.status} on ${path}:`, msg, JSON.stringify(data));
    throw new Error(`Airtable (${res.status}): ${msg}`);
  }
  console.log(`[Airtable] ✓ ${options.method || "GET"} ${path}`);
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
  // Log the raw first record so we can verify Airtable field names match exactly
  if (all.length > 0) {
    console.log("[fetchLexicon] Field names in Airtable:", Object.keys(all[0].fields));
    console.log("[fetchLexicon] First record:", JSON.stringify(all[0].fields));
  }

  const result = all
    .map(r => ({
      englishTerm:   r.fields.English_Term   || "",
      word:          r.fields.Hebrew_Term    || r.fields.English_Term || "",
      explanation:   r.fields.Description_HE || r.fields.Description_EN || "",
      explanationEN: r.fields.Description_EN || "",
      aliases:       r.fields.Aliases_Heb
                       ? r.fields.Aliases_Heb.split(",").map(a => a.trim()).filter(Boolean)
                       : [],
    }))
    .filter(c => c.englishTerm);

  const withExpl = result.filter(c => c.explanation).length;
  const missing  = result.filter(c => !c.explanation).map(c => c.englishTerm);
  console.log(`[fetchLexicon] ✓ ${result.length} concepts, ${withExpl} with Description_HE, ${missing.length} missing`);
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

export async function incrementSyncCount(recordId, currentCount) {
  const n = (currentCount || 0) + 1;
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

// ATOMIC wallet update: GET current list → merge → PATCH once.
// Called by handleSaveConcept which passes the FULL updated list.
export async function updateSavedConcepts(recordId, allConceptWords) {
  if (!recordId || !allConceptWords?.length) return;

  // GET existing saved concepts from server
  let existing = [];
  try {
    const rec = await airtableFetch(`Users/${recordId}`);
    existing  = (rec.fields?.Saved_Concepts || "").split(",").map(s => s.trim()).filter(Boolean);
  } catch (e) {
    console.warn("[updateSavedConcepts] GET failed — writing client list only:", e);
  }

  const merged = [...new Set([...existing, ...allConceptWords])];
  console.log("[updateSavedConcepts] Writing:", merged);
  return airtableFetch(`Users/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: { Saved_Concepts: merged.join(", ") } }),
  });
}

// Overwrite (used for delete): writes exactly the list given, no merge.
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
  // NOTE: Concepts_Surfaced is intentionally omitted at creation.
  // It is only written when there are actual concepts to record (non-empty).
  if (userRecordId) fields.User_Link = [userRecordId];
  const data = await airtableFetch("Conversation_Logs", {
    method: "POST",
    body: JSON.stringify({ fields }),
  });
  console.log("[createSessionLog] ✓ Created logId:", data.id);
  return data.id;
}

// Fetch all concept names surfaced in previous sessions for this user.
// Used to inject memory into the AI system prompt.
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
    const result = Array.from(all);
    console.log("[fetchPreviousConcepts] ✓ Found:", result);
    return result;
  } catch (e) {
    console.warn("[fetchPreviousConcepts] failed:", e);
    return [];
  }
}

// Fetches last N session summaries for memory injection.
// Returns array of { date, concepts, duration, feedback } — most recent first.
export async function fetchSessionHistory(userRecordId, limit = 5) {
  if (!userRecordId) return [];
  try {
    const f = `FIND("${userRecordId}", ARRAYJOIN({User_Link}))`;
    const fields = ["Created_At", "Concepts_Surfaced", "Session_Duration_Minutes", "Feedback", "Language_Used"];
    const qs = fields.map(f => `fields%5B%5D=${encodeURIComponent(f)}`).join("&");
    const data = await airtableFetch(
      `Conversation_Logs?filterByFormula=${encodeURIComponent(f)}&sort%5B0%5D%5Bfield%5D=Created_At&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=${limit}&${qs}`
    );
    return (data.records || []).map(rec => ({
      date:      rec.fields?.Created_At     || "",
      concepts:  (rec.fields?.Concepts_Surfaced || "").split(",").map(s => s.trim()).filter(Boolean),
      duration:  rec.fields?.Session_Duration_Minutes || null,
      feedback:  rec.fields?.Feedback       || "",
      language:  rec.fields?.Language_Used  || "Hebrew",
    }));
  } catch (e) {
    console.warn("[fetchSessionHistory] failed:", e);
    return [];
  }
}

// syncSession — called ONCE per exchange after AI responds.
// ONLY writes Concepts_Surfaced when array is non-empty — never sends empty string.
export async function syncSession({ logRecordId, fullTranscript, conceptsSurfaced, languageUsed }) {
  if (!logRecordId) {
    console.error("[syncSession] ✗ logRecordId is null — skipped");
    return;
  }

  const fields = {};
  if (fullTranscript !== undefined) fields.Full_Transcript = fullTranscript;
  if (languageUsed   !== undefined) fields.Language_Used   = languageUsed;

  // CRITICAL: only write Concepts_Surfaced when we have actual concepts.
  // Never send empty string — Airtable may reject or it corrupts future fetches.
  if (Array.isArray(conceptsSurfaced) && conceptsSurfaced.length > 0) {
    const deduped = [...new Set(conceptsSurfaced)];
    fields.Concepts_Surfaced = deduped.join(", ");
    console.log("[syncSession] concepts:", fields.Concepts_Surfaced);
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

export async function finalizeSession({ logRecordId, fullTranscript, conceptsSurfaced, sessionStartTime }) {
  if (!logRecordId) return;
  const mins   = sessionStartTime ? Math.round((Date.now() - new Date(sessionStartTime).getTime()) / 60000) : null;
  const fields = { Full_Transcript: fullTranscript || "" };
  if (Array.isArray(conceptsSurfaced) && conceptsSurfaced.length > 0)
    fields.Concepts_Surfaced = conceptsSurfaced.join(", ");
  if (mins !== null) fields.Session_Duration_Minutes = mins;
  return airtableFetch(`Conversation_Logs/${logRecordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
}
