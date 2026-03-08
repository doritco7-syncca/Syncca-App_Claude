// AirtableService.js — Syncca
// Single source of truth for ALL Airtable API calls.
// Tables: Users, Conversation_Logs

const TOKEN   = process.env.REACT_APP_AIRTABLE_TOKEN;
const BASE_ID = process.env.REACT_APP_AIRTABLE_BASE_ID;

const TABLES = {
  users: "Users",
  logs:  "Conversation_Logs",
};

// ─── Hebrew → English mappings for Single Select fields ──────────
// Airtable Single Select fields only accept the exact English strings
// defined in the field options. The UI shows Hebrew — we translate before saving.
export const FIELD_MAPS = {
  Marital_Status: {
    "רווק/ה":    "Single",
    "זוגיות":    "In a relationship",
    "נשוי/ה":    "Married",
    "גרוש/ה":    "Divorced",
    "אלמן/ה":    "Separated",
  },
  Gender: {
    "אישה":               "Female",
    "גבר":                "Male",
    "נון-בינארי/ת":       "Other",
    "מעדיף/ה לא לציין":   "Prefer not to say",
  },
  Age_Range: {
    "20-29": "20-29",
    "30-39": "30-39",
    "40-49": "40-49",
    "50-59": "50-59",
    "60-69": "60-69",
    "70-79": "70-79",
    "80-100": "80-100",
  },
};

