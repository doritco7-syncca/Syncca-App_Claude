// ============================================================
// components/LoginScreen.jsx
// ROLE: Welcome / login screen.
//
// Visual: "Stone on Lavender"
//   - Page: lavender (#EAE6F4) fills the full viewport
//   - Logo block: floats directly on lavender — NO card, NO box,
//     NO shadow, NO border behind it. Just the arc icon +
//     "Syncca" wordmark in Playfair Display coral + italic tagline.
//   - Stone card: warm sand (#F5F2ED), 28px radius, soft warm shadow
//   - All form elements use the deeper sand (#EDE9E2) for inset feel
// ============================================================

import { useState } from "react";
import { Theme }         from "../Theme.js";
import { t, UI_STRINGS } from "../UI_STRINGS.js";

export function LoginScreen({ onLogin, isLoading, error }) {
  const [email,   setEmail]   = useState("");
  const [touched, setTouched] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showError    = touched && !isValidEmail && email.length > 0;

  function handleSubmit() {
    setTouched(true);
    if (isValidEmail) onLogin(email.trim().toLowerCase());
  }

  return (
    <div style={styles.page}>

      {/* ── Logo floats on lavender — absolutely no box behind it ── */}
      <div style={styles.logoBlock}>
        <SynccaLogoMark size={44} />
        <div style={styles.logoTextGroup}>
          <span style={styles.logoWord}>Syncca</span>
          <span style={styles.logoTagline}>
            {t(UI_STRINGS.app.tagline)}
          </span>
        </div>
      </div>

      {/* ── Stone card ── */}
      <div style={styles.card}>

        <h1 style={styles.headline}>
          {t(UI_STRINGS.login.headline)}
        </h1>

        <p style={styles.sub}>
          {t(UI_STRINGS.login.subheadline)}
        </p>

        {/* CTA */}
        <button
          style={{
            ...styles.ctaButton,
            opacity: isLoading ? 0.7 : 1,
            cursor:  isLoading ? "wait" : "pointer",
          }}
          onClick={handleSubmit}
          disabled={isLoading}
        >
          <span style={styles.ctaIcon}>↺</span>
          {isLoading ? "..." : t(UI_STRINGS.login.ctaButton)}
        </button>

        {/* Email */}
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          onBlur={() => setTouched(true)}
          placeholder={t(UI_STRINGS.login.emailPlaceholder)}
          style={{
            ...styles.emailInput,
            borderColor: showError
              ? Theme.colors.error
              : (touched && isValidEmail ? Theme.colors.accent : Theme.colors.border),
          }}
          dir="ltr"
        />

        {error === "login_failed" && (
          <p style={styles.errorText}>{t(UI_STRINGS.errors.apiError)}</p>
        )}

        <p style={styles.secureNote}>
          <LockIcon />
          {t(UI_STRINGS.login.secureNote)}
        </p>
      </div>

      {/* Beta — floats on lavender below card */}
      <p style={styles.beta}>{t(UI_STRINGS.app.beta)}</p>
    </div>
  );
}

// ── SynccaLogoMark ────────────────────────────────────────────
// The arc icon that appears in the original screenshots.
// Drawn as two arcs: a full-circle arc (main) + an inner arc (ghost).
function SynccaLogoMark({ size = 40 }) {
  const s = size;
  const cx = s / 2, cy = s / 2, r = s * 0.38;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none"
      aria-hidden="true">
      {/* Main arc — almost full circle, open at top-right */}
      <path
        d={`
          M ${cx} ${cy - r}
          A ${r} ${r} 0 1 0 ${cx + r * 0.85} ${cy - r * 0.53}
        `}
        stroke={Theme.colors.accent}
        strokeWidth={s * 0.065}
        strokeLinecap="round"
        fill="none"
      />
      {/* Inner ghost arc — top-right quarter */}
      <path
        d={`
          M ${cx} ${cy - r * 0.55}
          A ${r * 0.55} ${r * 0.55} 0 0 1 ${cx + r * 0.55} ${cy}
        `}
        stroke={Theme.colors.accent}
        strokeWidth={s * 0.055}
        strokeLinecap="round"
        fill="none"
        opacity="0.42"
      />
    </svg>
  );
}

