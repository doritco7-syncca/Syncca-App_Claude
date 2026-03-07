// ============================================================
// SYNCCA — Theme.js
// Design System extracted from Google AI Studio original build
// Fonts: Cormorant Garamond (headings) + Inter (body/UI)
// ============================================================

// ─── FONT IMPORT (add to index.html <head> or top-level CSS) ───
// <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Inter:wght@100..900&display=swap" rel="stylesheet" />

export const COLORS = {
  // ── Backgrounds ──────────────────────────────────────────────
  stoneCard:        "#F9F6EE",   // Main card / page background
  stoneLight:       "#FCFAF5",   // Input fields background
  stoneDark:        "#F0EBE0",   // Subtle dividers / hover states
  outerFrame:       "#E8E0F0",   // Soft lavender/purple page frame

  // ── Brand ────────────────────────────────────────────────────
  primary:          "#ea580c",   // Orange-Red — buttons, highlights, logo text
  primaryHover:     "#c2410c",   // Darker orange for hover states
  primaryLight:     "#FED7AA",   // orange-200 — user chat bubble bg
  primaryUnderline: "rgba(234,88,12,0.5)", // Concept highlight underline

  secondary:        "#1e3a8a",   // Dark Blue — modal accents, Syncca bubble border
  secondaryHover:   "#1e40af",

  // ── Text ─────────────────────────────────────────────────────
  textPrimary:      "#1a1a1a",   // Main body text
  textMuted:        "#6b7280",   // Placeholders, captions
  textOrange:       "#ea580c",   // Labels ("כתובת אימייל"), "SECURE & PRIVATE"
  textBlue:         "#1e3a8a",   // Sub-headings in Hebrew (ברוכים הבאים!)
  textWhite:        "#FFFFFF",

  // ── Chat Bubbles ─────────────────────────────────────────────
  bubbleUser:       "#FED7AA",   // bg-orange-100
  bubbleSyncca:     "#FDFBF7",   // near-white warm
  bubbleSynccaBorder: "#FED7AA", // border matching user bubble

  // ── Modals ───────────────────────────────────────────────────
  modalBg:          "#FDFBF7",
  timeoutModalBg:   "#EFF6FF",   // bg-blue-50

  // ── Utility ──────────────────────────────────────────────────
  border:           "#E5E0D8",
  shadow:           "rgba(0,0,0,0.08)",
  shadowMd:         "rgba(0,0,0,0.14)",
};

export const FONTS = {
  serif:  "'Cormorant Garamond', serif",     // Logo, headings, h1–h3
  sans:   "'Inter', ui-sans-serif, system-ui, sans-serif", // Body, buttons, inputs, chat
};

export const FONT_SIZES = {
  logo:    { fontSize: "2.5rem",  fontWeight: 700,   letterSpacing: "-0.01em" },
  h1:      { fontSize: "1.75rem", fontWeight: 700 },
  h2:      { fontSize: "1.375rem",fontWeight: 700 },
  h3:      { fontSize: "1.125rem",fontWeight: 600 },
  body:    { fontSize: "1rem",    fontWeight: 400,   lineHeight: 1.6 },
  small:   { fontSize: "0.8125rem", fontWeight: 400 },
  caption: { fontSize: "0.6875rem",fontWeight: 500,  letterSpacing: "0.1em", textTransform: "uppercase" },
};

export const RADIUS = {
  card:   "32px",   // All main cards
  button: "9999px", // rounded-full
  input:  "9999px", // rounded-full inputs (matching screenshot)
  modal:  "24px",
  bubble: "18px",
  tooltip:"12px",
};

export const SHADOWS = {
  card:   "0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
  button: "0 4px 14px rgba(234,88,12,0.35)",       // Orange glow for primary btn
  buttonBlue: "0 4px 14px rgba(30,58,138,0.30)",   // Blue glow for secondary btn
  modal:  "0 8px 40px rgba(0,0,0,0.13)",
  tooltip:"0 8px 32px rgba(0,0,0,0.18)",
};

export const SPACING = {
  // Mobile outer margin between purple frame and stone card
  mobileMargin: "8px",
  cardPadding:  "clamp(24px, 6vw, 40px)",
  sectionGap:   "24px",
  inputHeight:  "52px",
  buttonHeight: "54px",
};

// ─── COMPONENT STYLE TOKENS ──────────────────────────────────────

export const cardStyle = {
  backgroundColor: COLORS.stoneCard,
  borderRadius: RADIUS.card,
  boxShadow: SHADOWS.card,
  padding: SPACING.cardPadding,
  width: "100%",
  maxWidth: "420px",
};

// Full-screen mobile card — leaves only 8–12px purple margin
export const mobileCardStyle = {
  ...cardStyle,
  position: "fixed",
  inset: `${SPACING.mobileMargin}`,
  maxWidth: "none",
  borderRadius: RADIUS.card,
  overflowY: "auto",
};

