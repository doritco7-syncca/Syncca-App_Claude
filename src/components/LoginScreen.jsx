// ============================================================
// components/LoginScreen.jsx
// ROLE: The first screen a user sees. Collects email to find
// or create their Airtable user record. All visible text is
// imported from UI_STRINGS.js — edit text there, not here.
// ============================================================

import { useState } from "react";
import { Theme }       from "../Theme.js";
import { t, UI_STRINGS } from "../UI_STRINGS.js";

export function LoginScreen({ onLogin, isLoading, error }) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showError = touched && !isValidEmail && email.length > 0;

  function handleSubmit() {
    setTouched(true);
    if (isValidEmail) onLogin(email.trim().toLowerCase());
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div style={styles.page}>
      {/* Warm background texture */}
      <div style={styles.bgTexture} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <LogoMark />
          <span style={styles.logoText}>{t(UI_STRINGS.app.name)}</span>
        </div>

        {/* Headline */}
        <h1 style={styles.headline}>
          {t(UI_STRINGS.login.headline)}
        </h1>

        {/* Subheadline */}
        <p style={styles.sub}>
          {t(UI_STRINGS.login.subheadline)}
        </p>

        {/* CTA Button */}
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

        {/* Email field */}
        <div style={styles.emailRow}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTouched(true)}
            placeholder={t(UI_STRINGS.login.emailPlaceholder)}
            style={{
              ...styles.emailInput,
              borderColor: showError
                ? Theme.colors.error
                : touched && isValidEmail
                ? Theme.colors.accent
                : Theme.colors.border,
            }}
            aria-label={t(UI_STRINGS.login.emailLabel)}
            dir="ltr"
          />
        </div>

        {/* Error state */}
        {error === "login_failed" && (
          <p style={styles.errorText}>
            {t(UI_STRINGS.errors.apiError)}
          </p>
        )}

        {/* Security note */}
        <p style={styles.secureNote}>
          <LockIcon />
          {t(UI_STRINGS.login.secureNote)}
        </p>

        {/* Beta badge */}
        <p style={styles.beta}>{t(UI_STRINGS.app.beta)}</p>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function LogoMark() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path
        d="M18 4C10.268 4 4 10.268 4 18C4 25.732 10.268 32 18 32C25.732 32 32 25.732 32 18"
        stroke={Theme.colors.accent}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M18 4C18 4 24 10 24 18"
        stroke={Theme.colors.accent}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
      style={{ marginRight: 4, display: "inline", verticalAlign: "middle" }}>
      <rect x="2" y="5.5" width="8" height="5.5" rx="1"
        stroke={Theme.colors.textMuted} strokeWidth="1"/>
      <path d="M4 5.5V3.5a2 2 0 014 0v2"
        stroke={Theme.colors.textMuted} strokeWidth="1"/>
    </svg>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight:       "100vh",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    backgroundColor: Theme.colors.bg,
    padding:         Theme.spacing.lg,
    position:        "relative",
    overflow:        "hidden",
  },
  bgTexture: {
    position:        "absolute",
    inset:           0,
    backgroundImage: `radial-gradient(ellipse at 20% 50%, ${Theme.colors.accentSoft} 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, #EDE9F5 0%, transparent 50%)`,
    pointerEvents:   "none",
  },
  card: {
    position:        "relative",
    backgroundColor: Theme.colors.bgCard,
    borderRadius:    Theme.radius.lg,
    padding:         "40px 36px 32px",
    maxWidth:        "380px",
    width:           "100%",
    boxShadow:       Theme.shadows.panel,
    display:         "flex",
    flexDirection:   "column",
    alignItems:      "flex-start",
    gap:             Theme.spacing.md,
    direction:       "rtl",
  },
  logoRow: {
    display:        "flex",
    alignItems:     "center",
    gap:            "10px",
    marginBottom:   Theme.spacing.sm,
  },
  logoText: {
    fontFamily:   Theme.fonts.display,
    fontSize:     Theme.fontSizes.xl,
    fontWeight:   Theme.fontWeights.bold,
    color:        Theme.colors.accent,
    letterSpacing:"-0.5px",
  },
  headline: {
    fontFamily:  Theme.fonts.display,
    fontSize:    Theme.fontSizes.lg,
    fontWeight:  Theme.fontWeights.bold,
    color:       Theme.colors.textPrimary,
    margin:      0,
    lineHeight:  Theme.lineHeights.tight,
  },
  sub: {
    fontFamily:  Theme.fonts.ui,
    fontSize:    Theme.fontSizes.sm,
    color:       Theme.colors.textSecondary,
    lineHeight:  Theme.lineHeights.loose,
    margin:      0,
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
    transition:      Theme.transitions.normal,
  },
  ctaIcon: {
    fontSize: "18px",
    display:  "inline-block",
  },
  emailRow: {
    width: "100%",
  },
  emailInput: {
    width:        "100%",
    padding:      "12px 16px",
    borderRadius: Theme.radius.md,
    border:       `1.5px solid ${Theme.colors.border}`,
    fontSize:     Theme.fontSizes.base,
    fontFamily:   Theme.fonts.ui,
    color:        Theme.colors.textPrimary,
    background:   Theme.colors.bg,
    outline:      "none",
    transition:   Theme.transitions.fast,
    boxSizing:    "border-box",
  },
  errorText: {
    color:      Theme.colors.error,
    fontSize:   Theme.fontSizes.sm,
    fontFamily: Theme.fonts.ui,
    margin:     0,
  },
  secureNote: {
    color:      Theme.colors.textMuted,
    fontSize:   Theme.fontSizes.xs,
    fontFamily: Theme.fonts.ui,
    margin:     0,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  beta: {
    color:      Theme.colors.textMuted,
    fontSize:   Theme.fontSizes.xs,
    fontFamily: Theme.fonts.ui,
    margin:     0,
    alignSelf:  "center",
  },
};
