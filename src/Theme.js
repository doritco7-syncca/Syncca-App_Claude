// ============================================================
// Theme.js
// ROLE: Single source of truth for all visual design tokens.
// Visual concept: "Stone on Lavender"
//   - Outer frame: soft lavender — calming, spacious
//   - App surfaces: warm stone/sand — the conversation workspace
//   - Header/logo: floats directly on lavender, no background box
//   - All containers: very rounded (28-32px), soft resting shadows
// ============================================================

export const Theme = {

  colors: {
    // Outer frame (page background) — soft lavender
    bgOuter:         "#EAE6F4",

    // App surfaces (the workspace) — warm stone/sand
    bgSurface:       "#F5F2ED",   // Main stone surface
    bgSurfaceDeep:   "#EDE9E2",   // Input fields, inset areas
    bgBubbleSyncca:  "#FAF8F5",   // Syncca's bubbles — lightest stone
    bgBubbleUser:    "#E8E2D8",   // User's bubbles — deeper sand

    // Header floats on lavender — transparent
    headerBg:        "transparent",

    // Brand
    accent:          "#E8532A",
    accentSoft:      "#FDEEE8",
    accentDeep:      "#C43F1A",

    // Text
    textPrimary:     "#2A2420",
    textSecondary:   "#6B6158",
    textMuted:       "#A89E96",
    textOnLavender:  "#4A4060",

    // Concept tags
    conceptBg:       "#E8E3F5",
    conceptText:     "#4F3D8A",
    conceptBorder:   "#C5BAF0",

    // UI chrome
    border:          "#DDD7CE",
    borderFocus:     "#E8532A",

    // Timer
    timerTrack:      "#D9D3CA",
    timerFill:       "#E8532A",
    timerWarning:    "#C43F1A",

    // Status
    success:         "#4A7C59",
    error:           "#C0392B",
  },

  fonts: {
    display: "'Playfair Display', Georgia, serif",
    body:    "'Lora', Georgia, serif",
    ui:      "'DM Sans', system-ui, sans-serif",
  },

  fontSizes: {
    xs:   "11px",
    sm:   "13px",
    base: "16px",
    md:   "17px",
    lg:   "20px",
    xl:   "26px",
    xxl:  "34px",
  },

  fontWeights: {
    regular: 400,
    medium:  500,
    bold:    700,
  },

  lineHeights: {
    tight:  1.3,
    normal: 1.6,
    loose:  1.85,
  },

  spacing: {
    xs:  "4px",
    sm:  "8px",
    md:  "16px",
    lg:  "24px",
    xl:  "40px",
    xxl: "64px",
  },

  radius: {
    sm:       "8px",
    md:       "16px",
    lg:       "28px",
    xl:       "32px",
    bubbleIn: "20px 20px 20px 5px",
    bubbleOut:"20px 20px 5px 20px",
    pill:     "999px",
    circle:   "50%",
  },

  shadows: {
    container: "0 8px 40px rgba(74, 60, 40, 0.10), 0 2px 8px rgba(74, 60, 40, 0.06)",
    surface:   "0 4px 20px rgba(74, 60, 40, 0.08)",
    bubble:    "0 1px 4px rgba(74, 60, 40, 0.07)",
    tooltip:   "0 6px 24px rgba(74, 60, 40, 0.14)",
    panel:     "0 0 60px rgba(74, 60, 40, 0.16)",
  },

  transitions: {
    fast:   "150ms ease",
    normal: "250ms ease",
    slow:   "350ms ease-out",
    panel:  "320ms cubic-bezier(0.4, 0, 0.2, 1)",
  },

  logo: {
    fontSize:     "32px",        // "Syncca" wordmark size — matches original
    fontFamily:   "'Playfair Display', Georgia, serif",
    letterSpacing:"-0.5px",
    color:        "#E8532A",
  },

  layout: {
    chatMaxWidth:       "660px",
    chatContainerInset: "16px",
    personalCardWidth:  "340px",
    headerHeight:       "72px",
  },
};
