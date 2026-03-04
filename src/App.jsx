// ============================================================
// App.jsx
// ROLE: Root component. Owns the top-level session state and
// decides which screen to render (Login → Chat). Initializes
// Airtable session log on login and passes all state down.
// ============================================================

import { useState, useCallback, useRef } from "react";
import { LoginScreen }    from "./components/LoginScreen.jsx";
import { ChatContainer }  from "./components/ChatContainer.jsx";
import { findUserByEmail, createUser, createSessionLog } from "./AirtableService.js";
import { Theme }          from "./Theme.js";

// Generate a simple session ID
function makeSessionId() {
  return "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

// ── Initial session state shape ───────────────────────────────
const INITIAL_STATE = {
  screen:           "login",     // "login" | "chat"
  userRecordId:     null,        // Airtable rec ID — THE join key
  userEmail:        "",
  userName:         "",
  sessionId:        null,
  sessionStartTime: null,
  logRecordId:      null,        // Airtable Conversation_Logs rec ID
  languageUsed:     null,        // Set from first AI response meta
  messages:         [],          // [{ id, role, content, timestamp }]
  fullTranscript:   "",
  conceptsSurfaced: [],
  savedConcepts:    [],
  userFeedback:     "",          // Controlled input — Personal Card
  isLoading:        false,
  error:            null,
};

export default function App() {
  const [state, setState] = useState(INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state; // Always current for async callbacks

  // ── Login handler ─────────────────────────────────────────
  const handleLogin = useCallback(async (email) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      // Find or create user in Airtable
      let userRecord = await findUserByEmail(email);
      if (!userRecord) {
        userRecord = await createUser(email);
      }

      const sessionId = makeSessionId();

      // Create the Conversation_Logs row — returns logRecordId
      const logRecordId = await createSessionLog(
        userRecord.id,
        sessionId,
        "unknown" // language detected later from first AI response
      );

      setState((s) => ({
        ...s,
        screen:           "chat",
        userRecordId:     userRecord.id,
        userEmail:        email,
        userName:         userRecord.fields?.Username || email.split("@")[0],
        sessionId,
        sessionStartTime: new Date().toISOString(),
        logRecordId,
        isLoading:        false,
      }));
    } catch (err) {
      console.error("Login error:", err);
      setState((s) => ({
        ...s,
        isLoading: false,
        error: "login_failed",
      }));
    }
  }, []);

  // ── State updaters passed to children ────────────────────
  const updateState = useCallback((patch) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  // ── Styles ───────────────────────────────────────────────
  const appStyle = {
    minHeight:       "100vh",
    backgroundColor: Theme.colors.bg,
    fontFamily:      Theme.fonts.ui,
    color:           Theme.colors.textPrimary,
  };

  return (
    <div style={appStyle}>
      {state.screen === "login" && (
        <LoginScreen
          onLogin={handleLogin}
          isLoading={state.isLoading}
          error={state.error}
        />
      )}
      {state.screen === "chat" && (
        <ChatContainer
          sessionState={state}
          stateRef={stateRef}
          updateState={updateState}
        />
      )}
    </div>
  );
}
