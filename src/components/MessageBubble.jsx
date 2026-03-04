// ============================================================
// components/MessageBubble.jsx
// ROLE: Renders a single chat message bubble — either Syncca's
// (left-aligned, serif font) or the user's (right-aligned,
// sans-serif). Parses [[concept]] tags in Syncca's messages
// and renders them as clickable highlighted spans that open
// a ConceptTooltip. All colors come from Theme.js.
// ============================================================

import { useState } from "react";
import { ConceptTooltip } from "./ConceptTooltip.jsx";
import { Theme }           from "../Theme.js";
import { t, UI_STRINGS }   from "../UI_STRINGS.js";

export function MessageBubble({
  message,
  language,
  activeTooltip,
  onTooltipOpen,
  onTooltipClose,
  onSaveConcept,
  savedConcepts,
}) {
  const isSyncca = message.role === "assistant";

  // Parse [[concept]] tags into segments
  const segments = isSyncca
    ? parseConceptSegments(message.content)
    : [{ type: "text", value: message.content }];

  const bubbleStyle = {
    ...styles.bubble,
    ...(isSyncca ? styles.bubbleSyncca : styles.bubbleUser),
  };

  return (
    <div style={{ ...styles.row, ...(isSyncca ? styles.rowLeft : styles.rowRight) }}>
      {/* Avatar */}
      {isSyncca && (
        <div style={styles.avatar} aria-label={t(UI_STRINGS.a11y.synccaAvatar)}>
          <SynccaAvatar />
        </div>
      )}

      <div style={styles.bubbleWrapper}>
        <div style={bubbleStyle}>
          {segments.map((seg, i) => {
            if (seg.type === "text") {
              return (
                <span key={i} style={isSyncca ? styles.textSyncca : styles.textUser}>
                  {seg.value}
                </span>
              );
            }
            // [[concept]] segment
            const isSaved    = savedConcepts.includes(seg.value);
            const isActive   = activeTooltip === seg.value;
            return (
              <span key={i} style={{ position: "relative", display: "inline" }}>
                <button
                  style={{
                    ...styles.conceptTag,
                    backgroundColor: isActive
                      ? Theme.colors.conceptBorder
                      : Theme.colors.conceptBg,
                  }}
                  onClick={() => isActive
                    ? onTooltipClose()
                    : onTooltipOpen(seg.value)
                  }
                >
                  {seg.value}
                </button>
                {isActive && (
                  <ConceptTooltip
                    conceptName={seg.value}
                    language={language}
                    isSaved={isSaved}
                    onSave={() => onSaveConcept(seg.value)}
                    onClose={onTooltipClose}
                  />
                )}
              </span>
            );
          })}
        </div>

        {/* Timestamp */}
        <span style={{
          ...styles.timestamp,
          textAlign: isSyncca ? "left" : "right",
        }}>
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function parseConceptSegments(text) {
  const parts = text.split(/(\[\[[^\]]+\]\])/g);
  return parts.map((part) => {
    const match = part.match(/^\[\[([^\]]+)\]\]$/);
    if (match) return { type: "concept", value: match[1] };
    return { type: "text", value: part };
  }).filter((s) => s.value);
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function SynccaAvatar() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="14" fill={Theme.colors.accentSoft} />
      <path
        d="M14 5C9.03 5 5 9.03 5 14C5 18.97 9.03 23 14 23C18.97 23 23 18.97 23 14"
        stroke={Theme.colors.accent}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14 5C14 5 18 9 18 14"
        stroke={Theme.colors.accent}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = {
  row: {
    display:    "flex",
    alignItems: "flex-end",
    gap:        "10px",
    width:      "100%",
  },
  rowLeft:  { flexDirection: "row" },
  rowRight: { flexDirection: "row-reverse" },

  avatar: {
    flexShrink: 0,
    marginBottom: "18px",
  },

  bubbleWrapper: {
    display:       "flex",
    flexDirection: "column",
    gap:           "4px",
    maxWidth:      "78%",
  },

  bubble: {
    padding:    "14px 18px",
    lineHeight: Theme.lineHeights.loose,
    wordBreak:  "break-word",
    position:   "relative",
  },

  bubbleSyncca: {
    backgroundColor: Theme.colors.bubbleSyncca,
    border:          `1px solid ${Theme.colors.bubbleBorder}`,
    borderRadius:    Theme.radius.bubbleIn,
    boxShadow:       Theme.shadows.bubble,
    fontFamily:      Theme.fonts.body,       // Lora — Syncca's voice
    fontSize:        Theme.fontSizes.md,
    color:           Theme.colors.textPrimary,
  },

  bubbleUser: {
    backgroundColor: Theme.colors.bubbleUser,
    borderRadius:    Theme.radius.bubbleOut,
    fontFamily:      Theme.fonts.ui,         // DM Sans — user's voice
    fontSize:        Theme.fontSizes.md,
    color:           Theme.colors.textPrimary,
  },

  textSyncca: {
    fontFamily: Theme.fonts.body,
  },
  textUser: {
    fontFamily: Theme.fonts.ui,
  },

  conceptTag: {
    display:         "inline",
    backgroundColor: Theme.colors.conceptBg,
    color:           Theme.colors.conceptText,
    border:          `1px solid ${Theme.colors.conceptBorder}`,
    borderRadius:    "4px",
    padding:         "1px 6px",
    fontSize:        "0.9em",
    fontFamily:      Theme.fonts.ui,
    fontWeight:      Theme.fontWeights.medium,
    cursor:          "pointer",
    textDecoration:  "underline dotted",
    textUnderlineOffset: "2px",
    transition:      Theme.transitions.fast,
  },

  timestamp: {
    fontFamily: Theme.fonts.ui,
    fontSize:   Theme.fontSizes.xs,
    color:      Theme.colors.textMuted,
    padding:    `0 ${Theme.spacing.sm}`,
  },
};
