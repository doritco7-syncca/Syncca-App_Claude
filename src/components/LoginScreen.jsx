// ============================================================
// components/LoginScreen.jsx
// ROLE: Welcome / login screen.
//
// Visual: "Stone on Lavender"
//   - Page: lavender (#E8E4F0) fills the full viewport
//   - Logo: original image + Syncca wordmark in Cormorant Garamond 600
//   - Tagline: same orange as wordmark — connects name to phrase
//   - Stone card: warm sand (#F5F2EC), 32px radius, warm stone shadow
//   - Body text: 4 lines forming an inverted triangle (longest→shortest)
//   - CTA button: medium blue (#3A4FA8), ~70% card width
//   - Logout link: muted grey
//   - Footer: SECURE & PRIVATE • BETA PHASE in orange small-caps
// ============================================================

import { useState } from "react";
import { Theme }         from "../Theme.js";
import { t, UI_STRINGS } from "../UI_STRINGS.js";

// ── Google Fonts import (add to index.html or App.jsx if not present) ──
// <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Assistant:wght@400;700&display=swap" rel="stylesheet">

export function LoginScreen({ onLogin, isLoading, error }) {
  const [email,   setEmail]   = useState("");
  const [touched, setTouched] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function handleSubmit() {
    setTouched(true);
    if (isValidEmail) onLogin(email.trim().toLowerCase());
  }

  return (
    <div style={styles.page}>

      {/* ── Stone card ── */}
      <div style={styles.card}>

        {/* Logo: icon + wordmark stacked */}
        <div style={styles.logoContainer}>
          <img
            src="/logo.jpg"
            alt="Syncca"
            style={styles.logoImg}
          />
          <div style={styles.logoWord}>Syncca</div>
        </div>

        {/* Tagline — same orange, connects to wordmark */}
        <div style={styles.tagline}>
          {t(UI_STRINGS.app.tagline)}
        </div>

        {/* Body text — inverted triangle, 4 lines */}
        <div style={styles.bodyText}>
          <span style={styles.textLine}>{t(UI_STRINGS.login.line1)}</span>
          <span style={styles.textLine}>{t(UI_STRINGS.login.line2)}</span>
          <span style={styles.textLine}>{t(UI_STRINGS.login.line3)}</span>
          <span style={styles.textLine}>{t(UI_STRINGS.login.line4)}</span>
        </div>

        {/* CTA button */}
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

        {/* Logout / email link */}
        {email && (
          <p style={styles.logoutLink}>
            {t(UI_STRINGS.login.logoutPrefix)}{email}
          </p>
        )}
        {!email && (
          <p style={styles.logoutLink}>
            {t(UI_STRINGS.login.logoutDefault)}
          </p>
        )}

        {error === "login_failed" && (
          <p style={styles.errorText}>{t(UI_STRINGS.errors.apiError)}</p>
        )}

        {/* Footer badges */}
        <div style={styles.footerBadges}>
          <span style={styles.badge}>SECURE &amp; PRIVATE</span>
          <span style={styles.dotSep}>•</span>
          <span style={styles.badge}>BETA PHASE</span>
        </div>

      </div>
    </div>
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
    padding:         "20px",
    boxSizing:       "border-box",
  },

  // Stone card — warm, very rounded, marble-like shadow
  card: {
    backgroundColor: Theme.colors.bgSurface,
    borderRadius:    Theme.radius.xl,        // 32px
    padding:         "48px 36px 42px",
    maxWidth:        Theme.layout.loginCardMaxWidth,  // 355px
    width:           "100%",
    boxShadow:       Theme.shadows.container,
    display:         "flex",
    flexDirection:   "column",
    alignItems:      "center",
    textAlign:       "center",
    direction:       "rtl",
    boxSizing:       "border-box",
  },

  // Logo image + wordmark
  logoContainer: {
    display:       "flex",
    flexDirection: "column",
    alignItems:    "center",
    marginBottom:  "8px",
  },
  logoImg: {
    width:       "54px",
    height:      "54px",
    objectFit:   "contain",
    marginBottom:"4px",
  },
  // Cormorant Garamond 600, tight — the polished wordmark
  logoWord: {
    fontFamily:    Theme.logo.fontFamily,
    fontSize:      Theme.logo.fontSize,
    fontWeight:    Theme.logo.fontWeight,
    color:         Theme.logo.color,
    letterSpacing: Theme.logo.letterSpacing,
    lineHeight:    1,
    paddingBottom: "10px",
  },

  // Tagline — same orange as wordmark, bridges name to message
  tagline: {
    fontFamily:   Theme.fonts.ui,
    fontSize:     "17px",
    fontWeight:   Theme.fontWeights.bold,
    color:        Theme.colors.accent,
    marginBottom: "18px",
    direction:    "rtl",
    lineHeight:   Theme.lineHeights.tight,
  },

  // Body text container — inverted triangle layout
  bodyText: {
    fontFamily:    Theme.fonts.ui,
    fontWeight:    Theme.fontWeights.regular,
    color:         Theme.colors.textSecondary,
    lineHeight:    Theme.lineHeights.loose,
    marginBottom:  "30px",
    direction:     "rtl",
    textAlign:     "center",
    display:       "flex",
    flexDirection: "column",
    alignItems:    "center",
    width:         "100%",
  },
  // Each line pinned — white-space nowrap preserves the triangle shape
  textLine: {
    display:    "block",
    whiteSpace: "nowrap",
    fontSize:   "15px",
  },

  // CTA — medium blue, narrower (~70% card width)
  ctaButton: {
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    gap:             "8px",
    backgroundColor: Theme.colors.buttonPrimary,
    color:           "#FFFFFF",
    border:          "none",
    borderRadius:    Theme.radius.pill,
    padding:         "14px 22px",
    fontSize:        "16px",
    fontFamily:      Theme.fonts.ui,
    fontWeight:      Theme.fontWeights.bold,
    width:           Theme.layout.loginButtonWidth,   // 70%
    cursor:          "pointer",
    boxShadow:       Theme.shadows.button,
    transition:      Theme.transitions.normal,
    direction:       "rtl",
    marginBottom:    "14px",
  },
  ctaIcon: { fontSize: "18px" },

  // Logout / email line — muted grey
  logoutLink: {
    fontSize:     "13px",
    color:        Theme.colors.textMuted,
    fontFamily:   Theme.fonts.ui,
    margin:       "0 0 22px 0",
    direction:    "rtl",
  },

  errorText: {
    color:      Theme.colors.error,
    fontSize:   Theme.fontSizes.sm,
    fontFamily: Theme.fonts.ui,
    margin:     "0 0 8px 0",
  },

  // Footer badges — orange small-caps
  footerBadges: {
    display:    "flex",
    gap:        "10px",
    alignItems: "center",
  },
  badge: {
    fontSize:      "10px",
    fontWeight:    Theme.fontWeights.bold,
    letterSpacing: "1.5px",
    color:         Theme.colors.accent,
    textTransform: "uppercase",
    fontFamily:    Theme.fonts.ui,
  },
  dotSep: {
    color:    Theme.colors.accent,
    fontSize: "10px",
  },
};
