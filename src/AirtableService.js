// ============================================================
// AirtableService.js
// ROLE: All Airtable API communication lives here.
// No component should call Airtable directly — always go
// through this service. Field names reference AIRTABLE_SCHEMA
// so a schema change only requires editing this one file.
// ============================================================

// ── Schema: edit field names here if Airtable columns change ──
export const AIRTABLE_SCHEMA = {
  tables: {
    USERS:             "Users",
    CONVERSATION_LOGS: "Conversation_Logs",
    RELATIONSHIP_LEXICON: "Relationship_Lexicon",
  },
  users: {
    USERNAME:            "Username",
    EMAIL:               "Email",
    GENERAL_NOTES:       "General_Notes",
    CREATED_AT:          "Created_At",
    LANGUAGE_PREFERENCE: "Language_Preference",
    SAVED_CONCEPTS:      "Saved_Concepts",
  },
  logs: {
    USER_LINK:               "User_Link",
    FULL_TRANSCRIPT:         "Full_Transcript",
    FEEDBACK:                "Feedback",
    SESSION_ID:              "Session_ID",
    CREATED_AT:              "Created_At",
    SESSION_DURATION_MINUTES:"Session_Duration_Minutes",
    LANGUAGE_USED:           "Language_Used",
    CONCEPTS_SURFACED:       "Concepts_Surfaced",
  },
  lexicon: {
    ENGLISH_TERM:   "English_Term",
    HEBREW_TERM:    "Hebrew_Term",
    DESCRIPTION_HE: "Description_HE",
    DESCRIPTION_EN: "Description_EN",
  },
};

// ── API config (values come from .env) ────────────────────────
const BASE_ID  = process.env.REACT_APP_AIRTABLE_BASE_ID;
const API_KEY  = process.env.REACT_APP_AIRTABLE_API_KEY;
const API_ROOT = "https://api.airtable.com/v0";

// ── In-session concept ID cache ───────────────────────────────
const _conceptCache = {};

