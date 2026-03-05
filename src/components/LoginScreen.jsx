// ============================================================
// components/LoginScreen.jsx
// ROLE: Welcome / login screen.
//
// Visual: "Stone on Lavender"
//   - Page: lavender (#E8E4F0) fills the full viewport
//   - Logo: original image + Syncca wordmark in Cormorant Garamond 600
//   - Tagline: same orange as wordmark — connects name to phrase
//   - Stone card: warm sand (#F5F2EC), 32px radius, warm stone shadow
//   - Body text: 3 lines forming an inverted triangle (longest→shortest)
//   - Email input field — required to proceed
//   - CTA button: medium blue (#3A4FA8), ~70% card width
//   - Footer: SECURE & PRIVATE • BETA PHASE in orange small-caps
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

        {/* Body text — inverted triangle, 3 lines */}
        <div style={styles.bodyText}>
          <span style={styles.textLine}>{t(UI_STRINGS.login.line1)}</span>
          <span style={styles.textLine}>{t(UI_STRINGS.login.line2)}</span>
          <span style={styles.textLine}>{t(UI_STRINGS.login.line3)}</span>
        </div>

        {/* Email input */}
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

        {showError && (
          <p style={styles.errorText}>
            {t(UI_STRINGS.errors.apiError)}
          </p>
        )}

        {error === "login_failed" && (
          <p style={styles.errorText}>{t(UI_STRINGS.errors.apiError)}</p>
        )}

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

  card: {
    backgroundColor: Theme.colors.bgSurface,
    borderRadius:    Theme.radius.xl,
    padding:         "48px 36px 42px",
    maxWidth:        Theme.layout.loginCardMaxWidth,
    width:           "100%",
    boxShadow:       Theme.shadows.container,
    display:         "flex",
    flexDirection:   "column",
    alignItems:      "center",
    textAlign:       "center",
    direction:       "rtl",
    boxSizing:       "border-box",
  },

  logoContainer: {
    display:       "flex",
    flexDirection: "column",
    alignItems:    "center",
    marginBottom:  "8px",
  },
  logoImg: {
    width:        "54px",
    height:       "54px",
    objectFit:    "contain",
    marginBottom: "4px",
  },
  logoWord: {
    fontFamily:    Theme.logo.fontFamily,
    fontSize:      Theme.logo.fontSize,
    fontWeight:    Theme.logo.fontWeight,
    color:         Theme.logo.color,
    letterSpacing: Theme.logo.letterSpacing,
    lineHeight:    1,
    paddingBottom: "10px",
  },

  tagline: {
    fontFamily:   Theme.fonts.ui,
    fontSize:     "17px",
    fontWeight:   Theme.fontWeights.bold,
    color:        Theme.colors.accent,
    marginBottom: "18px",
    direction:    "rtl",
    lineHeight:   Theme.lineHeights.tight,
  },

  bodyText: {
    fontFamily:    Theme.fonts.ui,
    fontWeight:    Theme.fontWeights.regular,
    color:         Theme.colors.textSecondary,
    lineHeight:    Theme.lineHeights.loose,
    marginBottom:  "24px",
    direction:     "rtl",
    textAlign:     "center",
    display:       "flex",
    flexDirection: "column",
    alignItems:    "center",
    width:         "100%",
  },
  textLine: {
    display:    "block",
    whiteSpace: "nowrap",
    fontSize:   "15px",
  },

  // Email input — inset sand feel
  emailInput: {
    width:           "100%",
    padding:         "12px 16px",
    borderRadius:    Theme.radius.md,
    border:          `1.5px solid ${Theme.colors.border}`,
    fontSize:        "15px",
    fontFamily:      Theme.fonts.ui,
    color:           Theme.colors.textPrimary,
    backgroundColor: Theme.colors.bgSurfaceDeep,
    outline:         "none",
    transition:      Theme.transitions.fast,
    boxSizing:       "border-box",
    marginBottom:    "12px",
    textAlign:       "left",
    direction:       "ltr",
  },

  errorText: {
    color:        Theme.colors.error,
    fontSize:     "13px",
    fontFamily:   Theme.fonts.ui,
    margin:       "0 0 8px 0",
    alignSelf:    "flex-start",
    direction:    "rtl",
  },

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
    width:           Theme.layout.loginButtonWidth,
    cursor:          "pointer",
    boxShadow:       Theme.shadows.button,
    transition:      Theme.transitions.normal,
    direction:       "rtl",
    marginBottom:    "22px",
    marginTop:       "4px",
  },
  ctaIcon: { fontSize: "18px" },

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
