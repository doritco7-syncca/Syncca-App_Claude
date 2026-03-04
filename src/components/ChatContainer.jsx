// ============================================================
// components/ChatContainer.jsx
// ROLE: The main chat screen. Owns message sending logic,
// session timer, Airtable incremental sync, and renders the
// chat header, message list, input bar, and Personal Card panel.
// Reads session state from App.jsx via props.
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageBubble }  from "./MessageBubble.jsx";
import { PersonalCard }   from "./PersonalCard.jsx";
import { SessionTimer }   from "./SessionTimer.jsx";
import { sendToSyncca, parseResponse } from "../SynccaService.js";
import { syncSession, finalizeSession, updateSavedConcepts } from "../AirtableService.js";
import { Theme }          from "../Theme.js";
import { t, UI_STRINGS }  from "../UI_STRINGS.js";

const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export function ChatContainer({ sessionState, stateRef, updateState }) {
  const [inputText,      setInputText]      = useState("");
  const [isTyping,       setIsTyping]       = useState(false);
  const [cardOpen,       setCardOpen]       = useState(false);
  const [activeTooltip,  setActiveTooltip]  = useState(null); // concept name
  const messagesEndRef = useRef(null);

  // ── Auto-scroll to latest message ─────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessionState.messages]);

  // ── Session end on timer expiry ───────────────────────────
  const handleSessionEnd = useCallback(async () => {
    const s = stateRef.current;
    await finalizeSession({
      logRecordId:      s.logRecordId,
      fullTranscript:   s.fullTranscript,
      userFeedback:     s.userFeedback,
      sessionStartTime: s.sessionStartTime,
      conceptsSurfaced: s.conceptsSurfaced,
    });
    await updateSavedConcepts(s.userRecordId, s.savedConcepts);
  }, [stateRef]);

  // ── Send a message ────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isTyping) return;
    setInputText("");
    setIsTyping(true);

    const s = stateRef.current;

    // Add user message to UI
    const userMsg = {
      id:        Date.now(),
      role:      "user",
      content:   text,
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...s.messages, userMsg];
    const updatedTranscript = s.fullTranscript +
      `\n[User]: ${text}`;

    updateState({ messages: updatedMessages, fullTranscript: updatedTranscript });

    try {
      // Build history for API (role/content pairs only)
      const apiMessages = updatedMessages.map((m) => ({
        role:    m.role,
        content: m.content,
      }));

      // Calculate elapsed minutes for timer check
      const elapsed = Math.floor(
        (Date.now() - new Date(s.sessionStartTime).getTime()) / 60000
      );

      const rawResponse = await sendToSyncca(apiMessages, elapsed);
      const { visibleText, meta } = parseResponse(rawResponse);

      // Syncca's reply message
      const synccaMsg = {
        id:        Date.now() + 1,
        role:      "assistant",
        content:   visibleText,
        timestamp: new Date().toISOString(),
        meta,
      };

      const newMessages    = [...updatedMessages, synccaMsg];
      const newTranscript  = updatedTranscript + `\n[Syncca]: ${visibleText}`;
      const newConcepts    = [
        ...new Set([
          ...s.conceptsSurfaced,
          ...(meta?.concepts_surfaced || []),
        ]),
      ];
      const detectedLang   = meta?.language || s.languageUsed || "Hebrew";

      updateState({
        messages:         newMessages,
        fullTranscript:   newTranscript,
        conceptsSurfaced: newConcepts,
        languageUsed:     detectedLang,
      });

      // Incremental Airtable sync — always uses latest feedback from stateRef
      await syncSession({
        logRecordId:      s.logRecordId,
        fullTranscript:   newTranscript,
        userFeedback:     stateRef.current.userFeedback, // always latest
        conceptsSurfaced: newConcepts,
      });

    } catch (err) {
      console.error("Send error:", err);
      updateState({ error: "api_error" });
    } finally {
      setIsTyping(false);
    }
  }, [inputText, isTyping, stateRef, updateState]);

  // ── Save concept to Personal Card ─────────────────────────
  const handleSaveConcept = useCallback((conceptName) => {
    const s = stateRef.current;
    if (s.savedConcepts.includes(conceptName)) return;
    updateState({ savedConcepts: [...s.savedConcepts, conceptName] });
  }, [stateRef, updateState]);

  // ── Feedback controlled input ────────────────────────────
  const handleFeedbackChange = useCallback((value) => {
    updateState({ userFeedback: value });
  }, [updateState]);

  const minutesElapsed = sessionState.sessionStartTime
    ? Math.floor((Date.now() - new Date(sessionState.sessionStartTime)) / 60000)
    : 0;

  return (
    <div style={styles.root}>
      {/* ── Header ─────────────────────────────────────────── */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <SessionTimer
            startTime={sessionState.sessionStartTime}
            durationMs={SESSION_DURATION_MS}
            onEnd={handleSessionEnd}
          />
        </div>

        <div style={styles.headerCenter}>
          <span style={styles.logoText}>Syncca</span>
          <span style={styles.tagline}>
            {t(UI_STRINGS.app.tagline)}
          </span>
        </div>

        <div style={styles.headerRight}>
          {/* Concept / insight counters */}
          <CounterPill
            label={t(UI_STRINGS.chat.syncsLabel)}
            value={sessionState.messages.filter((m) => m.role === "user").length}
          />
          <CounterPill
            label={t(UI_STRINGS.chat.insightsLabel)}
            value={sessionState.savedConcepts.length}
          />
          {/* Personal Card toggle */}
          <button
            style={styles.cardToggle}
            onClick={() => setCardOpen((v) => !v)}
            aria-label={t(UI_STRINGS.a11y.openPersonalCard)}
          >
            <CardIcon />
          </button>
        </div>
      </header>

      {/* ── Main area ──────────────────────────────────────── */}
      <div style={styles.main}>
        {/* Message list */}
        <div style={styles.messageList}>
          {sessionState.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              language={sessionState.languageUsed}
              activeTooltip={activeTooltip}
              onTooltipOpen={setActiveTooltip}
              onTooltipClose={() => setActiveTooltip(null)}
              onSaveConcept={handleSaveConcept}
              savedConcepts={sessionState.savedConcepts}
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div style={styles.inputBar}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t(UI_STRINGS.chat.inputPlaceholder)}
            style={styles.input}
            rows={1}
            dir="auto"
            aria-label={t(UI_STRINGS.chat.inputPlaceholder)}
          />
          <button
            style={{
              ...styles.sendBtn,
              opacity: inputText.trim() ? 1 : 0.4,
            }}
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            aria-label={t(UI_STRINGS.chat.sendAriaLabel)}
          >
            <SendIcon />
          </button>
        </div>
      </div>

      {/* ── Personal Card panel ────────────────────────────── */}
      <PersonalCard
        isOpen={cardOpen}
        onClose={() => setCardOpen(false)}
        userName={sessionState.userName}
        userEmail={sessionState.userEmail}
        savedConcepts={sessionState.savedConcepts}
        userFeedback={sessionState.userFeedback}
        onFeedbackChange={handleFeedbackChange}
        language={sessionState.languageUsed}
        logRecordId={sessionState.logRecordId}
        stateRef={stateRef}
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function CounterPill({ label, value }) {
  return (
    <div style={counterStyles.pill}>
      <span style={counterStyles.value}>{value}</span>
      <span style={counterStyles.label}>{label}</span>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={typingStyles.row}>
      <div style={typingStyles.bubble}>
        <span style={typingStyles.dot} />
        <span style={{ ...typingStyles.dot, animationDelay: "0.2s" }} />
        <span style={{ ...typingStyles.dot, animationDelay: "0.4s" }} />
      </div>
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 3L10 17M10 3L5 8M10 3L15 8"
        stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="3" width="16" height="16" rx="3"
        stroke={Theme.colors.textSecondary} strokeWidth="1.5"/>
      <line x1="7" y1="8" x2="15" y2="8"
        stroke={Theme.colors.textSecondary} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7" y1="11" x2="15" y2="11"
        stroke={Theme.colors.textSecondary} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7" y1="14" x2="11" y2="14"
        stroke={Theme.colors.textSecondary} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = {
  root: {
    display:        "flex",
    flexDirection:  "column",
    height:         "100vh",
    backgroundColor:Theme.colors.bg,
    position:       "relative",
    overflow:       "hidden",
  },
  header: {
    height:          Theme.layout.headerHeight,
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "space-between",
    padding:         `0 ${Theme.spacing.lg}`,
    backgroundColor: Theme.colors.bgCard,
    borderBottom:    `1px solid ${Theme.colors.border}`,
    flexShrink:      0,
    zIndex:          10,
  },
  headerLeft:   { display: "flex", alignItems: "center", minWidth: 80 },
  headerCenter: {
    display:       "flex",
    flexDirection: "column",
    alignItems:    "center",
  },
  headerRight: {
    display:    "flex",
    alignItems: "center",
    gap:        Theme.spacing.sm,
    minWidth:   80,
    justifyContent: "flex-end",
  },
  logoText: {
    fontFamily:   Theme.fonts.display,
    fontSize:     Theme.fontSizes.lg,
    fontWeight:   Theme.fontWeights.bold,
    color:        Theme.colors.accent,
    lineHeight:   1,
  },
  tagline: {
    fontFamily: Theme.fonts.ui,
    fontSize:   Theme.fontSizes.xs,
    color:      Theme.colors.textMuted,
    letterSpacing: "0.08em",
  },
  cardToggle: {
    background:   "none",
    border:       "none",
    cursor:       "pointer",
    padding:      "6px",
    borderRadius: Theme.radius.sm,
    display:      "flex",
    alignItems:   "center",
  },
  main: {
    flex:           1,
    display:        "flex",
    flexDirection:  "column",
    overflow:       "hidden",
    alignItems:     "center",
  },
  messageList: {
    flex:       1,
    overflowY:  "auto",
    padding:    `${Theme.spacing.lg} ${Theme.spacing.md}`,
    width:      "100%",
    maxWidth:   Theme.layout.chatMaxWidth,
    boxSizing:  "border-box",
    display:    "flex",
    flexDirection: "column",
    gap:        Theme.spacing.md,
  },
  inputBar: {
    display:         "flex",
    alignItems:      "flex-end",
    gap:             Theme.spacing.sm,
    padding:         `${Theme.spacing.sm} ${Theme.spacing.md}`,
    backgroundColor: Theme.colors.bgCard,
    borderTop:       `1px solid ${Theme.colors.border}`,
    width:           "100%",
    maxWidth:        Theme.layout.chatMaxWidth,
    boxSizing:       "border-box",
    marginBottom:    Theme.spacing.sm,
  },
  input: {
    flex:         1,
    padding:      "12px 16px",
    borderRadius: Theme.radius.pill,
    border:       `1.5px solid ${Theme.colors.border}`,
    fontSize:     Theme.fontSizes.md,
    fontFamily:   Theme.fonts.ui,
    color:        Theme.colors.textPrimary,
    backgroundColor: Theme.colors.bg,
    outline:      "none",
    resize:       "none",
    lineHeight:   Theme.lineHeights.normal,
    maxHeight:    "120px",
    overflowY:    "auto",
  },
  sendBtn: {
    width:           "44px",
    height:          "44px",
    borderRadius:    Theme.radius.circle,
    backgroundColor: Theme.colors.accent,
    border:          "none",
    cursor:          "pointer",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    flexShrink:      0,
    transition:      Theme.transitions.fast,
  },
};

const counterStyles = {
  pill: {
    display:         "flex",
    flexDirection:   "column",
    alignItems:      "center",
    backgroundColor: Theme.colors.bg,
    borderRadius:    Theme.radius.sm,
    padding:         "3px 8px",
    minWidth:        "36px",
  },
  value: {
    fontFamily:  Theme.fonts.ui,
    fontSize:    Theme.fontSizes.base,
    fontWeight:  Theme.fontWeights.bold,
    color:       Theme.colors.textPrimary,
    lineHeight:  1,
  },
  label: {
    fontFamily: Theme.fonts.ui,
    fontSize:   Theme.fontSizes.xs,
    color:      Theme.colors.textMuted,
    lineHeight: 1,
  },
};

const typingStyles = {
  row: {
    display:    "flex",
    alignItems: "flex-end",
    gap:        Theme.spacing.sm,
  },
  bubble: {
    display:         "flex",
    gap:             "5px",
    alignItems:      "center",
    backgroundColor: Theme.colors.bubbleSyncca,
    border:          `1px solid ${Theme.colors.bubbleBorder}`,
    borderRadius:    Theme.radius.bubbleIn,
    padding:         "12px 16px",
    boxShadow:       Theme.shadows.bubble,
  },
  dot: {
    display:         "inline-block",
    width:           "7px",
    height:          "7px",
    borderRadius:    "50%",
    backgroundColor: Theme.colors.textMuted,
    animation:       "dotBounce 1.2s ease-in-out infinite",
  },
};