// ─── Shared fetch wrapper ─────────────────────────────────────────
async function airtableFetch(tableName, path, options = {}) {
  if (!TOKEN || !BASE_ID) {
    throw new Error(
      `Airtable env vars missing. TOKEN: ${!!TOKEN}, BASE_ID: ${!!BASE_ID}`
    );
  }

  const base = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}`;
  const url  = path ? `${base}/${path}` : base;

  console.log(`[Airtable] ${options.method || "GET"} ${tableName}`, url);

  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type":  "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json();
  console.log(`[Airtable] response ${res.status}`, data);

  if (!res.ok) {
    const msg = data?.error?.message || data?.error?.type || `HTTP ${res.status}`;
    throw new Error(`Airtable [${tableName}] error (${res.status}): ${msg}`);
  }

  return data;
}

// ═══════════════════════════════════════════════════
// USERS TABLE
// Columns: Email, General_Notes, Created_At, Language_Preference,
//          Full_Name, First_Name, Marital_Status, Age_Range,
//          Gender, Saved_Concepts, Conversation_Logs, Sync_Count
// ═══════════════════════════════════════════════════

export async function findUserByEmail(email) {
  const formula = `LOWER({Email})="${email.toLowerCase()}"`;
  const data = await airtableFetch(
    TABLES.users,
    `?filterByFormula=${encodeURIComponent(formula)}`
  );
  if (data.records?.length > 0) {
    return {
      recordId: data.records[0].id,
      fields:   data.records[0].fields,
      isNew:    false,
    };
  }
  return null;
}

export async function createUser(email) {
  const data = await airtableFetch(TABLES.users, "", {
    method: "POST",
    body: JSON.stringify({
      fields: {
        Email:      email,
        Sync_Count: 0,
        Created_At: new Date().toISOString(),
      },
    }),
  });
  return { recordId: data.id, fields: data.fields, isNew: true };
}

export async function findOrCreateUser(email) {
  const existing = await findUserByEmail(email);
  if (existing) return existing;
  return createUser(email);
}

// Sync_Count is internal — never shown to user
export async function incrementSyncCount(recordId, currentCount) {
  const newCount = (currentCount || 0) + 1;
  await airtableFetch(TABLES.users, recordId, {
    method: "PATCH",
    body: JSON.stringify({ fields: { Sync_Count: newCount } }),
  });
  return newCount;
}

// Called from PersonalCard save button
// Translates Hebrew UI values → English Airtable values before saving
export async function updateUserProfile(recordId, fields) {
  const selectFields = ["Age_Range", "Marital_Status", "Gender"];
  const textFields   = ["First_Name", "Full_Name", "Language_Preference"];
  const allowed      = [...selectFields, ...textFields];

  const safeFields = {};
  for (const [k, v] of Object.entries(fields)) {
    if (!allowed.includes(k)) continue;

    if (selectFields.includes(k)) {
      if (!v) continue; // skip empty — Airtable 422 on empty select
      const mapped = FIELD_MAPS[k]?.[v];
      if (mapped) {
        safeFields[k] = mapped;        // save English value
      } else if (Object.values(FIELD_MAPS[k] || {}).includes(v)) {
        safeFields[k] = v;             // already English (returning user)
      }
      // if neither, skip — unknown value
    } else {
      safeFields[k] = v;              // text fields pass through as-is
    }
  }

  if (Object.keys(safeFields).length === 0) return;

  return airtableFetch(TABLES.users, recordId, {
    method: "PATCH",
    body: JSON.stringify({ fields: safeFields }),
  });
}

// Save concepts list to user profile
export async function updateSavedConcepts(recordId, conceptsArray) {
  if (!recordId || !conceptsArray?.length) return;
  const conceptString = Array.isArray(conceptsArray)
    ? conceptsArray.join(", ")
    : conceptsArray;
  return airtableFetch(TABLES.users, recordId, {
    method: "PATCH",
    body: JSON.stringify({ fields: { Saved_Concepts: conceptString } }),
  });
}

// ═══════════════════════════════════════════════════
// CONVERSATION_LOGS TABLE
// Columns: Session_Id (primary), Created_At, User_Link (linked),
//          Full_Transcript, Concepts_Surfaced, Feedback,
//          Session_Duration_Minutes, Language_Used
// ═══════════════════════════════════════════════════

// Create a new log record at session start — returns logRecordId
export async function createSessionLog(userRecordId) {
  const data = await airtableFetch(TABLES.logs, "", {
    method: "POST",
    body: JSON.stringify({
      fields: {
        User_Link:         userRecordId ? [userRecordId] : undefined,
        Created_At:        new Date().toISOString(),
        Full_Transcript:   "",
        Concepts_Surfaced: "",
        Feedback:          "",
        Language_Used:     "Hebrew",
      },
    }),
  });
  return data.id;
}

// Sync session mid-conversation (called after each exchange)
export async function syncSession({ logRecordId, fullTranscript, conceptsSurfaced, languageUsed }) {
  if (!logRecordId) return;

  const fields = {};
  if (fullTranscript   !== undefined) fields.Full_Transcript   = fullTranscript;
  if (conceptsSurfaced !== undefined) fields.Concepts_Surfaced = Array.isArray(conceptsSurfaced)
    ? conceptsSurfaced.join(", ")
    : conceptsSurfaced;
  if (languageUsed !== undefined) fields.Language_Used = languageUsed;

  if (Object.keys(fields).length === 0) return;

  return airtableFetch(TABLES.logs, logRecordId, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
}

// Save feedback from PersonalCard or timeout modal
export async function saveFeedback(logRecordId, feedbackText) {
  if (!logRecordId || !feedbackText) return;
  return airtableFetch(TABLES.logs, logRecordId, {
    method: "PATCH",
    body: JSON.stringify({ fields: { Feedback: feedbackText } }),
  });
}

// Finalize session at timeout
export async function finalizeSession({ logRecordId, fullTranscript, conceptsSurfaced, sessionStartTime }) {
  if (!logRecordId) return;

  const durationMinutes = sessionStartTime
    ? Math.round((Date.now() - new Date(sessionStartTime).getTime()) / 60000)
    : null;

  const fields = {
    Full_Transcript:          fullTranscript || "",
    Concepts_Surfaced:        Array.isArray(conceptsSurfaced)
      ? conceptsSurfaced.join(", ")
      : (conceptsSurfaced || ""),
  };
  if (durationMinutes !== null) fields.Session_Duration_Minutes = durationMinutes;

  return airtableFetch(TABLES.logs, logRecordId, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
}
