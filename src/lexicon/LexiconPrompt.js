// ============================================================
// lexicon/LexiconPrompt.js
// ROLE: Exports the lexicon in two formats used by SynccaService:
//   1. LEXICON_FOR_SYSTEM_PROMPT — compact text injected into the
//      AI system prompt so Syncca knows when to surface each concept.
//   2. LEXICON_DETECTION_MAP — maps user speech signals to concept
//      English_Term strings for silent background detection.
// Source of truth: syncca-lexicon-seed.json (Airtable import file)
// ============================================================

export const LEXICON_FOR_SYSTEM_PROMPT = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONCEPT REFERENCE LEXICON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL DISPLAY RULES — READ CAREFULLY:
1. Use the English_Term as the identifier inside [[brackets]] in your response.
   The UI will automatically display the correct Hebrew term to the user.
2. When introducing a concept verbally in your sentence, use the EXACT Hebrew_Term
   listed below — do NOT translate, shorten, or invent your own translation.
3. When the tooltip explanation is shown, the UI uses the exact Hebrew_Explanation
   listed below — do NOT paraphrase or summarize it.
4. Surface a concept ONLY when Ladder step rules permit.

── TOXIC PATTERNS ───────────────────────────────────────────
Demand | Hebrew: דרישה
  Hebrew_Explanation: ביטוי כוחני של צורך שמפעיל פחד מסנקציה אצל הפרטנר ומכבה את הקורטקס.
  English_Description: Forceful expression of a need → triggers limbic, fear of sanction.
  Surface when: "always/never", ultimatums, "you have to".

Sanction | Hebrew: סנקציה
  Hebrew_Explanation: תגובה לא נעימה כלפי הפרטנר — ביקורת, פנים כועסות, שתיקה, ריחוק — שמפעילה את המערכת הלימבית ומונעת קשר אמיתי.
  English_Description: Any unpleasant reaction after need is unmet (criticism, silence,
  cold shoulder, eye-roll, raised voice).
  Surface when: user describes punishing reaction, withdrawal after "no".

Counter-Sanction | Hebrew: סנקציה נגדית
  Hebrew_Explanation: סנקציה אחת מפעילה את השנייה — הסלמה לימבית הדדית.
  English_Description: One sanction triggers another → limbic escalation.
  Surface when: fight "got out of hand fast" or "we both said things."

Functional Extension | Hebrew: הארכה פונקציונלית
  Hebrew_Explanation: התייחסות לפרטנר כהמשך של עצמי — לא כאדם נפרד עם עולמו שלו.
  English_Description: Treating partner as an extension of self, not a
  separate person. Believing one's own way is the only right way.
  Surface when: "why can't they just..." / "it's obvious that..."

Hierarchy | Hebrew: היררכיה
  Hebrew_Explanation: דרישות יוצרות מבנה כוח מרומז בזוגיות שווה — ומפעילות פיוס או מלחמה.
  English_Description: Demands create implicit power structure in an equal relationship
  → triggers compliance or war.
  Surface when: "I told them to..." / partner feels controlled.

Compliance | Hebrew: פיוס
  Hebrew_Explanation: פעולה מתוך פחד, לא בחירה — ביצוע חלקי עם טינה שנצברת.
  English_Description: Acting from fear, not choice. Poor execution, resentment.
  Surface when: "I just said fine" / "I do it but I hate it" / heavy sighing.

War Mode | Hebrew: מלחמה
  Hebrew_Explanation: התנגדות פעילה ומאבקי כוח — אף אחד לא מוותר ואין מי שמבצע.
  English_Description: Active resistance, power struggles, mutual threats.
  Surface when: "you're not my boss" / both refusing to budge.

Compliance-War Cycle | Hebrew: מחזור פיוס-מלחמה
  Hebrew_Explanation: טינה שנצברת מפיוס מתפוצצת למלחמה — דפוס חוזר ונשנה.
  English_Description: Resentment from compliance explodes into war.
  Surface when: "I keep it in and then I explode" / pattern of blow-up fights.