// ── Low-level fetch wrapper ───────────────────────────────────
async function atFetch(endpoint, method = "GET", body = null) {
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_ROOT}/${BASE_ID}/${endpoint}`, opts);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Airtable [${res.status}]: ${JSON.stringify(err)}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// USER OPERATIONS
// ─────────────────────────────────────────────────────────────

// Find a user by email. Returns the full Airtable record or null.
export async function findUserByEmail(email) {
  const formula = encodeURIComponent(
    `{${AIRTABLE_SCHEMA.users.EMAIL}} = "${email}"`
  );
  const data = await atFetch(
    `${AIRTABLE_SCHEMA.tables.USERS}?filterByFormula=${formula}`
  );
  return data.records[0] ?? null;
}

// Create a new user record. Returns the new record (with its ID).
export async function createUser(email, username) {
  const { users } = AIRTABLE_SCHEMA;
  return atFetch(AIRTABLE_SCHEMA.tables.USERS, "POST", {
    fields: {
      [users.EMAIL]:      email,
      [users.USERNAME]:   username || email.split("@")[0],
      [users.CREATED_AT]: new Date().toISOString(),
    },
  });
}

// Update saved concepts on the user's Personal Card
export async function updateSavedConcepts(userRecordId, englishTerms) {
  const conceptIds = await lookupConceptIds(englishTerms);
  return atFetch(
    `${AIRTABLE_SCHEMA.tables.USERS}/${userRecordId}`,
    "PATCH",
    { fields: { [AIRTABLE_SCHEMA.users.SAVED_CONCEPTS]: conceptIds } }
  );
}

// ─────────────────────────────────────────────────────────────
// SESSION LOG OPERATIONS
// ─────────────────────────────────────────────────────────────

// Create a new Conversation_Logs record at session start.
// Returns the new record's Airtable ID — store as logRecordId.
export async function createSessionLog(userRecordId, sessionId, language) {
  const { logs } = AIRTABLE_SCHEMA;
  const data = await atFetch(
    AIRTABLE_SCHEMA.tables.CONVERSATION_LOGS,
    "POST",
    {
      fields: {
        [logs.USER_LINK]:      [userRecordId],
        [logs.SESSION_ID]:     sessionId,
        [logs.CREATED_AT]:     new Date().toISOString(),
        [logs.LANGUAGE_USED]:  language,
        [logs.FULL_TRANSCRIPT]:"",
        [logs.FEEDBACK]:       "",
      },
    }
  );
  return data.id;
}

// Incremental sync — called after every AI response.
// Always pass userFeedback directly from React state (never stale).
export async function syncSession({
  logRecordId,
  fullTranscript,
  userFeedback,
  conceptsSurfaced,
}) {
  if (!logRecordId) return;
  const { logs } = AIRTABLE_SCHEMA;
  const conceptIds = await lookupConceptIds(conceptsSurfaced || []);
  return atFetch(
    `${AIRTABLE_SCHEMA.tables.CONVERSATION_LOGS}/${logRecordId}`,
    "PATCH",
    {
      fields: {
        [logs.FULL_TRANSCRIPT]:  fullTranscript,
        [logs.FEEDBACK]:         userFeedback,
        [logs.CONCEPTS_SURFACED]:conceptIds,
      },
    }
  );
}

// Final sync at session end — adds duration.
export async function finalizeSession({
  logRecordId,
  fullTranscript,
  userFeedback,
  sessionStartTime,
  conceptsSurfaced,
}) {
  if (!logRecordId) return;
  const { logs } = AIRTABLE_SCHEMA;
  const duration = Math.round(
    (Date.now() - new Date(sessionStartTime).getTime()) / 60000
  );
  const conceptIds = await lookupConceptIds(conceptsSurfaced || []);
  return atFetch(
    `${AIRTABLE_SCHEMA.tables.CONVERSATION_LOGS}/${logRecordId}`,
    "PATCH",
    {
      fields: {
        [logs.FULL_TRANSCRIPT]:            fullTranscript,
        [logs.FEEDBACK]:                   userFeedback,
        [logs.SESSION_DURATION_MINUTES]:   duration,
        [logs.CONCEPTS_SURFACED]:          conceptIds,
      },
    }
  );
}

// ─────────────────────────────────────────────────────────────
// LEXICON OPERATIONS
// ─────────────────────────────────────────────────────────────

// Fetch a single concept by English_Term for tooltip display
export async function fetchConcept(englishTerm, language = "he") {
  const ids = await lookupConceptIds([englishTerm]);
  if (!ids.length) return null;
  const data = await atFetch(
    `${AIRTABLE_SCHEMA.tables.RELATIONSHIP_LEXICON}/${ids[0]}`
  );
  const { fields } = data;
  return {
    id:          ids[0],
    englishTerm: fields[AIRTABLE_SCHEMA.lexicon.ENGLISH_TERM],
    hebrewTerm:  fields[AIRTABLE_SCHEMA.lexicon.HEBREW_TERM],
    description: language === "he"
      ? fields[AIRTABLE_SCHEMA.lexicon.DESCRIPTION_HE]
      : fields[AIRTABLE_SCHEMA.lexicon.DESCRIPTION_EN],
  };
}

// Resolve English_Term strings → Airtable Record IDs
// Cached per session to avoid redundant API calls
export async function lookupConceptIds(englishTerms) {
  if (!englishTerms?.length) return [];
  const uncached = englishTerms.filter((t) => !_conceptCache[t]);
  if (uncached.length) {
    const formula =
      uncached.length === 1
        ? `{${AIRTABLE_SCHEMA.lexicon.ENGLISH_TERM}} = "${uncached[0]}"`
        : `OR(${uncached
            .map((t) => `{${AIRTABLE_SCHEMA.lexicon.ENGLISH_TERM}} = "${t}"`)
            .join(",")})`;
    const data = await atFetch(
      `${AIRTABLE_SCHEMA.tables.RELATIONSHIP_LEXICON}?filterByFormula=${encodeURIComponent(formula)}`
    );
    data.records.forEach((r) => {
      _conceptCache[r.fields[AIRTABLE_SCHEMA.lexicon.ENGLISH_TERM]] = r.id;
    });
  }
  return englishTerms.map((t) => _conceptCache[t]).filter(Boolean);
}
