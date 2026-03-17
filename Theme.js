// ============================================================
// SYNCCA — Theme.js
// Design System
// Fonts: Cormorant Garamond (headings) + Alef (body/UI)
// Colors updated: Dark Red (#C62828) + Gray (#757575)
// ============================================================

export const COLORS = {
  // ── Backgrounds ──────────────────────────────────────────────
  stoneCard:        "#F9F6EE",
  stoneLight:       "#FCFAF5",
  stoneDark:        "#F0EBE0",
  outerFrame:       "#E8E0F0",

  // ── Brand ────────────────────────────────────────────────────
  primary:          "#C62828",   // Dark Red — buttons, highlights
  primaryHover:     "#B71C1C",   // Darker red for hover
  primaryLight:     "#FFCDD2",   // red-100 — user chat bubble bg
  primaryUnderline: "rgba(198,40,40,0.5)",

  secondary:        "#757575",   // Gray — accents, borders
  secondaryHover:   "#616161",   // Darker gray for hover

  // ── Text ─────────────────────────────────────────────────────
  textPrimary:      "#1a1a1a",
  textMuted:        "#6b7280",
  textOrange:       "#C62828",
  textBlue:         "#757575",
  textWhite:        "#FFFFFF",

  // ── Chat Bubbles ─────────────────────────────────────────────
  bubbleUser:       "#FFCDD2",
  bubbleSyncca:     "#FDFBF7",
  bubbleSynccaBorder: "#FFCDD2",

  // ── Modals ───────────────────────────────────────────────────
  modalBg:          "#FDFBF7",
  timeoutModalBg:   "#F9F6EE",

  // ── Utility ──────────────────────────────────────────────────
  border:           "#E5E0D8",
  success:          "#16a34a",
};

export const FONTS = {
  serif:  "'Cormorant Garamond', serif",
  sans:   "'Alef', sans-serif",
};

export const SHADOWS = {
  card:       "0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
  button:     "0 4px 14px rgba(198,40,40,0.30)",
  buttonGray: "0 4px 14px rgba(117,117,117,0.25)",
  modal:      "0 8px 40px rgba(0,0,0,0.13)",
};

export default { COLORS, FONTS, SHADOWS };
