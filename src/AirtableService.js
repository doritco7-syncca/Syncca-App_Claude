// AirtableService.js — Syncca
// Single source of truth for ALL Airtable API calls.
// Tables: Users, Conversation_Logs, Relationship_Lexicon

const TOKEN   = process.env.REACT_APP_AIRTABLE_TOKEN;
const BASE_ID = process.env.REACT_APP_AIRTABLE_BASE_ID;

const TABLES = {
  users:   "Users",
  logs:    "Conversation_Logs",
  lexicon: "Relationship_Lexicon",
};

// ─── Hebrew → English mappings for Single Select fields ──────────
export const FIELD_MAPS = {
  Marital_Status: {
    "רווק/ה":  "Single",
    "זוגיות":  "In a relationship",
    "נשוי/ה":  "Married",
    "גרוש/ה":  "Divorced",
    "נפרד/ה":  "Separated",
    "אלמן/ה":  "Widowed",
  },
  Gender: {
    "אישה":             "Female",
    "גבר":              "Male",
    "נון-בינארי/ת":     "Other",
    "מעדיף/ה לא לציין": "Prefer not to say",
  },
  Age_Range: {
    "20-29": "20-29", "30-39": "30-39", "40-49": "40-49",
    "50-59": "50-59", "60-69": "60-69", "70-79": "70-79", "80-100": "80-100",
  },
};

