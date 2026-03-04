// ============================================================
// components/ChatContainer.jsx
// ROLE: Main chat screen.
// Visual: Lavender outer frame fills the viewport. The stone
// chat container sits centered on it, rounded (28px) with a
// soft warm shadow — it "rests" on the lavender. The header
// is transparent and floats on lavender. The input bar is
// part of the stone surface.
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageBubble }  from "./MessageBubble.jsx";
import { PersonalCard }   from "./PersonalCard.jsx";
import { SessionTimer }   from "./SessionTimer.jsx";
import { sendToSyncca, parseResponse } from "../SynccaService.js";
import { syncSession, finalizeSession, updateSavedConcepts } from "../AirtableService.js";
import { Theme }          from "../Theme.js";
import { t, UI_STRINGS }  from "../UI_STRINGS.js";

const SESSION_DURATION_MS = 30 * 60 * 1000;

export function ChatContainer({ sessionState, stateRef, updateState }) {
  const [inputText,     setInputText]     = useState("");
  const [isTyping,      setIsTyping]      = useState(false);
  const [cardOpen,      setCardOpen]      = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessionState.messages]);

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

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isTyping) return;
    setInputText("");
    setIsTyping(true);

    const s = stateRef.current;
    const userMsg = {
      id:        Date.now(),
      role:      "user",
      content:   text,
      timestamp: new Date().toISOString(),
    };
    const updatedMessages   = [...s.messages, userMsg];
    const updatedTranscript = s.fullTranscript + `\n[User]: ${text}`;
    updateState({ messages: updatedMessages, fullTranscript: updatedTranscript });

    try {
      const apiMessages = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
      const elapsed     = Math.floor((Date.now() - new Date(s.sessionStartTime).getTime()) / 60000);
      const rawResponse = await sendToSyncca(apiMessages, elapsed);
      const { visibleText, meta } = parseResponse(rawResponse);

      const synccaMsg = {
        id:        Date.now() + 1,
        role:      "assistant",
        content:   visibleText,
        timestamp: new Date().toISOString(),
        meta,
      };
      const newMessages   = [...updatedMessages, synccaMsg];
      const newTranscript = updatedTranscript + `\n[Syncca]: ${visibleText}`;
      const newConcepts   = [...new Set([...s.conceptsSurfaced, ...(meta?.concepts_surfaced || [])])];

      updateState({
        messages:         newMessages,
        fullTranscript:   newTranscript,
        conceptsSurfaced: newConcepts,
        languageUsed:     meta?.language || s.languageUsed || "Hebrew",
      });

      await syncSession({
        logRecordId:      s.logRecordId,
        fullTranscript:   newTranscript,
        userFeedback:     stateRef.current.userFeedback,
        conceptsSurfaced: newConcepts,
      });
    } catch (err) {
      console.error("Send error:", err);
      updateState({ error: "api_error" });
    } finally {
      setIsTyping(false);
    }
  }, [inputText, isTyping, stateRef, updateState]);

  const handleSaveConcept = useCallback((name) => {
    const s = stateRef.current;
    if (!s.savedConcepts.includes(name))
      updateState({ savedConcepts: [...s.savedConcepts, name] });
  }, [stateRef, updateState]);

  const handleFeedbackChange = useCallback((val) => {
    updateState({ userFeedback: val });
  }, [updateState]);

  return (
    // ── Lavender outer frame ──────────────────────────────
    <div style={styles.frame}>

      {/* Header floats on lavender — transparent, no box */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <SessionTimer
            startTime={sessionState.sessionStartTime}
            durationMs={SESSION_DURATION_MS}
            onEnd={handleSessionEnd}
          />
        </div>

        <div style={styles.headerCenter}>
          <div style={styles.logoRow}>
            <SynccaLogoMark size={30} />
            <div style={styles.logoTextGroup}>
              <span style={styles.logoWord}>Syncca</span>
              <span style={styles.tagline}>{t(UI_STRINGS.app.tagline)}</span>
            </div>
          </div>
        </div>

        <div style={styles.headerRight}>
          <CounterPill label={t(UI_STRINGS.chat.syncsLabel)}
            value={sessionState.messages.filter(m => m.role === "user").length} />
          <CounterPill label={t(UI_STRINGS.chat.insightsLabel)}
            value={sessionState.savedConcepts.length} />
          <button style={styles.cardToggle}
            onClick={() => setCardOpen(v => !v)}
            aria-label={t(UI_STRINGS.a11y.openPersonalCard)}>
            <CardIcon />
          </button>
        </div>
      </header>

      {/* Stone chat container — rests on lavender */}
      <div style={styles.chatContainer}>

        {/* Message list — scrollable stone surface */}
        <div style={styles.messageList}>
          {sessionState.messages.map(msg => (
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

        {/* Input bar — bottom of stone container, no border, same surface */}
        <div style={styles.inputBar}>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder={t(UI_STRINGS.chat.inputPlaceholder)}
            style={styles.input}
            rows={1}
            dir="auto"
          />
          <button
            style={{ ...styles.sendBtn, opacity: inputText.trim() ? 1 : 0.35 }}
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            aria-label={t(UI_STRINGS.chat.sendAriaLabel)}
          >
            <SendIcon />
          </button>
        </div>
      </div>

      {/* Personal Card */}
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
          40%            { transform: translateY(-5px); opacity: 1; }
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
        stroke={Theme.colors.textOnLavender} strokeWidth="1.5" opacity="0.7"/>
      <line x1="7" y1="8"  x2="15" y2="8"
        stroke={Theme.colors.textOnLavender} strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
      <line x1="7" y1="11" x2="15" y2="11"
        stroke={Theme.colors.textOnLavender} strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
      <line x1="7" y1="14" x2="11" y2="14"
        stroke={Theme.colors.textOnLavender} strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
    </svg>
  );
}


// ── SynccaLogoMark (same as LoginScreen) ─────────────────────
function SynccaLogoMark({ size = 32 }) {
  const s = size;
  const cx = s / 2, cy = s / 2, r = s * 0.38;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" aria-hidden="true">
      <path
        d={`M ${cx} ${cy - r} A ${r} ${r} 0 1 0 ${cx + r * 0.85} ${cy - r * 0.53}`}
        stroke={Theme.colors.accent}
        strokeWidth={s * 0.065}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M ${cx} ${cy - r * 0.55} A ${r * 0.55} ${r * 0.55} 0 0 1 ${cx + r * 0.55} ${cy}`}
        stroke={Theme.colors.accent}
        strokeWidth={s * 0.055}
        strokeLinecap="round"
        fill="none"
        opacity="0.42"
      />
    </svg>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = {

  // Lavender fills the entire viewport
  frame: {
    height:          "100vh",
    display:         "flex",
    flexDirection:   "column",
    alignItems:      "center",
    backgroundColor: Theme.colors.bgOuter,
    padding:         `0 ${Theme.layout.chatContainerInset} ${Theme.layout.chatContainerInset}`,
    boxSizing:       "border-box",
    position:        "relative",
    overflow:        "hidden",
  },

  // Header: transparent, floats on lavender
  header: {
    height:         Theme.layout.headerHeight,
    width:          "100%",
    maxWidth:       Theme.layout.chatMaxWidth,
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    flexShrink:     0,
    zIndex:         10,
    // No backgroundColor, no border, no box
  },
  headerLeft:   { display: "flex", alignItems: "center", minWidth: 80 },
  headerCenter: { display: "flex", flexDirection: "column", alignItems: "center" },
  headerRight:  { display: "flex", alignItems: "center", gap: Theme.spacing.sm, minWidth: 80, justifyContent: "flex-end" },

  logoRow: {
    display:    "flex",
    alignItems: "center",
    gap:        "10px",
  },
  logoTextGroup: {
    display:       "flex",
    flexDirection: "column",
    gap:           "2px",
  },
  logoWord: {
    fontFamily:    Theme.logo.fontFamily,
    fontSize:      "22px",
    fontWeight:    700,
    color:         Theme.logo.color,
    letterSpacing: Theme.logo.letterSpacing,
    lineHeight:    1,
    display:       "block",
  },
  tagline: {
    fontFamily:    Theme.fonts.body,
    fontSize:      Theme.fontSizes.xs,
    fontStyle:     "italic",
    color:         Theme.colors.textOnLavender,
    opacity:       0.75,
    lineHeight:    1,
    display:       "block",
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

  // Stone container: rounded, resting shadow, all chat content inside
  chatContainer: {
    flex:            1,
    display:         "flex",
    flexDirection:   "column",
    width:           "100%",
    maxWidth:        Theme.layout.chatMaxWidth,
    backgroundColor: Theme.colors.bgSurface,
    borderRadius:    Theme.radius.lg,
    boxShadow:       Theme.shadows.container,
    overflow:        "hidden",
  },

  messageList: {
    flex:          1,
    overflowY:     "auto",
    padding:       `${Theme.spacing.lg} ${Theme.spacing.lg}`,
    display:       "flex",
    flexDirection: "column",
    gap:           Theme.spacing.md,
  },

  // Input bar: no top border — it's the same stone surface
  inputBar: {
    display:      "flex",
    alignItems:   "flex-end",
    gap:          Theme.spacing.sm,
    padding:      `${Theme.spacing.sm} ${Theme.spacing.md} ${Theme.spacing.md}`,
    borderTop:    `1px solid ${Theme.colors.border}`,
    flexShrink:   0,
  },
  input: {
    flex:            1,
    padding:         "12px 16px",
    borderRadius:    Theme.radius.pill,
    border:          `1.5px solid ${Theme.colors.border}`,
    fontSize:        Theme.fontSizes.md,
    fontFamily:      Theme.fonts.ui,
    color:           Theme.colors.textPrimary,
    backgroundColor: Theme.colors.bgSurfaceDeep,
    outline:         "none",
    resize:          "none",
    lineHeight:      Theme.lineHeights.normal,
    maxHeight:       "120px",
    overflowY:       "auto",
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
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    backgroundColor:"rgba(255,255,255,0.25)",
    borderRadius:   Theme.radius.sm,
    padding:        "3px 8px",
    minWidth:       "36px",
  },
  value: {
    fontFamily:  Theme.fonts.ui,
    fontSize:    Theme.fontSizes.base,
    fontWeight:  Theme.fontWeights.bold,
    color:       Theme.colors.textOnLavender,
    lineHeight:  1,
  },
  label: {
    fontFamily: Theme.fonts.ui,
    fontSize:   Theme.fontSizes.xs,
    color:      Theme.colors.textOnLavender,
    lineHeight: 1,
    opacity:    0.7,
  },
};

const typingStyles = {
  row:    { display: "flex", alignItems: "flex-end", gap: Theme.spacing.sm },
  bubble: {
    display:         "flex",
    gap:             "5px",
    alignItems:      "center",
    backgroundColor: Theme.colors.bgBubbleSyncca,
    border:          `1px solid ${Theme.colors.border}`,
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
