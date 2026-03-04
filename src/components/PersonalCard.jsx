// ============================================================
// components/PersonalCard.jsx
// ROLE: The user's Personal Card — a slide-in side panel showing
// their email, saved concepts, and the feedback textarea.
// The feedback field is a CONTROLLED INPUT (per Master Prompt
// critical requirement) — every keystroke updates App state
// so syncSession() always receives the latest value.
// ============================================================

import { useState } from "react";
import { Theme }         from "../Theme.js";
import { t, UI_STRINGS } from "../UI_STRINGS.js";
import { syncSession }   from "../AirtableService.js";

export function PersonalCard({
  isOpen,
  onClose,
  userName,
  userEmail,
  savedConcepts,
  userFeedback,
  onFeedbackChange,
  language,
  logRecordId,
  stateRef,
}) {
  const [syncStatus, setSyncStatus] = useState(null); // null | "saving" | "saved" | "error"

  // Save feedback manually (also happens automatically in ChatContainer sync)
  async function handleFeedbackBlur() {
    if (!logRecordId || !userFeedback) return;
    setSyncStatus("saving");
    try {
      const s = stateRef.current;
      await syncSession({
        logRecordId,
        fullTranscript:   s.fullTranscript,
        userFeedback:     userFeedback,  // always from controlled state
        conceptsSurfaced: s.conceptsSurfaced,
      });
      setSyncStatus("saved");
      setTimeout(() => setSyncStatus(null), 2000);
    } catch {
      setSyncStatus("error");
    }
  }

  const lang = language === "Hebrew" ? "he" : "en";

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          style={styles.backdrop}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        style={{
          ...styles.panel,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
        aria-label={t(UI_STRINGS.a11y.openPersonalCard)}
        role="complementary"
      >
        {/* Header */}
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>
            {t(UI_STRINGS.personalCard.title)}
          </h2>
          <button
            style={styles.closeBtn}
            onClick={onClose}
            aria-label={t(UI_STRINGS.a11y.closePersonalCard)}
          >
            ✕
          </button>
        </div>

        {/* User identity */}
        <div style={styles.identityBlock}>
          <div style={styles.avatarLarge}>
            {userName?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <p style={styles.userName}>{userName}</p>
            <p style={styles.userEmail}>{userEmail}</p>
          </div>
        </div>

        <div style={styles.divider} />

        {/* Saved Concepts */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            {t(UI_STRINGS.personalCard.savedConceptsTitle)}
          </h3>
          {savedConcepts.length === 0 ? (
            <p style={styles.emptyNote}>
              {t(UI_STRINGS.personalCard.noConceptsYet)}
            </p>
          ) : (
            <div style={styles.conceptsList}>
              {savedConcepts.map((concept) => (
                <ConceptChip key={concept} name={concept} lang={lang} />
              ))}
            </div>
          )}
        </div>

        <div style={styles.divider} />

        {/* Feedback — CONTROLLED INPUT */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            {t(UI_STRINGS.personalCard.feedbackTitle)}
          </h3>
          <textarea
            value={userFeedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            onBlur={handleFeedbackBlur}
            placeholder={t(UI_STRINGS.personalCard.feedbackPlaceholder)}
            style={styles.feedbackTextarea}
            rows={4}
            dir="auto"
          />
          {/* Sync status indicator */}
          {syncStatus && (
            <p style={{
              ...styles.syncStatus,
              color: syncStatus === "error"
                ? Theme.colors.error
                : Theme.colors.textMuted,
            }}>
              {syncStatus === "saving" && t(UI_STRINGS.personalCard.syncing)}
              {syncStatus === "saved"  && t(UI_STRINGS.personalCard.syncSuccess)}
              {syncStatus === "error"  && t(UI_STRINGS.personalCard.syncError)}
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

// ── Concept chip inside Personal Card ────────────────────────
function ConceptChip({ name, lang }) {
  return (
    <div style={chipStyles.chip}>
      <span style={chipStyles.dot}>✦</span>
      <span style={chipStyles.name}>{name}</span>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = {
  backdrop: {
    position:        "fixed",
    inset:           0,
    backgroundColor: "rgba(28, 25, 23, 0.25)",
    zIndex:          40,
  },
  panel: {
    position:        "fixed",
    top:             0,
    right:           0,
    bottom:          0,
    width:           Theme.layout.personalCardWidth,
    backgroundColor: Theme.colors.bgPersonal,
    boxShadow:       Theme.shadows.panel,
    zIndex:          50,
    display:         "flex",
    flexDirection:   "column",
    overflowY:       "auto",
    transition:      Theme.transitions.panel,
  },
  panelHeader: {
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "space-between",
    padding:         `${Theme.spacing.lg} ${Theme.spacing.lg} ${Theme.spacing.md}`,
    borderBottom:    `1px solid ${Theme.colors.border}`,
  },
  panelTitle: {
    fontFamily:  Theme.fonts.display,
    fontSize:    Theme.fontSizes.lg,
    fontWeight:  Theme.fontWeights.bold,
    color:       Theme.colors.textPrimary,
    margin:      0,
  },
  closeBtn: {
    background: "none",
    border:     "none",
    cursor:     "pointer",
    fontSize:   Theme.fontSizes.base,
    color:      Theme.colors.textMuted,
    padding:    "4px",
  },
  identityBlock: {
    display:    "flex",
    alignItems: "center",
    gap:        Theme.spacing.md,
    padding:    `${Theme.spacing.md} ${Theme.spacing.lg}`,
  },
  avatarLarge: {
    width:           "44px",
    height:          "44px",
    borderRadius:    Theme.radius.circle,
    backgroundColor: Theme.colors.accentSoft,
    border:          `2px solid ${Theme.colors.accent}`,
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    fontFamily:      Theme.fonts.display,
    fontSize:        Theme.fontSizes.lg,
    fontWeight:      Theme.fontWeights.bold,
    color:           Theme.colors.accent,
    flexShrink:      0,
  },
  userName: {
    fontFamily:  Theme.fonts.ui,
    fontSize:    Theme.fontSizes.base,
    fontWeight:  Theme.fontWeights.medium,
    color:       Theme.colors.textPrimary,
    margin:      "0 0 2px 0",
  },
  userEmail: {
    fontFamily: Theme.fonts.ui,
    fontSize:   Theme.fontSizes.sm,
    color:      Theme.colors.textMuted,
    margin:     0,
  },
  divider: {
    height:          "1px",
    backgroundColor: Theme.colors.border,
    margin:          `0 ${Theme.spacing.lg}`,
  },
  section: {
    padding: `${Theme.spacing.md} ${Theme.spacing.lg}`,
  },
  sectionTitle: {
    fontFamily:  Theme.fonts.ui,
    fontSize:    Theme.fontSizes.sm,
    fontWeight:  Theme.fontWeights.medium,
    color:       Theme.colors.textSecondary,
    margin:      `0 0 ${Theme.spacing.sm} 0`,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  emptyNote: {
    fontFamily:  Theme.fonts.ui,
    fontSize:    Theme.fontSizes.sm,
    color:       Theme.colors.textMuted,
    lineHeight:  Theme.lineHeights.loose,
    margin:      0,
  },
  conceptsList: {
    display:       "flex",
    flexDirection: "column",
    gap:           Theme.spacing.xs,
  },
  feedbackTextarea: {
    width:           "100%",
    padding:         "12px 14px",
    borderRadius:    Theme.radius.md,
    border:          `1.5px solid ${Theme.colors.border}`,
    fontSize:        Theme.fontSizes.base,
    fontFamily:      Theme.fonts.ui,
    color:           Theme.colors.textPrimary,
    backgroundColor: Theme.colors.bgCard,
    lineHeight:      Theme.lineHeights.loose,
    resize:          "vertical",
    outline:         "none",
    boxSizing:       "border-box",
    minHeight:       "100px",
    transition:      Theme.transitions.fast,
  },
  syncStatus: {
    fontFamily: Theme.fonts.ui,
    fontSize:   Theme.fontSizes.xs,
    margin:     "6px 0 0 2px",
  },
};

const chipStyles = {
  chip: {
    display:         "flex",
    alignItems:      "center",
    gap:             "8px",
    backgroundColor: Theme.colors.conceptBg,
    border:          `1px solid ${Theme.colors.conceptBorder}`,
    borderRadius:    Theme.radius.sm,
    padding:         "7px 12px",
  },
  dot: {
    color:      Theme.colors.conceptText,
    fontSize:   "10px",
    flexShrink: 0,
  },
  name: {
    fontFamily:  Theme.fonts.ui,
    fontSize:    Theme.fontSizes.sm,
    color:       Theme.colors.conceptText,
    fontWeight:  Theme.fontWeights.medium,
  },
};
