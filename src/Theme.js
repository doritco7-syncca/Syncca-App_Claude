// ============================================================
// Theme.js
// ROLE: Single source of truth for all visual design tokens.
// Contains colors, typography, spacing, shadows, and animation
// timings. Import this into any component that needs styling.
// To change the look of the entire app — start here.
// ============================================================

export const Theme = {

  colors: {
    // ── Backgrounds ────────────────────────────────────────
    bg:           "#FAF8F5",   // Warm off-white — main app background
    bgCard:       "#FFFFFF",   // Pure white — cards, bubbles
    bgPersonal:   "#F5F2ED",   // Slightly warmer — Personal Card panel

    // ── Brand ──────────────────────────────────────────────
    accent:       "#E8532A",   // Syncca orange-red — logo, CTAs, highlights
    accentSoft:   "#FDEEE8",   // Very light accent — hover states, tints
    accentDeep:   "#C43F1A",   // Darker accent — pressed states

    // ── Text ───────────────────────────────────────────────
    textPrimary:  "#1C1917",   // Near-black — main body text
    textSecondary:"#6B6560",   // Warm mid-grey — timestamps, labels
    textMuted:    "#A8A29E",   // Light grey — placeholders, hints

    // ── Syncca vs User bubbles ─────────────────────────────
    bubbleSyncca: "#FFFFFF",   // White — Syncca's messages
    bubbleUser:   "#EEE9E3",   // Warm sand — user's messages
    bubbleBorder: "#E8E3DC",   // Subtle border for Syncca bubble

    // ── Concept tags ───────────────────────────────────────
    conceptBg:    "#EDE9F5",   // Soft lavender — [[concept]] background
    conceptText:  "#5B4B8A",   // Deep purple — [[concept]] text
    conceptBorder:"#C9BFF0",   // Lavender border

    // ── UI Elements ────────────────────────────────────────
    border:       "#E8E3DC",   // Standard border
    borderFocus:  "#E8532A",   // Focus ring — accent color
    shadow:       "rgba(28, 25, 23, 0.08)",
    shadowDeep:   "rgba(28, 25, 23, 0.16)",

    // ── Timer arc ──────────────────────────────────────────
    timerTrack:   "#E8E3DC",
    timerFill:    "#E8532A",
    timerWarning: "#C43F1A",   // Last 5 minutes

    // ── Status ─────────────────────────────────────────────
    success:      "#4A7C59",
    error:        "#C0392B",
  },

  // ── Typography ─────────────────────────────────────────────
  fonts: {
    display:  "'Playfair Display', Georgia, serif",   // Syncca logo & headings
    body:     "'Lora', Georgia, serif",                // Syncca's chat messages
    ui:       "'DM Sans', system-ui, sans-serif",      // User messages, buttons, labels
  },

  fontSizes: {
    xs:   "11px",
    sm:   "13px",
    base: "16px",
    md:   "17px",    // Chat body — slightly larger for comfort
    lg:   "20px",
    xl:   "24px",
    xxl:  "32px",
  },

  fontWeights: {
    regular: 400,
    medium:  500,
    bold:    700,
  },

  lineHeights: {
    tight:  1.3,
    normal: 1.6,
    loose:  1.8,
  },

  // ── Spacing ────────────────────────────────────────────────
  spacing: {
    xs:   "4px",
    sm:   "8px",
    md:   "16px",
    lg:   "24px",
    xl:   "40px",
    xxl:  "64px",
  },

  // ── Border Radius ─────────────────────────────────────────
  radius: {
    sm:       "8px",
    md:       "16px",
    lg:       "24px",
    bubbleIn: "18px 18px 18px 4px",   // Syncca — opens toward user
    bubbleOut:"18px 18px 4px 18px",   // User — opens toward Syncca
    pill:     "999px",
    circle:   "50%",
  },

  // ── Shadows ────────────────────────────────────────────────
  shadows: {
    card:    "0 2px 12px rgba(28, 25, 23, 0.08)",
    panel:   "0 8px 32px rgba(28, 25, 23, 0.12)",
    tooltip: "0 4px 20px rgba(28, 25, 23, 0.16)",
    bubble:  "0 1px 4px rgba(28, 25, 23, 0.06)",
  },

  // ── Transitions ────────────────────────────────────────────
  transitions: {
    fast:   "150ms ease",
    normal: "250ms ease",
    slow:   "350ms ease-out",
    panel:  "320ms cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // ── Layout ─────────────────────────────────────────────────
  layout: {
    chatMaxWidth:    "640px",
    personalCardWidth: "340px",
    headerHeight:    "60px",
    inputAreaHeight: "72px",
  },
};

// ── Google Fonts import string ───────────────────────────────
// Add this to your index.html <head>:
// <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lora:wght@400;500&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