Injury Time | Hebrew: זמן הפציעה
  Hebrew_Explanation: שתיקה וריחוק לאחר סנקציה — האהבה רועבת מחוסר חמימות.
  English_Description: Silence/withdrawal after sanction — love starves from lack
  of warmth. Not a neutral pause.
  Surface when: days of silence / sleeping separately / "we didn't speak."

── BIOLOGICAL CONCEPTS ──────────────────────────────────────
Biological Shift | Hebrew: מעבר ביולוגי
  Hebrew_Explanation: המוח פועל ב-3 מצבים — קורטקס, לימבי, זוחלי. הקורטקס יכול לקחת פיקוד.
  English_Description: Brain operates in 3 modes — Cortex, Limbic, Reptilian.
  Cortex can take command.
  Surface when: "why do I react like that?" / "why can't I stop myself?"

Reptilian Brain | Hebrew: מוח הזוחל
  Hebrew_Explanation: מערכת ההישרדות. הצפה של אדרנלין — להילחם, לברוח או לקפוא.
  English_Description: Survival system. Adrenaline flood → fight/flight/freeze.
  Surface when: user describes physical shutdown or overwhelming surge.

Limbic System | Hebrew: מערכת לימבית
  Hebrew_Explanation: המערכת הרגשית-קדומה במוח שמופעלת בתגובה לאיום. כשהיא פעילה, קשה לחשוב בפתיחות ואמפתיה.
  English_Description: Impulse-driven, hyper-vigilant, self-preservation.
  May attack or withdraw to reduce anxiety.
  Surface when: explaining why user or partner "can't think straight."

Cortex | Hebrew: קורטקס
  Hebrew_Explanation: מערכת החשיבה הרציונלית. כשאין פחד מסנקציות, הקורטקס יכול לשקול בקשות בצורה פתוחה ואוהבת.
  English_Description: Rational brain. Processes, regulates, sees both self and other.
  Surface when: user shows reflective capacity — name and reinforce it.

── CLEAN REQUEST FRAMEWORK ──────────────────────────────────
Clean Request | Hebrew: בקשה נקייה
  Hebrew_Explanation: בקשה שמשאירה לפרטנר חופש בחירה אמיתי — ללא לחץ, ללא ציפייה מובלעת, ומתוך הכנה לתשובה שלילית.
  English_Description: Express need directly, grant partner total freedom to
  choose yes or no. Keeps listener in cortex.
  Surface at STEP 6 ONLY — never before.

Separateness | Hebrew: נפרדות
  Hebrew_Explanation: הפרטנר הוא ישות נפרדת עם עולם פנימי, רצונות ולוח זמנים משלו — יכולת קורטיקלית חיובית.
  English_Description: Partner is a distinct entity with their own inner world,
  desires, and timeline. This is a POSITIVE, CORTICAL capacity —
  it is a destination, not a symptom.
  Surface at Step 5 ONLY when user shows genuine empathy for partner.
  NEVER surface when user says "they should know" or "they owe me" —
  those are Functional Extension signals, the opposite of Separateness.

Separateness Recognition | Hebrew: הכרה בנפרדות
  Hebrew_Explanation: הכרה פעילה בכך שהצורך שלי הוא הפרעה לזרימה הטבעית של הפרטנר — והוא לא חייב לי כן.
  English_Description: Actively acknowledging that my need is an
  interruption to my partner's natural flow; they are not obligated.
  Surface as component 1 of Clean Request (Step 6 only).
  Only when user is APPLYING this insight, not struggling against it.

Plan B | Hebrew: תוכנית ב
  Hebrew_Explanation: לקיחת אחריות אישית אמיתית על הצורך שלי אם הפרטנר יגיד לא — ממקום של שלום פנימי, לא מתסכול.
  English_Description: Taking genuine personal responsibility for my need if partner
  says no. Must come from a CALM, ACCEPTING place — not resentment.
  WARNING: "I'll just do it myself" said with frustration is NOT Plan B
  — it is unhealthy withdrawal (Compliance-War Cycle).
  Surface as component 2 of Clean Request (Step 6 only).

Zero-Sanction Policy | Hebrew: אפס סנקציות
  Hebrew_Explanation: מחויבות פנימית אמיתית לקבל 'לא' ללא שום תגובה מעניישת — לא רק מבחוץ, אלא גם רגשית.
  English_Description: Genuine internal commitment to accept "no" without
  any punishing reaction — not just externally, but emotionally.
  Surface as component 3 — the hardest one.

