// ============================================================
// Theme.js
// ROLE: Single source of truth for all visual design tokens.
// Visual concept: "Stone on Lavender"
//   - Outer frame: soft lavender — calming, spacious
//   - App surfaces: warm stone/sand — the conversation workspace
//   - Header/logo: floats directly on lavender, no background box
//   - All containers: very rounded (28-32px), soft warm stone shadows
// ============================================================
export const Theme = {
  colors: {
    // Outer frame (page background) — soft lavender
    bgOuter:         "#E8E4F0",
    // App surfaces (the workspace) — warm stone/sand
    bgSurface:       "#F5F2EC",   // Main stone surface
    bgSurfaceDeep:   "#EDE9E2",   // Input fields, inset areas
    bgBubbleSyncca:  "#FAF8F5",   // Syncca's bubbles — lightest stone
    bgBubbleUser:    "#E8E2D8",   // User's bubbles — deeper sand
    // Header floats on lavender — transparent
    headerBg:        "transparent",
    // Brand orange — exact Syncca color
    accent:          "#E05A1A",
    accentSoft:      "#FDEEE8",
    accentDeep:      "#C43F1A",
    // Primary button — medium blue (not dark navy)
    buttonPrimary:      "#3A4FA8",
    buttonPrimaryHover: "#2e3f98",
    // Text
    textPrimary:     "#2A2420",
    textSecondary:   "#6B6158",
    textMuted:       "#666666",
    textOnLavender:  "#4A4060",
    // Concept tags
    conceptBg:       "#E8E3F5",
    conceptText:     "#4F3D8A",
    conceptBorder:   "#C5BAF0",
    // UI chrome
    border:          "#DDD7CE",
    borderFocus:     "#E05A1A",
    // Timer
    timerTrack:      "#D9D3CA",
    timerFill:       "#E05A1A",
    timerWarning:    "#C43F1A",
    // Status
    success:         "#4A7C59",
    error:           "#C0392B",
  },

  fonts: {
    // Wordmark only — Cormorant Garamond, elegant serif with long y
    display: "'Cormorant Garamond', Georgia, serif",
    // All UI text — Assistant, clean and readable
    body:    "'Assistant', system-ui, sans-serif",
    ui:      "'Assistant', system-ui, sans-serif",
  },

  fontSizes: {
    xs:   "11px",
    sm:   "13px",
    base: "15px",
    md:   "17px",
    lg:   "20px",
    xl:   "26px",
    xxl:  "34px",
  },

  fontWeights: {
    regular:  400,
    medium:   500,
    semibold: 600,
    bold:     700,
  },

  lineHeights: {
    tight:  1.3,
    normal: 1.6,
    loose:  1.9,
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
    // Warm stone tones — card feels like marble/stone slab floating
    container: `
      0 2px 6px rgba(180, 160, 130, 0.25),
      0 8px 20px rgba(160, 140, 110, 0.28),
      0 20px 50px rgba(140, 120, 90, 0.30),
      0 40px 90px rgba(120, 100, 70, 0.22)
    `,
    surface:   "0 4px 20px rgba(74, 60, 40, 0.08)",
    bubble:    "0 1px 4px rgba(74, 60, 40, 0.07)",
    tooltip:   "0 6px 24px rgba(74, 60, 40, 0.14)",
    panel:     "0 0 60px rgba(74, 60, 40, 0.16)",
    // Button — subtle blue shadow
    button: `
      0 2px 5px rgba(58, 79, 168, 0.28),
      0 5px 14px rgba(58, 79, 168, 0.20)
    `,
  },

  transitions: {
    fast:   "150ms ease",
    normal: "250ms ease",
    slow:   "350ms ease-out",
    panel:  "320ms cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // Syncca wordmark — Cormorant Garamond 600, tight letter-spacing
  logo: {
    fontSize:      "58px",
    fontFamily:    "'Cormorant Garamond', Georgia, serif",
    fontWeight:    600,
    letterSpacing: "-3px",
    color:         "#E05A1A",
  },

  layout: {
    chatMaxWidth:       "660px",
    chatContainerInset: "16px",
    personalCardWidth:  "340px",
    headerHeight:       "72px",
    loginCardMaxWidth:  "355px",
    loginButtonWidth:   "70%",
  },
};
