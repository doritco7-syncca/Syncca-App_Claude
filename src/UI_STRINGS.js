// ============================================================
// UI_STRINGS.js
// ROLE: Central repository for ALL user-facing text in the app.
// Edit texts here without touching any logic or component files.
// Organized by screen/component for easy navigation.
// Supports both Hebrew and English — set DEFAULT_LANGUAGE below.
// ============================================================

// The app auto-detects language from the user's first message.
// This constant controls the UI chrome language (buttons, labels).
// Set to "he" for Hebrew UI, "en" for English UI.
export const DEFAULT_UI_LANGUAGE = "he";

export const UI_STRINGS = {

  // ── App-wide ────────────────────────────────────────────────
  app: {
    name:    { en: "Syncca", he: "Syncca" },
    tagline: { en: "Conscious Love", he: "אהבה מודעת" },
    beta:    { en: "Beta Phase · Secure & Private", he: "גרסת בטא · מאובטח ופרטי" },
  },

  // ── Login / Welcome Screen ──────────────────────────────────
 login: {
    headline:    { en: "The Space for Conscious Love", he: "המרחב שבו האהבה נושמת" },
    line1: { en: "We are here to help you replace", he: "אנחנו כאן כדי לעזור להחליף את מאבקי הכוח שמכבים" },
    line2: { en: "the power struggles that dim love,", he: "יום אחר יום את האהבה, בשפה של תקשורת ישירה" },
    line3: { en: "with mature, direct communication.", he: "ובוגרת, שרואה גם את העצמי וגם את האחר." },
    line4: { en: "", he: "" },
    emailLabel:       { en: "Email", he: "אימייל" },
    emailPlaceholder: { en: "judi@gmail.com", he: "judi@gmail.com" },
    ctaButton:        { en: "Start a Session with Syncca", he: "שניכנס ל״סינק״?" },
    ctaIcon:          { en: "↺", he: "↺" },
    backToLogin:      { en: "Back to home page", he: "חזרה למסך הבית" },
    secureNote:       { en: "Secure & Private Connection", he: "חיבור מאובטח ופרטי" },
  },
  
  // ── Session Start Screen ────────────────────────────────────
  sessionStart: {
    welcomeBack:    { en: "Welcome back to Syncca", he: "ברוכים הבאים לסינקה" },
    instruction:    {
      en: "To start, save your session and get to the insights — we need to log in.",
      he: "כדי להגיע לשיחה איכותית ולשמור על התובנות — נבקש להתחבר."
    },
    saveAndStart:   { en: "Save & Start Session ✦", he: "שמור והתחל שיחה ✦" },
    secureNote:     { en: "Secure & Private Connection", he: "חיבור מאובטח ופרטי" },
  },

  // ── Chat Interface ──────────────────────────────────────────
  chat: {
    inputPlaceholder: { en: "Write here...", he: "כתב/י כאן..." },
    sendButton:       { en: "Send", he: "שלח" },
    sendAriaLabel:    { en: "Send message", he: "שלח הודעה" },
    thinking:         { en: "Syncca is thinking...", he: "סינקה חושבת..." },
    sessionEnded:     { en: "Session complete", he: "השיחה הסתיימה" },

    // Timer display
    timerLabel:     { en: "Session time", he: "זמן שיחה" },
    timerWarning:   { en: "5 minutes remaining", he: "נותרו 5 דקות" },

    // Header bar counters
    syncsLabel:     { en: "Syncs", he: "סינקים" },
    insightsLabel:  { en: "Insights", he: "תובנות" },
    lexLabel:       { en: "Lex.", he: "מונח." },

    // Concept tooltip actions
    saveConceptBtn: { en: "Save to my card ✦", he: "שמור לכרטיס שלי ✦" },
    conceptSaved:   { en: "Saved ✓", he: "נשמר ✓" },
  },

  // ── Personal Card Panel ─────────────────────────────────────
  personalCard: {
    title:           { en: "My Personal Card", he: "הכרטיס האישי שלי" },
    emailLabel:      { en: "Email", he: "אימייל" },
    synccaLabel:     { en: "My Syncca", he: "הסינקה שלי" },

    savedConceptsTitle: { en: "My Saved Concepts", he: "המושגים שלי" },
    noConceptsYet:   {
      en: "No concepts saved yet. Tap [[concept]] in the chat to save.",
      he: "עדיין אין מושגים שמורים. לחצ/י על [[מושג]] בשיחה כדי לשמור."
    },

    feedbackTitle:   { en: "Session Feedback", he: "משוב על השיחה" },
    feedbackPlaceholder: {
      en: "What did you discover today? What felt meaningful?",
      he: "מה גילית היום? מה הרגיש משמעותי?"
    },

    myReflections:   { en: "My reflections", he: "ההרהורים שלי" },
    closePanel:      { en: "Close", he: "סגור" },

    // Airtable sync status
    syncing:         { en: "Saving...", he: "שומר..." },
    syncSuccess:     { en: "Saved ✓", he: "נשמר ✓" },
    syncError:       { en: "Save failed — try again", he: "השמירה נכשלה — נסה שוב" },
  },

  // ── Concept Tooltip ─────────────────────────────────────────
  conceptTooltip: {
    learnMore: { en: "Learn more", he: "למד עוד" },
    close:     { en: "✕", he: "✕" },
  },

  // ── Error States ────────────────────────────────────────────
  errors: {
    apiError:      {
      en: "Something went wrong. Let's try again.",
      he: "משהו השתבש. בוא ננסה שוב."
    },
    sessionExpired: {
      en: "Your session has ended. Thank you for being here.",
      he: "השיחה הסתיימה. תודה שהיית כאן."
    },
    networkError:  {
      en: "Connection issue — please check your internet.",
      he: "בעיית חיבור — בדוק/י את האינטרנט שלך."
    },
  },

  // ── Accessibility ───────────────────────────────────────────
  a11y: {
    openPersonalCard:  { en: "Open Personal Card", he: "פתח כרטיס אישי" },
    closePersonalCard: { en: "Close Personal Card", he: "סגור כרטיס אישי" },
    synccaAvatar:      { en: "Syncca", he: "סינקה" },
    userAvatar:        { en: "You", he: "את/ה" },
    timerArc:          { en: "Session timer", he: "טיימר שיחה" },
  },
};

// ── Helper: get string in current UI language ─────────────────
// Usage: t(UI_STRINGS.chat.inputPlaceholder)
// Returns the string in DEFAULT_UI_LANGUAGE, falls back to "en"
export function t(stringObj) {
  if (!stringObj) return "";
  return stringObj[DEFAULT_UI_LANGUAGE] ?? stringObj["en"] ?? "";
}