Request Test | Hebrew: מבחן הבקשה
  Hebrew_Explanation: בקשה נקייה נבחנת על פי מה שקורה אחרי 'לא'. אם הגיעה סנקציה — הייתה זו דרישה בתחפושת.
  English_Description: A clean request is judged by what happens after "no".
  If a sanction follows — it was a demand in disguise.
  Surface when: "I asked nicely but..." followed by punishing reaction.

── OUTCOMES ─────────────────────────────────────────────────
Yes Logic | Hebrew: כן שבא מאהבה
  Hebrew_Explanation: כשאין פחד מסנקציות, המאזין נשאר בקורטקס ויכול לומר כן מתוך בחירה חופשית ואהבה.
  English_Description: Free from fear → listener stays in cortex → genuine "yes"
  as an act of love.

No Logic | Hebrew: לא שבא מהגנה עצמית
  Hebrew_Explanation: 'לא' הוא הגנה לגיטימית על משאבים וערכים — גבול, לא דחיית אהבה.
  English_Description: "No" is legitimate protection of resources/values. A boundary,
  not a rejection of love.
  Surface when user fears "no" means "they don't love me."

Yes Bonus: Yes to clean request = need met + feeling seen and loved
  + quality execution.

No Value: Accepting "no" protects partner's well-being, prevents burnout,
  creates long-term freedom.
  Surface when user resists accepting "no."

── COMMUNICATION SKILLS ─────────────────────────────────────
Needs Responsiveness: Being attentive and responsive — foundation of love.

Affirmative Communication: Warm, respectful, appreciative communication
  + ability to have deep meaningful conversations.

Bonding Actions: Intentional shared joy — intimacy, play, shared experiences.

Communicate A Need: Express need as clean request not complaint.
  If unmet over time → invite Deep Dialogue.

Holding Environment | Hebrew: מרחב מחזיק
  Hebrew_Explanation: מרחב רגשי בטוח לקושי ולפגיעות — ללא פחד מדחייה או הסלמה.
  English_Description: Safe emotional space for difficulty/vulnerability
  without fear of rejection or escalation.
  Surface at Step 1 to name what Syncca is offering.

Deep Dialogue | Hebrew: דיאלוג עמוק
  Hebrew_Explanation: מדבר משתף ללא האשמה; מאזין משקף באמפתיה לפני שמגיב.
  English_Description: Structured: speaker shares without blame; listener
  reflects with empathy before responding.
  Surface as practical tool when a pattern keeps repeating.

Reframing | Hebrew: מסגור מחדש
  Hebrew_Explanation: זיהוי הצורך החיובי מאחורי הכעס של הפרטנר — ומתן שם לו בכבוד.
  English_Description: Identify positive need behind partner's anger; name it
  with respect → they feel seen → can release anger.
  Surface at Steps 4-5 to shift perspective on partner.

Self-Reframing | Hebrew: מסגור עצמי מחדש
  Hebrew_Explanation: זיהוי שורש הכעס שלי (כאב, פחד, ערך) וביטוי הפגיעות במקום להטיח כעס כלפי חוץ.
  English_Description: Identify root of own anger (pain/fear/value) and
  express that vulnerability instead of projecting anger outward.
  Surface when user is stuck in blame.

Healing Apology | Hebrew: התנצלות מרפאת
  Hebrew_Explanation: הכרה בנזק, אימות רגשות הפרטנר, מחויבות לשינוי מעשי.
  English_Description: Acknowledge harm, validate partner's feelings,
  commit to practical change.
  Surface when user wants to repair after rupture.