// ─── Shared fetch wrapper ─────────────────────────────────────────
async function airtableFetch(tableName, path, options = {}) {
  if (!TOKEN || !BASE_ID) {
    throw new Error(`Airtable env vars missing. TOKEN: ${!!TOKEN}, BASE_ID: ${!!BASE_ID}`);
  }
  const base = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}`;
  const url  = path ? `${base}/${path}` : base;
  console.log(`[Airtable] ${options.method || "GET"} ${tableName}`, url);
  const res  = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  console.log(`[Airtable] response ${res.status}`, data);
  if (!res.ok) {
    const msg = data?.error?.message || data?.error?.type || `HTTP ${res.status}`;
    throw new Error(`Airtable [${tableName}] (${res.status}): ${msg}`);
  }
  return data;
}

// ═══════════════════════════════════════════════════
// RELATIONSHIP_LEXICON TABLE
// Columns: English_Term (primary), Hebrew_Term, Description_HE, Description_EN
// ═══════════════════════════════════════════════════

// Fetch all concepts from Airtable — returns array for UI + system prompt
export async function fetchLexicon() {
  let allRecords = [];
  let offset     = null;
  do {
    const q    = offset ? `?offset=${encodeURIComponent(offset)}` : "";
    const data = await airtableFetch(TABLES.lexicon, q);
    if (data.records) allRecords = allRecords.concat(data.records);
    offset = data.offset || null;
  } while (offset);

  return allRecords
    .map(r => ({
      englishTerm:   r.fields.English_Term   || "",
      word:          r.fields.Hebrew_Term    || r.fields.English_Term || "",
      explanation:   r.fields.Description_HE || r.fields.Description_EN || "",
      explanationEN: r.fields.Description_EN || "",
    }))
    .filter(c => c.englishTerm);
}

// ═══════════════════════════════════════════════════
// USERS TABLE
// ═══════════════════════════════════════════════════

export async function findUserByEmail(email) {
  const formula = `LOWER({Email})="${email.toLowerCase()}"`;
  const data = await airtableFetch(
    TABLES.users,
    `?filterByFormula=${encodeURIComponent(formula)}`
  );
  if (data.records?.length > 0) {
    return { recordId: data.records[0].id, fields: data.records[0].fields, isNew: false };
  }
  return null;
}

export async function createUser(email) {
  const uid  = "USER_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7).toUpperCase();
  const data = await airtableFetch(TABLES.users, "", {
    method: "POST",
    body: JSON.stringify({
      fields: {
        Username:   uid,
        Email:      email,
        Sync_Count: 0,
        Created_At: new Date().toISOString(),
      },
    }),
  });
  return { recordId: data.id, fields: data.fields, isNew: true };
}

export async function findOrCreateUser(email) {
  return (await findUserByEmail(email)) || createUser(email);
}

export async function incrementSyncCount(recordId, currentCount) {
  const newCount = (currentCount || 0) + 1;
  await airtableFetch(TABLES.users, recordId, {
    method: "PATCH",
    body: JSON.stringify({ fields: { Sync_Count: newCount } }),
  });
  return newCount;
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
    } else {
      safeFields[k] = v;
    }
  }
  if (Object.keys(safeFields).length === 0) return;
  return airtableFetch(TABLES.users, recordId, {
    method: "PATCH",
    body: JSON.stringify({ fields: safeFields }),
  });
}

// ATOMIC — fetches existing Saved_Concepts from Airtable first, merges, then PATCHes.
// This is safe even if client state is stale (e.g. new device, page refresh mid-session).
export async function updateSavedConcepts(recordId, newConceptWords) {
  if (!recordId || !newConceptWords?.length) return;

  // Fetch current server value
  let existing = [];
  try {
    const rec = await airtableFetch(TABLES.users, recordId);
    const raw = rec.fields?.Saved_Concepts || "";
    existing  = raw.split(",").map(s => s.trim()).filter(Boolean);
  } catch (e) {
    console.warn("[updateSavedConcepts] GET failed, proceeding with client list:", e);
  }

  // Merge and deduplicate
  const merged = [...new Set([...existing, ...newConceptWords])];

  return airtableFetch(TABLES.users, recordId, {
    method: "PATCH",
    body: JSON.stringify({ fields: { Saved_Concepts: merged.join(", ") } }),
  });
}

// ═══════════════════════════════════════════════════
// CONVERSATION_LOGS TABLE
// Columns: Session_Id (primary), Created_At, User_Link,
//          Full_Transcript, Concepts_Surfaced, Feedback,
//          Session_Duration_Minutes, Language_Used
// ═══════════════════════════════════════════════════

export async function createSessionLog(userRecordId) {
  const sessionId = "SESS_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7).toUpperCase();
  const fields    = {
    Session_Id:        sessionId,
    Created_At:        new Date().toISOString(),
    Full_Transcript:   "",
    Concepts_Surfaced: "",
    Feedback:          "",
    Language_Used:     "Hebrew",
  };
  if (userRecordId) fields.User_Link = [userRecordId];
  const data = await airtableFetch(TABLES.logs, "", {
    method: "POST",
    body: JSON.stringify({ fields }),
  });
  return data.id;
}

// Reads all previous sessions for a user and returns unique concepts surfaced
export async function fetchPreviousConcepts(userRecordId) {
  if (!userRecordId) return [];
  // FIND() works for linked record fields (arrays); equality check doesn't
  const formula = `FIND("${userRecordId}", ARRAYJOIN({User_Link}))`;
  const data = await airtableFetch(
    TABLES.logs,
    `?filterByFormula=${encodeURIComponent(formula)}&fields%5B%5D=Concepts_Surfaced&sort%5B0%5D%5Bfield%5D=Created_At&sort%5B0%5D%5Bdirection%5D=desc`
  );
  const allConcepts = new Set();
  for (const rec of data.records || []) {
    const raw = rec.fields?.Concepts_Surfaced || "";
    raw.split(",").map(s => s.trim()).filter(Boolean).forEach(c => allConcepts.add(c));
  }
  return Array.from(allConcepts);
}

// syncSession — extracts [[brackets]] from synccaResponse and accumulates
export async function syncSession({
  logRecordId,
  fullTranscript,
  conceptsSurfaced, // full accumulated list from App.jsx — always explicit
  languageUsed,
}) {
  if (!logRecordId) return;

  const fields = {};

  if (fullTranscript !== undefined) fields.Full_Transcript = fullTranscript;
  if (languageUsed   !== undefined) fields.Language_Used   = languageUsed;

  // conceptsSurfaced is the full accumulated list from App.jsx (conceptsIntroducedRef).
  // No GET needed — App.jsx ref is the source of truth.
  if (conceptsSurfaced !== undefined) {
    const deduped = [...new Set(Array.isArray(conceptsSurfaced) ? conceptsSurfaced : [])];
    fields.Concepts_Surfaced = deduped.join(", ");
  }

  if (Object.keys(fields).length === 0) return;
  return airtableFetch(TABLES.logs, logRecordId, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
}

export async function saveFeedback(logRecordId, feedbackText) {
  if (!logRecordId || !feedbackText) return;
  return airtableFetch(TABLES.logs, logRecordId, {
    method: "PATCH",
    body: JSON.stringify({ fields: { Feedback: feedbackText } }),
  });
}

export async function finalizeSession({ logRecordId, fullTranscript, conceptsSurfaced, sessionStartTime }) {
  if (!logRecordId) return;
  const durationMinutes = sessionStartTime
    ? Math.round((Date.now() - new Date(sessionStartTime).getTime()) / 60000)
    : null;
  const fields = {
    Full_Transcript:   fullTranscript || "",
    Concepts_Surfaced: Array.isArray(conceptsSurfaced)
      ? conceptsSurfaced.join(", ")
      : (conceptsSurfaced || ""),
  };
  if (durationMinutes !== null) fields.Session_Duration_Minutes = durationMinutes;
  return airtableFetch(TABLES.logs, logRecordId, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
}
