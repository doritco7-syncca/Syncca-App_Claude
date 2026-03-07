// AirtableService.js
// Single source of truth for ALL Airtable API calls in Syncca.
// Table: Users + Conversation_Logs
// Field names match Airtable exactly — do not rename without updating here.

const TOKEN   = process.env.REACT_APP_AIRTABLE_TOKEN;
const BASE_ID = process.env.REACT_APP_AIRTABLE_BASE_ID;

const TABLES = {
  users: "Users",
  logs:  "Conversation_Logs",
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

  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type":  "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json();

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
export async function updateUserProfile(recordId, fields) {
  const allowed = [
    "First_Name", "Full_Name", "Age_Range",
    "Marital_Status", "Gender", "Language_Preference",
  ];
  // Select fields must not be sent as empty string — Airtable throws 422
  const selectFields = ["Age_Range", "Marital_Status", "Gender"];

  const safeFields = Object.fromEntries(
    Object.entries(fields).filter(([k, v]) => {
      if (!allowed.includes(k)) return false;
      if (selectFields.includes(k) && !v) return false;
      return true;
    })
  );
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
// Columns: Session_Id, Created_At, User_Link, Full_Transcript,
//          Concepts_Surfaced, Feedback, Session_Duration_Minutes,
//          Language_Used
// ═══════════════════════════════════════════════════

// Create a new log record at session start — returns logRecordId
export async function createSessionLog(userRecordId, userEmail) {
  const data = await airtableFetch(TABLES.logs, "", {
    method: "POST",
    body: JSON.stringify({
      fields: {
        // User_Link is a linked record field → array of record IDs
        User_Link:        userRecordId ? [userRecordId] : undefined,
        Created_At:       new Date().toISOString(),
        Full_Transcript:  "",
        Concepts_Surfaced: "",
        Feedback:         "",
        Language_Used:    "Hebrew",
      },
    }),
  });
  return data.id;
}

// Sync session state mid-conversation (called after each exchange)
export async function syncSession({ logRecordId, fullTranscript, conceptsSurfaced, userFeedback, languageUsed }) {
  if (!logRecordId) return;

  const fields = {};
  if (fullTranscript   !== undefined) fields.Full_Transcript    = fullTranscript;
  if (conceptsSurfaced !== undefined) fields.Concepts_Surfaced  = Array.isArray(conceptsSurfaced)
    ? conceptsSurfaced.join(", ")
    : conceptsSurfaced;
  if (userFeedback  !== undefined) fields.Feedback       = userFeedback;
  if (languageUsed  !== undefined) fields.Language_Used  = languageUsed;

  if (Object.keys(fields).length === 0) return;

  return airtableFetch(TABLES.logs, logRecordId, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
}

// Finalize session at timeout or close
export async function finalizeSession({ logRecordId, fullTranscript, userFeedback, conceptsSurfaced, sessionStartTime }) {
  if (!logRecordId) return;

  // Calculate session duration in minutes
  const durationMinutes = sessionStartTime
    ? Math.round((Date.now() - new Date(sessionStartTime).getTime()) / 60000)
    : null;

  return airtableFetch(TABLES.logs, logRecordId, {
    method: "PATCH",
    body: JSON.stringify({
      fields: {
        Full_Transcript:        fullTranscript  || "",
        Feedback:               userFeedback    || "",
        Concepts_Surfaced:      Array.isArray(conceptsSurfaced)
          ? conceptsSurfaced.join(", ")
          : (conceptsSurfaced || ""),
        Session_Duration_Minutes: durationMinutes,
      },
    }),
  });
}

// Save feedback from timeout modal
export async function saveFeedback(logRecordId, feedbackText) {
  if (!logRecordId) return;
  return airtableFetch(TABLES.logs, logRecordId, {
    method: "PATCH",
    body: JSON.stringify({ fields: { Feedback: feedbackText } }),
  });
}