export const primaryButtonStyle = {
  backgroundColor: COLORS.primary,
  color: COLORS.textWhite,
  borderRadius: RADIUS.button,
  fontFamily: FONTS.sans,
  fontSize: "1rem",
  fontWeight: 600,
  height: SPACING.buttonHeight,
  width: "100%",
  border: "none",
  cursor: "pointer",
  boxShadow: SHADOWS.button,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  transition: "background-color 0.18s ease, box-shadow 0.18s ease, transform 0.1s ease",
  // Hover: apply primaryHover color + slightly reduced shadow
};

export const secondaryButtonStyle = {
  ...primaryButtonStyle,
  backgroundColor: COLORS.secondary,
  boxShadow: SHADOWS.buttonBlue,
};

export const inputStyle = {
  backgroundColor: COLORS.stoneLight,
  borderRadius: RADIUS.input,
  fontFamily: FONTS.sans,
  fontSize: "1rem",
  color: COLORS.textPrimary,
  height: SPACING.inputHeight,
  width: "100%",
  border: `1.5px solid transparent`,
  padding: "0 20px",
  outline: "none",
  transition: "border-color 0.18s ease",
  // Focus: border-color → COLORS.primary
};

export const logoTextStyle = {
  fontFamily: FONTS.serif,
  fontSize: FONT_SIZES.logo.fontSize,
  fontWeight: FONT_SIZES.logo.fontWeight,
  color: COLORS.primary,
  letterSpacing: FONT_SIZES.logo.letterSpacing,
  lineHeight: 1.1,
};

export const hebrewHeadingStyle = {
  fontFamily: FONTS.serif,
  fontSize: FONT_SIZES.h1.fontSize,
  fontWeight: FONT_SIZES.h1.fontWeight,
  color: COLORS.secondary,         // Dark blue for Hebrew headings
  direction: "rtl",
  textAlign: "center",
};

export const captionStyle = {
  fontFamily: FONTS.sans,
  ...FONT_SIZES.caption,
  color: COLORS.textOrange,
  letterSpacing: "0.1em",
};

// ─── CHAT BUBBLE STYLES ──────────────────────────────────────────

export const userBubbleStyle = {
  backgroundColor: COLORS.bubbleUser,
  borderRadius: `${RADIUS.bubble} 0 ${RADIUS.bubble} ${RADIUS.bubble}`, // rounded-tr-none
  fontFamily: FONTS.sans,
  fontSize: "1rem",
  color: COLORS.textPrimary,
  padding: "12px 16px",
  width: "100%",           // Full width of stone card
  direction: "rtl",
  textAlign: "right",
};

export const synccaBubbleStyle = {
  backgroundColor: COLORS.bubbleSyncca,
  borderRadius: `0 ${RADIUS.bubble} ${RADIUS.bubble} ${RADIUS.bubble}`, // rounded-tl-none
  border: `1.5px solid ${COLORS.bubbleSynccaBorder}`,
  fontFamily: FONTS.sans,
  fontSize: "1rem",
  color: COLORS.textPrimary,
  padding: "12px 16px",
  width: "100%",
  direction: "rtl",
  textAlign: "right",
};

// ─── CONCEPT HIGHLIGHT STYLES ────────────────────────────────────

export const conceptHighlightStyle = {
  borderBottom: `2px solid ${COLORS.primaryUnderline}`,
  cursor: "pointer",
  fontWeight: 600,
  transition: "border-color 0.15s ease",
  // Mobile: borderBottomStyle = "dashed"
  // Desktop: borderBottomStyle = "solid"
};

export const tooltipStyle = {
  backgroundColor: COLORS.modalBg,
  color: COLORS.textPrimary,
  borderRadius: RADIUS.tooltip,
  boxShadow: SHADOWS.tooltip,
  padding: "14px 18px",
  fontFamily: FONTS.sans,
  fontSize: "0.9rem",
  maxWidth: "280px",
  position: "absolute",
  zIndex: 50,
  // Arrow: use ::after pseudo-element pointing down
};

// ─── MODAL STYLES ────────────────────────────────────────────────

export const betaModalStyle = {
  backgroundColor: COLORS.modalBg,
  borderRadius: RADIUS.modal,
  boxShadow: SHADOWS.modal,
  padding: "32px 28px",
  maxWidth: "400px",
  width: "calc(100% - 32px)",
  fontFamily: FONTS.sans,
  direction: "rtl",
};

export const timeoutModalStyle = {
  ...betaModalStyle,
  backgroundColor: COLORS.timeoutModalBg,
  border: `1.5px solid ${COLORS.secondary}22`,
};

// ─── PERSONAL CARD STYLES ────────────────────────────────────────

export const personalCardStyle = {
  backgroundColor: COLORS.stoneCard,   // 100% opaque — hides chat fully
  borderRadius: RADIUS.card,
  padding: SPACING.cardPadding,
  position: "absolute",
  inset: 0,
  overflowY: "auto",
  zIndex: 20,
  fontFamily: FONTS.sans,
  direction: "rtl",
};

export const saveButtonStyle = {
  ...primaryButtonStyle,
  marginTop: "auto",
  position: "sticky",
  bottom: "16px",
};

// ─── PAGE / OUTER FRAME ──────────────────────────────────────────