`;

export const LEXICON_DETECTION_MAP = {
  // ── Demand ───────────────────────────────────────────────
  "you always":             "Demand",
  "you never":              "Demand",
  "you have to":            "Demand",
  "why can't you just":     "Demand",
  "i told them to":         "Demand",
  "they have to":           "Demand",
  "has to be done":         "Demand",

  // ── Sanction ─────────────────────────────────────────────
  "i went quiet":           "Sanction",
  "i didn't speak":         "Sanction",
  "i gave them the look":   "Sanction",
  "i walked away":          "Sanction",
  "cold shoulder":          "Sanction",
  "i stopped talking":      "Sanction",
  "kept score":             "Sanction",
  "reminded them of":       "Sanction",
  "i said fine":            "Sanction",
  "gave them a look":       "Sanction",

  // ── Injury Time ──────────────────────────────────────────
  "we didn't speak":        "Injury Time",
  "days of silence":        "Injury Time",
  "sleeping separately":    "Injury Time",
  "we ignored each other":  "Injury Time",
  "not talking":            "Injury Time",

  // ── Compliance ───────────────────────────────────────────
  "i just said okay":       "Compliance",
  "i did it but":           "Compliance",
  "i gave in":              "Compliance",
  "to avoid a fight":       "Compliance",
  "i don't bother":         "Compliance",
  "just to keep the peace": "Compliance",

  // ── War Mode ─────────────────────────────────────────────
  "you're not my boss":     "War Mode",
  "stop telling me":        "War Mode",
  "we both exploded":       "War Mode",
  "it escalated":           "War Mode",
  "screaming":              "War Mode",
  "shouting":               "War Mode",

  // ── Compliance-War Cycle ──────────────────────────────────
  "i keep it in":           "Compliance-War Cycle",
  "then i explode":         "Compliance-War Cycle",
  "happens over and over":  "Compliance-War Cycle",
  "same fight again":       "Compliance-War Cycle",

  // ── Functional Extension ──────────────────────────────────
  // These signal the ABSENCE of Separateness — entitlement,
  // assumed shared expectations, treating partner as an extension.
  "it's obvious":              "Functional Extension",
  "anyone would know":         "Functional Extension",
  "why don't they get it":     "Functional Extension",
  "the right way to":          "Functional Extension",
  "they should know":          "Functional Extension",   // ← corrected from Separateness
  "i expected them to":        "Functional Extension",   // ← corrected from Separateness
  "they owe me":               "Functional Extension",   // ← corrected from Separateness
  "why don't they understand": "Functional Extension",

  // ── Compliance-War Cycle (unhealthy pseudo-Plan B) ────────
  // "I'll do it myself" out of resentment or learned helplessness
  // is NOT healthy Plan B — it signals withdrawal and distance.
  "i'll just do it myself":    "Compliance-War Cycle",   // ← corrected from Plan B
  "what's the point asking":   "Compliance-War Cycle",   // ← corrected from Plan B
  "no point in asking":        "Compliance-War Cycle",   // ← corrected from Plan B
  "they'll say no anyway":     "Compliance-War Cycle",

  // ── Separateness (Cortical — Step 5 only) ────────────────
  // Only surface when the user is APPLYING the concept,
  // not struggling against its absence.
  "i realize they're different":  "Separateness",
  "they have their own world":    "Separateness",
  "it's not about me":            "Separateness",
  "they see it differently":      "Separateness",

  // ── Separateness Recognition (Clean Request — Step 6) ────
  // Only surface when user is actively preparing a Clean Request.
  "i know i'm interrupting":      "Separateness Recognition",
  "it's my need, not theirs":     "Separateness Recognition",
  "they don't owe me a yes":      "Separateness Recognition",

  // ── Healthy Plan B (Cortical — Step 6) ───────────────────
  // Only surface when user is genuinely at peace with "no".
  "if they say no i'll":          "Plan B",
  "i have a backup":              "Plan B",
  "i can handle it myself":       "Plan B",   // tone: calm, not resentful

  // ── Biological Bridge ─────────────────────────────────────
  "why do i react":            "Biological Shift",
  "i can't stop myself":       "Biological Shift",
  "i froze":                   "Reptilian Brain",
  "my heart was pounding":     "Limbic System",
  "i couldn't think":          "Limbic System",
  "i calmed down later":       "Cortex",
  "when i think about it":     "Cortex",
  "in retrospect":             "Cortex",

  // ── Repair ───────────────────────────────────────────────
  "i want to apologize":    "Healing Apology",
  "i hurt them":            "Healing Apology",
  "we need to talk":        "Deep Dialogue",
  "i need to tell them":    "Communicate A Need",
  "want to repair":         "Healing Apology",
};
