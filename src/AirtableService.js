// AirtableService.js
// Single source of truth for ALL Airtable API calls in Syncca.
// Uses REACT_APP_ env vars (Create React App convention).

const TOKEN   = process.env.REACT_APP_AIRTABLE_TOKEN;
const BASE_ID = process.env.REACT_APP_AIRTABLE_BASE_ID;
const TABLE   = "Users";

// ─── Shared fetch wrapper ─────────────────────────────────────────
async function airtableFetch(path, options = {}) {
  if (!TOKEN || !BASE_ID) {
    throw new Error(
      `Airtable env vars missing. TOKEN: ${!!TOKEN}, BASE_ID: ${!!BASE_ID}`
    );
  }

  const url = `https://api.airtable.com/v0/${BASE_ID}/${path}`;
  const res  = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error?.message || data?.error?.type || `HTTP ${res.status}`;
    throw new Error(`Airtable error (${res.status}): ${msg}`);
  }

  return data;
}

// ─── Find user by email ───────────────────────────────────────────
export async function findUserByEmail(email) {
  const formula = `LOWER({Email})="${email.toLowerCase()}"`;
  const data = await airtableFetch(
    `${TABLE}?filterByFormula=${encodeURIComponent(formula)}`
  );

  if (data.records && data.records.length > 0) {
    return {
      recordId: data.records[0].id,
      fields:   data.records[0].fields,
      isNew:    false,
    };
  }
  return null;
}

// ─── Create new user ─────────────────────────────────────────────
export async function createUser(email) {
  const data = await airtableFetch(TABLE, {
    method: "POST",
    body: JSON.stringify({
      fields: {
        Email:      email,
        Sync_Count: 0,
      },
    }),
  });

  return {
    recordId: data.id,
    fields:   data.fields,
    isNew:    true,
  };
}

// ─── Find or create user (main login entry point) ─────────────────
export async function findOrCreateUser(email) {
  const existing = await findUserByEmail(email);
  if (existing) return existing;
  return createUser(email);
}

// ─── Increment Sync_Count ────────────────────────────────────────
// Called once per session start. Sync_Count is internal — never shown to user.
export async function incrementSyncCount(recordId, currentCount) {
  const newCount = (currentCount || 0) + 1;
  await airtableFetch(`${TABLE}/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({
      fields: { Sync_Count: newCount },
    }),
  });
  return newCount;
}

// ─── Update user profile fields ───────────────────────────────────
// Called from PersonalCard "Save" button.
export async function updateUserProfile(recordId, fields) {
  const allowed = [
    "First_Name",
    "Full_Name",
    "Age_Range",
    "Marital_Status",
    "Gender",
    "Language_Preference",
  ];

  // Only send allowed fields to avoid accidental overwrites
  const safeFields = Object.fromEntries(
    Object.entries(fields).filter(([k]) => allowed.includes(k))
  );

  return airtableFetch(`${TABLE}/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: safeFields }),
  });
}

// ─── Save concept to user record ─────────────────────────────────
export async function saveConceptToUser(recordId, conceptWord, existingSaved = "") {
  const updated = existingSaved
    ? `${existingSaved}, ${conceptWord}`
    : conceptWord;

  return airtableFetch(`${TABLE}/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({
      fields: { Saved_Concepts: updated },
    }),
  });
}

// ─── Save feedback (Timeout modal) ───────────────────────────────
export async function saveFeedback(recordId, feedbackText) {
  return airtableFetch(`Feedbacks`, {
    method: "POST",
    body: JSON.stringify({
      fields: {
        Feedback_Text: feedbackText,
        User:          [recordId], // linked record
        Created_At:    new Date().toISOString(),
      },
    }),
  });
}