export const outerFrameStyle = {
  backgroundColor: COLORS.outerFrame,   // Soft lavender
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0",                         // Mobile: card takes full screen
};

// ─── SVG LOGO SYMBOL ─────────────────────────────────────────────
// Two crescents: outer = orange (#ea580c), inner = dark blue (#1e3a8a)

export const LOGO_SVG = `
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M25 20C15 30 10 45 10 60C10 82 28 100 50 100C72 100 90 82 90 60C90 45 85 30 75 20C82 30 85 42 85 55C85 75 70 90 50 90C30 90 15 75 15 55C15 42 18 30 25 20Z" fill="#ea580c"/>
  <path d="M40 35C35 40 32 48 32 58C32 70 40 80 50 80C60 80 68 70 68 58C68 48 65 40 60 35C65 40 68 48 68 55C68 65 60 73 50 73C40 73 32 65 32 55C32 48 35 40 40 35Z" fill="#1e3a8a"/>
</svg>
`;

// ─── BETA MODAL CONTENT (Hebrew) ─────────────────────────────────

export const BETA_MODAL_ITEMS = [
  "המערכת מבוססת על מודל בינה מלאכותית claude ועל מתודולוגיה של תקשורת בין אישית וזוגית שפותחה בעשרים השנים האחרונות.",
  "במהלך השיחה יופיעו מושגים צבועים ומודגשים. לחיצה עליהם תפתח הסבר שיעזור להעמיק בשפה של 'זוגיות נקייה'. כל מושג שתשמרו יחכה לכם בכרטיס האישי שלכם, לשם תוכלו לחזור בכל זמן.",
  "כל שיחה מוגבלת ל-30 דקות. זהו זמן המיועד להתבוננות ממוקדת ולעידוק חשיבה עצמאית.",
  "הפידבק עוזר לנו לצמוח. בסיום השיחה, נשמח לשמוע מה כדאי להוסיף, להוריד או לשנות ב-Syncca.",
];

// ─── TIMEOUT MODAL CONTENT ───────────────────────────────────────

export const TIMEOUT_MODAL = {
  header:        "זמן השיחה הסתיים",
  subtext:       "הזמן המיועד להתבוננות ממוקדת הסתיים, וזהו רגע טוב לעצור ולעודד חשיבה עצמאית על הדברים שעלו.",
  feedbackLabel: "לפני שנפרדים, נשמח לפידבק מה כדאי להוסיף, להוריד או לשנות ב-Syncca?",
};

// ─── AIRTABLE FIELD MAP ──────────────────────────────────────────
// Fields to sync on Personal Card Save

export const AIRTABLE_FIELDS = [
  "First_Name",
  "Full_Name",
  "Age_Range",
  "Marital_Status",
  "Gender",
  "Language_Preference",
];

// ─── UTILITY HELPERS ─────────────────────────────────────────────

/**
 * Derive display name from record or email fallback.
 * Returns First_Name if available, else the part before @ in email.
 */
export function getDisplayName(firstName, email) {
  if (firstName && firstName.trim()) return firstName.trim();
  if (email && email.includes("@")) return email.split("@")[0];
  return "";
}

/**
 * Check if Beta Welcome Modal should show.
 * Shows on first 2 sessions, hidden from 3rd onwards.
 */
export function shouldShowBetaModal() {
  const key = "syncca_session_count";
  const count = parseInt(localStorage.getItem(key) || "0", 10);
  const newCount = count + 1;
  localStorage.setItem(key, String(newCount));
  return newCount <= 2;
}

/**
 * Returns concept highlight inline style based on viewport.
 * Dashed on mobile, solid on desktop.
 */
export function getConceptHighlightStyle(isMobile) {
  return {
    ...conceptHighlightStyle,
    borderBottomStyle: isMobile ? "dashed" : "solid",
  };
}

// ─── CSS VARIABLES STRING (inject into :root if needed) ──────────
// Can be injected via a <style> tag or a GlobalStyles component.

export const CSS_VARIABLES = `
  :root {
    --color-stone:        ${COLORS.stoneCard};
    --color-stone-light:  ${COLORS.stoneLight};
    --color-frame:        ${COLORS.outerFrame};
    --color-primary:      ${COLORS.primary};
    --color-primary-hover:${COLORS.primaryHover};
    --color-secondary:    ${COLORS.secondary};
    --color-text:         ${COLORS.textPrimary};
    --color-text-muted:   ${COLORS.textMuted};
    --font-serif:         ${FONTS.serif};
    --font-sans:          ${FONTS.sans};
    --radius-card:        ${RADIUS.card};
    --radius-button:      ${RADIUS.button};
    --shadow-button:      ${SHADOWS.button};
    --shadow-card:        ${SHADOWS.card};
  }
`;

export default {
  COLORS,
  FONTS,
  FONT_SIZES,
  RADIUS,
  SHADOWS,
  SPACING,
  LOGO_SVG,
  BETA_MODAL_ITEMS,
  TIMEOUT_MODAL,
  AIRTABLE_FIELDS,
  getDisplayName,
  shouldShowBetaModal,
  getConceptHighlightStyle,
  CSS_VARIABLES,
};