// ── LockIcon ──────────────────────────────────────────────────
function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
      style={{ marginRight: 5, display: "inline", verticalAlign: "middle" }}>
      <rect x="2" y="5.5" width="8" height="5.5" rx="1"
        stroke={Theme.colors.textMuted} strokeWidth="1.1" />
      <path d="M4 5.5V3.5a2 2 0 014 0v2"
        stroke={Theme.colors.textMuted} strokeWidth="1.1" />
    </svg>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = {

  // Full-viewport lavender frame
  page: {
    minHeight:       "100vh",
    display:         "flex",
    flexDirection:   "column",
    alignItems:      "center",
    justifyContent:  "center",
    backgroundColor: Theme.colors.bgOuter,
    padding:         `${Theme.spacing.xl} ${Theme.spacing.lg}`,
    gap:             Theme.spacing.lg,
    boxSizing:       "border-box",
  },

  // Logo block — NO background, NO border, NO shadow
  logoBlock: {
    display:    "flex",
    alignItems: "center",
    gap:        "14px",
  },
  logoTextGroup: {
    display:       "flex",
    flexDirection: "column",
    gap:           "2px",
  },
  // "Syncca" wordmark — Playfair Display, coral, faithful to screenshot
  logoWord: {
    fontFamily:    Theme.logo.fontFamily,
    fontSize:      Theme.logo.fontSize,
    fontWeight:    700,
    color:         Theme.logo.color,
    letterSpacing: Theme.logo.letterSpacing,
    lineHeight:    1,
    display:       "block",
  },
  logoTagline: {
    fontFamily: Theme.fonts.body,      // Lora italic
    fontSize:   Theme.fontSizes.sm,
    fontStyle:  "italic",
    color:      Theme.colors.textOnLavender,
    opacity:    0.75,
    lineHeight: 1,
    display:    "block",
  },

  // Stone card — warm, very rounded, soft shadow
  card: {
    backgroundColor: Theme.colors.bgSurface,
    borderRadius:    Theme.radius.lg,       // 28px
    padding:         "40px 36px 36px",
    maxWidth:        "400px",
    width:           "100%",
    boxShadow:       Theme.shadows.container,
    display:         "flex",
    flexDirection:   "column",
    alignItems:      "flex-start",
    gap:             Theme.spacing.md,
    direction:       "rtl",
    boxSizing:       "border-box",
  },

  headline: {
    fontFamily:  Theme.fonts.display,   // Playfair Display
    fontSize:    Theme.fontSizes.lg,
    fontWeight:  Theme.fontWeights.bold,
    color:       Theme.colors.textPrimary,
    margin:      0,
    lineHeight:  Theme.lineHeights.tight,
  },
  sub: {
    fontFamily: Theme.fonts.body,       // Lora
    fontSize:   Theme.fontSizes.sm,
    fontStyle:  "italic",
    color:      Theme.colors.textSecondary,
    lineHeight: Theme.lineHeights.loose,
    margin:     0,
  },

  ctaButton: {
    display:         "flex",
    alignItems:      "center",
    gap:             "8px",
    backgroundColor: Theme.colors.accent,
    color:           "#FFFFFF",
    border:          "none",
    borderRadius:    Theme.radius.pill,
    padding:         "14px 28px",
    fontSize:        Theme.fontSizes.base,
    fontFamily:      Theme.fonts.ui,
    fontWeight:      Theme.fontWeights.medium,
    width:           "100%",
    justifyContent:  "center",
    cursor:          "pointer",
    transition:      Theme.transitions.normal,
  },
  ctaIcon: { fontSize: "18px" },

  emailInput: {
    width:           "100%",
    padding:         "12px 16px",
    borderRadius:    Theme.radius.md,
    border:          `1.5px solid ${Theme.colors.border}`,
    fontSize:        Theme.fontSizes.base,
    fontFamily:      Theme.fonts.ui,
    color:           Theme.colors.textPrimary,
    backgroundColor: Theme.colors.bgSurfaceDeep,
    outline:         "none",
    transition:      Theme.transitions.fast,
    boxSizing:       "border-box",
  },

  errorText: {
    color:      Theme.colors.error,
    fontSize:   Theme.fontSizes.sm,
    fontFamily: Theme.fonts.ui,
    margin:     0,
  },

  secureNote: {
    color:         Theme.colors.textMuted,
    fontSize:      Theme.fontSizes.xs,
    fontFamily:    Theme.fonts.ui,
    margin:        0,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },

  // Beta badge floats below card on lavender
  beta: {
    color:         Theme.colors.textOnLavender,
    fontSize:      Theme.fontSizes.xs,
    fontFamily:    Theme.fonts.ui,
    opacity:       0.55,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    margin:        0,
  },
};
