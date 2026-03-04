// ============================================================
// components/ConceptTooltip.jsx
// ROLE: Floating tooltip shown when a user clicks a [[concept]]
// tag in Syncca's message. Fetches the concept description from
// Airtable (or falls back to local lexicon) and displays it
// with a "Save to Personal Card" button. Closes on outside click.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { fetchConcept } from "../AirtableService.js";
import { Theme }         from "../Theme.js";
import { t, UI_STRINGS } from "../UI_STRINGS.js";

export function ConceptTooltip({
  conceptName,
  language,
  isSaved,
  onSave,
  onClose,
}) {
  const [concept,   setConcept]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [justSaved, setJustSaved] = useState(false);
  const tooltipRef = useRef(null);
  const lang = language === "Hebrew" ? "he" : "en";

  // Fetch concept from Airtable
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchConcept(conceptName, lang);
        if (!cancelled) setConcept(data);
      } catch {
        if (!cancelled) setConcept(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [conceptName, lang]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  function handleSave() {
    onSave();
    setJustSaved(true);
  }

  const displayTerm = lang === "he"
    ? concept?.hebrewTerm || conceptName
    : concept?.englishTerm || conceptName;

  return (
    <div style={styles.tooltip} ref={tooltipRef} role="dialog"
      aria-label={conceptName}>
      {/* Close button */}
      <button style={styles.closeBtn} onClick={onClose}>
        {t(UI_STRINGS.conceptTooltip.close)}
      </button>

      {loading ? (
        <div style={styles.loading}>
          <span style={styles.loadingDot} />
          <span style={{ ...styles.loadingDot, animationDelay: "0.2s" }} />
          <span style={{ ...styles.loadingDot, animationDelay: "0.4s" }} />
        </div>
      ) : (
        <>
          <h4 style={styles.term}>{displayTerm}</h4>
          {concept?.description && (
            <p style={styles.description}>{concept.description}</p>
          )}
          {!concept && (
            <p style={styles.description}>{conceptName}</p>
          )}
        </>
      )}

      {/* Save button */}
      <button
        style={{
          ...styles.saveBtn,
          backgroundColor: (isSaved || justSaved)
            ? Theme.colors.bg
            : Theme.colors.accent,
          color: (isSaved || justSaved)
            ? Theme.colors.textSecondary
            : "#FFFFFF",
        }}
        onClick={handleSave}
        disabled={isSaved || justSaved}
      >
        {(isSaved || justSaved)
          ? t(UI_STRINGS.chat.conceptSaved)
          : t(UI_STRINGS.chat.saveConceptBtn)
        }
      </button>

      {/* Tail pointer */}
      <div style={styles.tail} />

      <style>{`
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes loadingPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = {
  tooltip: {
    position:        "absolute",
    bottom:          "calc(100% + 10px)",
    left:            "50%",
    transform:       "translateX(-50%)",
    backgroundColor: Theme.colors.bgCard,
    border:          `1px solid ${Theme.colors.conceptBorder}`,
    borderRadius:    Theme.radius.md,
    padding:         "16px 16px 12px",
    width:           "260px",
    boxShadow:       Theme.shadows.tooltip,
    zIndex:          100,
    animation:       "tooltipIn 200ms ease forwards",
  },
  closeBtn: {
    position:   "absolute",
    top:        "8px",
    right:      "10px",
    background: "none",
    border:     "none",
    cursor:     "pointer",
    color:      Theme.colors.textMuted,
    fontSize:   Theme.fontSizes.sm,
    padding:    "2px 4px",
  },
  term: {
    fontFamily:  Theme.fonts.display,
    fontSize:    Theme.fontSizes.base,
    fontWeight:  Theme.fontWeights.bold,
    color:       Theme.colors.conceptText,
    margin:      "0 0 8px 0",
    paddingRight: "20px",
  },
  description: {
    fontFamily:  Theme.fonts.ui,
    fontSize:    Theme.fontSizes.sm,
    color:       Theme.colors.textSecondary,
    lineHeight:  Theme.lineHeights.loose,
    margin:      "0 0 12px 0",
  },
  saveBtn: {
    width:        "100%",
    padding:      "9px",
    borderRadius: Theme.radius.pill,
    border:       "none",
    fontSize:     Theme.fontSizes.sm,
    fontFamily:   Theme.fonts.ui,
    fontWeight:   Theme.fontWeights.medium,
    cursor:       "pointer",
    transition:   Theme.transitions.normal,
  },
  tail: {
    position:    "absolute",
    bottom:      "-6px",
    left:        "50%",
    transform:   "translateX(-50%) rotate(45deg)",
    width:       "10px",
    height:      "10px",
    backgroundColor: Theme.colors.bgCard,
    border:      `1px solid ${Theme.colors.conceptBorder}`,
    borderTop:   "none",
    borderLeft:  "none",
  },
  loading: {
    display:        "flex",
    gap:            "5px",
    justifyContent: "center",
    padding:        "8px 0",
  },
  loadingDot: {
    width:           "7px",
    height:          "7px",
    borderRadius:    "50%",
    backgroundColor: Theme.colors.conceptText,
    animation:       "loadingPulse 1.2s ease infinite",
    display:         "inline-block",
  },
};
