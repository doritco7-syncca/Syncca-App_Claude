// App.jsx — Syncca · Main Application Router
// Built from the production version with full Airtable logging added.
// Screen flow: welcome → login → chat ↔ personal

import { useState, useEffect, useCallback, useRef } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen   from "./components/LoginScreen";
import ChatScreen    from "./components/ChatScreen";
import PersonalCard  from "./components/PersonalCard";
import HistoryScreen from "./components/HistoryScreen";
import {
  findOrCreateUser, findUserByEmail, incrementSyncCount,
  updateUserProfile, updateSavedConcepts, overwriteSavedConcepts,
  createSessionLog, syncSession, saveFeedback, finalizeSession,
  fetchLexicon, fetchPreviousConcepts, fetchFullHistory,
} from "./AirtableService";
import { sendToSyncca, parseResponse, SYNCCA_OPENING_MESSAGE, generateSessionInsight } from "./SynccaService";

// Install Airtable request logger — remove before production

// ─── Beta modal: show only on first 2 sessions ───────────────────
function shouldShowBetaModal(email) {
  const key = `syncca_beta_seen_${email}`;
  if (localStorage.getItem(key)) return false;
  localStorage.setItem(key, "1");
  return true;
}

// ─── Dynamic opening message ─────────────────────────────────────
// syncCount: value AFTER incrementing. First session = 1.
function getOpeningMessage(syncCount, firstName, gender) {
  if (!syncCount || syncCount <= 1) return SYNCCA_OPENING_MESSAGE["he"];
  const name   = firstName ? ` ${firstName}` : "";
  const isFem  = gender === "Female" || gender === "אישה";
  const action = isFem ? "תרצי" : "תרצה";
  return `היי${name}, טוב לראות אותך שוב 🙏\nעל מה ${action} לעבוד היום?`;
}

// ─── Parse [[bracket]] concepts from AI response ─────────────────
// Looks up each term in the live lexicon; returns cleanText + concepts[].
// Strip Hebrew definite article ה from each word for fuzzy matching.
// Handles cases like [[המערכת הלימבית]] where Syncca adds ה naturally.
function stripHeDefiniteArticle(term) {
  return term.split(" ").map(w => w.startsWith("ה") && w.length > 2 ? w.slice(1) : w).join(" ");
}

function parseBracketConcepts(text, conceptLexicon) {
  const concepts = [];
  const cleanText = text.replace(/\[\[([^\]]+)\]\]/g, (_, term) => {
    const t = term.trim();
    const stripped = stripHeDefiniteArticle(t);

    // Match priority:
    // 1. exact englishTerm
    // 2. exact Hebrew word
    // 3. stripped (remove ה) Hebrew word
    // 4. alias match (exact or stripped)
    // 5. partial word match
    const entry =
      conceptLexicon.find(c => c.englishTerm === t) ||
      conceptLexicon.find(c => c.word === t) ||
      conceptLexicon.find(c => c.word === stripped) ||
      conceptLexicon.find(c =>
        c.aliases?.some(a => a === t || a === stripped ||
          stripHeDefiniteArticle(a) === t || stripHeDefiniteArticle(a) === stripped)
      ) ||
      conceptLexicon.find(c =>
        t.includes(c.word) || stripped.includes(c.word) || c.word.includes(stripped)
      );

    concepts.push({
      englishTerm: entry?.englishTerm || t,
      word:        entry?.word        || t,
      explanation: entry?.explanation || "",
    });
    return entry?.word || t; // always show canonical Hebrew term in chat
  });
  return { cleanText, concepts };
}

// ─── Fallback lexicon (used only if Airtable fetch fails) ────────
// Contains ALL core methodology terms. When live Airtable fetch works,
// these are replaced by the richer Airtable descriptions.
const FALLBACK_LEXICON = [
  { englishTerm: "Limbic System",        word: "מערכת לימבית",         explanation: "המערכת הרגשית-קדומה במוח שמופעלת בתגובה לאיום. כשהיא פעילה, אנחנו בהישרדות — קשה לחשוב בצורה פתוחה, להקשיב, או להרגיש אמפתיה." },
  { englishTerm: "Cortex",               word: "קורטקס",               explanation: "מערכת החשיבה הרציונלית והאמפתית. כשהלימבי רגוע, הקורטקס יכול לשקול בקשות בצורה פתוחה ואוהבת." },
  { englishTerm: "Biological Shift",     word: "הסטה ביולוגית",        explanation: "הרגע שבו המוח עובר משליטת הקורטקס לשליטת המערכת הלימבית — בדרך כלל בגלל תחושת איום, ביקורת, או סנקציה." },
  { englishTerm: "Reptilian Brain",      word: "מוח זוחלי",            explanation: "השכבה הקדומה ביותר במוח — אחראית על הישרדות בסיסית: לחימה, בריחה, קיפאון." },
  { englishTerm: "Injury Time",          word: "זמן פציעות",           explanation: "תקופה של ריחוק וקור אחרי סנקציה — כשהאהבה 'מורעבת' מחמת היעדר חמימות וקרבה." },
  { englishTerm: "Sanction",             word: "סנקציה",               explanation: "כל תגובה לא נעימה כלפי הפרטנר כשצורך לא נענה: ביקורת, שתיקה, פנים כועסות, ריחוק, מילים פוגעות. הסנקציה מפעילה את המערכת הלימבית של הצד השני ומונעת קשר אמיתי." },
  { englishTerm: "Demand",               word: "דרישה",                explanation: "ביטוי כוחני של צורך, עם ציפייה שהפרטנר ייענה לו — ולרוב עם סנקציה מובלעת אם לא ייענה. דרישה יוצרת התנגדות כי היא פוגעת באוטונומיה." },
  { englishTerm: "Appeasement",          word: "ריצוי",                explanation: "תגובה לדרישה מתוך פחד מסנקציה — לא מבחירה. מוביל לביצוע עלוב, טינה מצטברת, ותחושת 'אני לא נראה/ת'." },
  { englishTerm: "War Mode",             word: "מלחמה",                explanation: "דפוס שבו שני הפרטנרים מגנים על עצמם ונלחמים על שליטה — אף אחד לא מוותר, צרכים לא נענים." },
  { englishTerm: "Hierarchy",            word: "היררכיה",              explanation: "כשאחד הפרטנרים מתנהג כאילו הוא 'הבוס' — דורש, מצפה, מסנקציה. בזוגיות שוויונית זה יוצר התנגדות מיידית." },
  { englishTerm: "Extension Arm",        word: "שלוחת ביצוע",          explanation: "להתייחס לפרטנר כאילו הוא כלי לספק את הצרכים שלי — ולא כאדם נפרד עם עולם משלו." },
  { englishTerm: "Separateness",         word: "נפרדות",               explanation: "ההכרה שהפרטנר הוא ישות נפרדת לחלוטין, עם עולמו הפנימי, צרכיו, ותזמונו שלו. הנפרדות היא תנאי לאהבה בריאה — לא מכשול לה." },
  { englishTerm: "Holding",              word: "החזקה",                explanation: "להישאר נוכח ולהכיל את המרחב הרגשי של הפרטנר — בלי לתקן, לפתור, או לנתח. פשוט להיות שם." },
  { englishTerm: "Interference",         word: "הפרעה",                explanation: "הכרה בכך שכשאני מגיש/ה בקשה, אני מפריע/ה לזרימה הטבעית של הפרטנר. ההכרה הזו היא הבסיס לבקשה נקייה." },
  { englishTerm: "Plan B",               word: "תכנית ב",              explanation: "דרך עצמאית לספק את הצורך שלי אם הפרטנר יגיד לא — שמאפשרת לי לבקש בלי לחץ ובלי ציפייה." },
  { englishTerm: "Clean Request",        word: "בקשה נקייה",           explanation: "ביטוי ישיר של צורך שמשאיר לפרטנר חופש בחירה אמיתי — ללא לחץ, ללא ציפייה מובלעת, ומתוך הכנה לתשובה שלילית. מורכבת משלושה תנאים: הכרה בהפרעה, תכנית ב, ואפס סנקציות." },
  { englishTerm: "Zero-Sanction Policy", word: "אפס סנקציות",          explanation: "הסכמה פנימית — לא הבטחה לפרטנר — לא להגיב בסנקציה אם הוא/היא יגיד לא לבקשה. זה מה שיוצר את הביטחון שמאפשר 'כן' מרצון." },
  { englishTerm: "Yes From Love",        word: "כן שבא מאהבה",        explanation: "כשאין פחד מסנקציה, ה'כן' של הפרטנר בא מרצון אמיתי ואהבה — לא מחובה, פחד, או רצון להשכיך מתח." },
  { englishTerm: "No From Self-Protection", word: "לא שבא מהגנה עצמית", explanation: "לא שמגיע מתוך שמירה על הצרכים, הערכים, או הגבולות שלי — ולא מנקמה או סירוב עקרוני." },
  { englishTerm: "Compliance-War Cycle", word: "מחזור ריצוי-מלחמה",   explanation: "הדפוס שבו ריצוי מצטבר לטינה שמתפוצצת למלחמה — ואז חוזרים לריצוי. מעגל שמתקשה לשבור ללא כלים חדשים." },
];

// ─── Timeout modal ────────────────────────────────────────────────
function TimeoutModal({ onClose, logRecordId }) {
  const [feedback, setFeedback] = useState("");
  const [sent,     setSent]     = useState(false);

  async function handleSendFeedback() {
    if (logRecordId && feedback.trim()) {
      saveFeedback(logRecordId, feedback.trim()).catch(e => console.warn("saveFeedback:", e));
    }
    setSent(true);
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(117,117,117,0.15)",
                  display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
      <div style={{ background:"#F9F6EE", borderRadius:"24px",
                    border:"1.5px solid rgba(117,117,117,0.12)",
                    padding:"28px 24px", maxWidth:"380px", width:"100%", direction:"rtl",
                    boxShadow:"0 8px 40px rgba(0,0,0,0.12)" }}>
        {!sent ? (
          <>
            <div style={{ fontFamily:"'Alef',sans-serif", fontSize:"1.2rem", fontWeight:700,
                          color:"#757575", marginBottom:"10px", textAlign:"center" }}>
              זמן השיחה הסתיים 🙏
            </div>
            <p style={{ fontFamily:"'Alef',sans-serif", fontSize:"0.88rem", color:"#374151",
                        lineHeight:1.7, marginBottom:"18px", textAlign:"center" }}>
              30 דקות של עבודה אמיתית. כל תובנה שעלתה היום — שייכת לך.
              נשמח לשמוע מה חשבת.
            </p>
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
              placeholder="מה עזר? מה אפשר לשפר?"
              style={{ width:"100%", height:"80px", border:"1.5px solid rgba(117,117,117,0.2)",
                       borderRadius:"12px", padding:"12px", fontFamily:"'Alef',sans-serif",
                       fontSize:"0.88rem", background:"white", resize:"none", outline:"none",
                       direction:"rtl", boxSizing:"border-box", lineHeight:1.6 }} />
            <button onClick={handleSendFeedback} style={{ marginTop:"12px", width:"100%", height:"34px",
              background:"#C62828", color:"white", border:"none", borderRadius:"9999px",
              fontFamily:"'Alef',sans-serif", fontWeight:700, fontSize:"0.95rem", cursor:"pointer" }}>
              שלח פידבק וסיים
            </button>
          </>
        ) : (
          <div style={{ textAlign:"center", padding:"12px 0" }}>
            <div style={{ fontSize:"1.5rem", marginBottom:"10px" }}>✦</div>
            <div style={{ fontFamily:"'Alef',sans-serif", fontSize:"1rem", fontWeight:700,
                          color:"#16a34a", marginBottom:"6px" }}>תודה!</div>
            <div style={{ fontFamily:"'Alef',sans-serif", fontSize:"0.88rem", color:"#374151",
                          lineHeight:1.6 }}>
              נתראה בסינק הבא.
            </div>
          </div>
        )}
        <button onClick={onClose} style={{ marginTop:"10px", width:"100%", height:"30px",
          background:"transparent", color:"#6b7280", border:"1px solid #E5E0D8",
          borderRadius:"9999px", fontFamily:"'Alef',sans-serif", fontSize:"0.9rem", cursor:"pointer" }}>
          סגירה
        </button>
      </div>
    </div>
  );
}

// ─── Beta modal ───────────────────────────────────────────────────
function BetaModal({ onClose }) {
  const items = [
    "סינקה היא המקום שלך כשעולה רצון להבין קצת יותר, ללמוד או ליצור שינוי בתקשורת הבין אישית שלך. היא מבוססת על ידע וניסיון של שנים בליווי זוגות ומשפחות, ונועדה לעזור לך לזהות ולהבין דפוסי תקשורת שעלולים לחנוק את האהבה — ולגלות איך משתחררים מהם..",
    "במהלך השיחה עם סינקה, יתכן שהיא תציע לך מושגים רלבנטים. הם מיועדים לעזור לנו לתת מילים למה שקורה לכולנו בפנים. ניתן להרחיב אותם (על ידי לחיצה), ואף לשמור אותם בכרטיס האישי שלך (שנמצא בראש הצ'אט).",
    "כל שיחה מוגבלת ל-30 דקות כדי לאפשר זמן ממוקד לעיבוד והתבוננות.",
    "בסוף השיחה נשמח לפידבק, זה עוזר לנו להשתפר.",
  ];
  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(117,117,117,0.18)",
                  display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
      <div style={{ background:"#F9F6EE", borderRadius:"24px", padding:"28px 24px",
                    maxWidth:"390px", width:"100%", direction:"rtl", boxShadow:"0 8px 40px rgba(0,0,0,0.15)" }}>
        <div style={{ fontFamily:"'Alef',sans-serif", fontSize:"1.15rem", fontWeight:700,
                      color:"#757575", marginBottom:"16px", textAlign:"center" }}>טוב שהגעת לסינקה 👋</div>
        <ol style={{ paddingRight:"18px" }}>
          {items.map((item, i) => (
            <li key={i} style={{ fontFamily:"'Alef',sans-serif", fontSize:"0.86rem",
                                 lineHeight:1.65, marginBottom:"10px", color:"#1a1a1a" }}>{item}</li>
          ))}
        </ol>
        <button onClick={onClose} style={{ marginTop:"18px", width:"100%", height:"36px",
          background:"#C62828", color:"white", border:"none", borderRadius:"9999px",
          fontFamily:"'Alef',sans-serif", fontWeight:700, fontSize:"1rem", cursor:"pointer" }}>
          הבנתי, אפשר להתחיל ✦
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,    setScreen]    = useState("welcome");
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("syncca_email") || "");
  const [userRecord,setUserRecord]= useState(null);
  const [recordId,  setRecordId]  = useState(() => localStorage.getItem("syncca_record_id") || "");

  const [messages,         setMessages]         = useState([]);
  const [chatLang,         setChatLang]         = useState("he"); // "he" | "en"
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [savedConcepts,    setSavedConcepts]    = useState([]);
  const [isLoading,        setIsLoading]        = useState(false);
  const [conceptLexicon,   setConceptLexicon]   = useState(FALLBACK_LEXICON);

  const [showBetaModal,    setShowBetaModal]    = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);

  // ── Refs — authoritative values, never stale across navigation ──
  const logRecordIdRef         = useRef(null);
  const fullTranscriptRef      = useRef("");
  const conceptsIntroducedRef  = useRef([]); // Hebrew words surfaced this session
  const previousConceptsRef    = useRef([]); // from all prior sessions
  const sessionHistoryRef      = useRef([]); // last 5 sessions with dates/concepts/feedback
  const savedConceptsRef       = useRef([]); // mirrors savedConcepts state

  // Keep savedConceptsRef in sync with state
  useEffect(() => { savedConceptsRef.current = savedConcepts; }, [savedConcepts]);

  const firstName = userRecord?.First_Name || "";

  // ── Fetch live lexicon on mount ──────────────────────────────
  useEffect(() => {
    fetchLexicon()
      .then(entries => {
        if (entries?.length > 0) {
          // For any Airtable entry missing Description_HE, fill in from FALLBACK_LEXICON.
          // This covers the 15 concepts that have no description in Airtable yet.
          const merged = entries.map(entry => {
            if (entry.explanation) return entry;
            const fb = FALLBACK_LEXICON.find(
              f => f.englishTerm === entry.englishTerm || f.word === entry.word
            );
            return fb?.explanation ? { ...entry, explanation: fb.explanation } : entry;
          });
          const withExpl = merged.filter(e => e.explanation).length;
          console.log(`[Lexicon] ${merged.length} concepts, ${withExpl} with explanations (${merged.length - withExpl} still missing)`);
          setConceptLexicon(merged);
          // Re-hydrate saved concepts with real explanations now that lexicon is loaded
          setSavedConcepts(prev => prev.map(c => {
            const match = merged.find(e =>
              e.englishTerm === c.englishTerm || e.word === c.word
            );
            return match ? { ...c, word: match.word, explanation: match.explanation } : c;
          }));
        }
      })
      .catch(e => console.warn("[Lexicon] Using fallback:", e));
  }, []);

  // ── Auto-navigate returning user (has email + recordId in localStorage) ──
  useEffect(() => {
    if (!userEmail || !recordId) return;
    (async () => {
      try {
        const result = await findUserByEmail(userEmail);
        if (result?.fields) {
          setUserRecord(result.fields);
          // Restore saved concepts wallet from Airtable
          const saved = (result.fields.Saved_Concepts || "")
            .split(",").map(s => s.trim()).filter(Boolean)
            .map(w => ({ word: w, englishTerm: w, explanation: "" }));
          if (saved.length) setSavedConcepts(saved);
        }

        // Load prior session concepts + history for memory injection
        const prev = await fetchPreviousConcepts(recordId);
        previousConceptsRef.current = prev;
        const username = result?.fields?.Username || recordId;
        const history = await fetchFullHistory(username, 10);
        sessionHistoryRef.current = history;
        console.log("[Memory] Previous concepts:", prev);
        console.log("[Memory] Session history:", history.length, "sessions");

        // Create fresh session log
        const logId = await createSessionLog(recordId);
        logRecordIdRef.current        = logId;
        fullTranscriptRef.current     = "";
        conceptsIntroducedRef.current = [];

        setSessionStartTime(new Date());
        const syncCount = result?.fields?.Sync_Count || 2;
        setMessages([{
          role: "syncca", concepts: [], timestamp: new Date().toISOString(),
          text: getOpeningMessage(syncCount, result?.fields?.First_Name || "", result?.fields?.Gender || ""),
        }]);
        setScreen("chat");
      } catch (e) { console.error("[AutoNav]", e); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── LOGIN ─────────────────────────────────────────────────────
  async function handleLogin(email) {
    const { recordId: rid, fields } = await findOrCreateUser(email);
    if (!rid) throw new Error("לא ניתן למצוא או ליצור משתמש");

    setUserEmail(email);
    setUserRecord(fields);
    setRecordId(rid);
    localStorage.setItem("syncca_email",     email);
    localStorage.setItem("syncca_record_id", rid);

    // Restore saved concepts wallet
    const saved = (fields.Saved_Concepts || "")
      .split(",").map(s => s.trim()).filter(Boolean)
      .map(w => ({ word: w, englishTerm: w, explanation: "" }));
    if (saved.length) setSavedConcepts(saved);

    // Increment sync count — result tells us new vs returning
    const newSyncCount = await incrementSyncCount(rid, fields.Sync_Count || 0);

    // Load prior concepts + history for memory
    const prev = await fetchPreviousConcepts(rid).catch(() => []);
    previousConceptsRef.current = prev;
    const history = await fetchFullHistory(fields.Username || rid, 10).catch(() => []);
    sessionHistoryRef.current = history;
    console.log("[Memory] Previous concepts loaded:", prev);
    console.log("[Memory] Session history loaded:", history.length, "sessions");

    // Create session log FIRST — we need logId before first message
    const logId = await createSessionLog(rid).catch(() => null);
    logRecordIdRef.current        = logId;
    fullTranscriptRef.current     = "";
    conceptsIntroducedRef.current = [];
    console.log("[Login] logRecordId:", logId);

    setSessionStartTime(new Date());
    setMessages([{
      role: "syncca", concepts: [], timestamp: new Date().toISOString(),
      text: getOpeningMessage(newSyncCount, fields.First_Name || "", fields.Gender || ""),
    }]);

    if (shouldShowBetaModal(email)) setShowBetaModal(true);
    setScreen("chat");
  }

  // ── SEND MESSAGE ───────────────────────────────────────────
  // ONE syncSession call per exchange — after full exchange completes.
  // No double-call race condition. Errors are awaited and logged.
  const handleSend = useCallback(async (text) => {
    const currentLogId = logRecordIdRef.current;
    if (!currentLogId) {
      console.error("[handleSend] logRecordId is null — session log was not created");
    }

    const userMsg         = { role: "user", text, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    // Detect language from first user message (Hebrew chars = he, else en)
    if (messages.filter(m => m.role === "user").length === 0) {
      const isHebrew = /[\u05D0-\u05EA]/.test(text);
      setChatLang(isHebrew ? "he" : "en");
    }

    setIsLoading(true);

    // Append user message to transcript ref immediately (no Airtable call yet)
    const transcriptBeforeAI = fullTranscriptRef.current
      ? fullTranscriptRef.current + "\n[User]: " + text
      : "[User]: " + text;
    fullTranscriptRef.current = transcriptBeforeAI;

    try {
      // ── Build API history — skip the opening message ──────────────
      const apiMessages = updatedMessages
        .filter((m, i) => !(m.role === "syncca" && i === 0))
        .map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));

      const elapsed = sessionStartTime
        ? Math.floor((Date.now() - new Date(sessionStartTime).getTime()) / 60000)
        : 0;

      // ── Call AI ───────────────────────────────────────────────────
      const rawResponse = await sendToSyncca(
        apiMessages, elapsed, conceptLexicon, previousConceptsRef.current, userRecord || {}, sessionHistoryRef.current
      );
      const { visibleText } = parseResponse(rawResponse);

      // ── Parse [[bracket]] concepts ────────────────────────────────
      const { cleanText, concepts } = parseBracketConcepts(visibleText, conceptLexicon);
      console.log("[handleSend] parsed concepts:", concepts.map(c => c.word));

      // ── Accumulate concepts this session ──────────────────────────
      if (concepts.length > 0) {
        const newWords = concepts
          .map(c => c.word || c.englishTerm)
          .filter(w => w && !conceptsIntroducedRef.current.includes(w));
        if (newWords.length > 0) {
          conceptsIntroducedRef.current = [...conceptsIntroducedRef.current, ...newWords];
          console.log("[handleSend] new concepts accumulated:", newWords);
          console.log("[handleSend] total session concepts:", conceptsIntroducedRef.current);
        }
      }

      // ── Update transcript with Syncca's response ──────────────────
      const fullTranscript = transcriptBeforeAI + "\n[Syncca]: " + cleanText;
      fullTranscriptRef.current = fullTranscript;

      setMessages(prev => [...prev, {
        role: "syncca", text: cleanText, concepts,
        timestamp: new Date().toISOString(),
      }]);

      // ── ONE syncSession call with full data ───────────────────────
      if (currentLogId) {
        try {
          await syncSession({
            logRecordId:      currentLogId,
            fullTranscript,
            conceptsSurfaced: conceptsIntroducedRef.current,
          });
          console.log("[handleSend] ✓ syncSession complete. concepts:", conceptsIntroducedRef.current);
        } catch (syncErr) {
          console.error("[handleSend] syncSession failed:", syncErr);
        }
      }

    } catch (err) {
      console.error("[handleSend] AI error:", err);
      // Save whatever transcript we have even if AI failed
      if (currentLogId) {
        syncSession({ logRecordId: currentLogId, fullTranscript: transcriptBeforeAI })
          .catch(e => console.error("[handleSend] emergency sync failed:", e));
      }
      setMessages(prev => [...prev, {
        role: "syncca", text: "מצטערת, הייתה תקלה טכנית. נסי שוב.",
        concepts: [], timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, sessionStartTime, conceptLexicon]);

  // ── SAVE CONCEPT (user clicks ✦ in tooltip) ──────────────────
  // Airtable call is OUTSIDE setState to avoid StrictMode double-fire.
  function handleSaveConcept(concept) {
    const current = savedConceptsRef.current;
    if (current.find(c => c.word === concept.word)) return; // already saved
    const updated = [...current, concept];
    setSavedConcepts(updated);

    // Write to Users.Saved_Concepts — atomic GET+merge in AirtableService
    if (recordId) {
      const words = updated.map(c => c.englishTerm || c.word).filter(Boolean);
      console.log("[handleSaveConcept] writing to Airtable:", words, "recordId:", recordId);
      updateSavedConcepts(recordId, words)
        .then(() => console.log("[handleSaveConcept] ✓ Airtable updated:", words))
        .catch(e => console.error("[handleSaveConcept] ✗ failed:", e));
    } else {
      console.error("[handleSaveConcept] recordId is null — cannot save");
    }
  }

  function handleDeleteConcept(concept) {
    const updated = savedConceptsRef.current.filter(c => c.word !== concept.word);
    setSavedConcepts(updated);
    if (recordId) {
      const words = updated.map(c => c.englishTerm || c.word).filter(Boolean);
      overwriteSavedConcepts(recordId, words)
        .catch(e => console.error("[handleDeleteConcept] ✗ failed:", e));
    }
  }

  // ── FINALIZE SESSION (generate insight + save) ────────────────
  async function handleFinalizeSession() {
    const logId      = logRecordIdRef.current;
    const concepts   = conceptsIntroducedRef.current;
    if (!logId) return;

    // Build transcript: use ref if available, else reconstruct from messages state
    let transcript = fullTranscriptRef.current;
    if (!transcript && messages.length > 1) {
      transcript = messages
        .filter(m => m.role === "user" || m.role === "syncca")
        .map(m => `[${m.role === "user" ? "User" : "Syncca"}]: ${m.text}`)
        .join("\n");
    }
    if (!transcript) return; // truly empty session — nothing to save

    try {
      const insight = await generateSessionInsight(transcript, concepts);
      await finalizeSession({
        logRecordId:      logId,
        fullTranscript:   transcript,
        conceptsSurfaced: concepts,
        sessionStartTime: sessionStartTime || null,
        sessionInsight:   insight,
      });
    } catch (e) {
      console.warn("[handleFinalizeSession] failed:", e);
    }
  }

  // ── LOGOUT ────────────────────────────────────────────────────
  function handleLogout() {
    handleFinalizeSession(); // fire-and-forget
    localStorage.removeItem("syncca_email");
    localStorage.removeItem("syncca_record_id");
    setUserEmail(""); setRecordId(""); setUserRecord(null);
    setMessages([]); setSavedConcepts([]);
    logRecordIdRef.current        = null;
    fullTranscriptRef.current     = "";
    conceptsIntroducedRef.current = [];
    previousConceptsRef.current   = [];
    sessionHistoryRef.current     = [];
    setScreen("welcome");
  }

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <>
      {screen === "welcome" && (
        <WelcomeScreen
          userEmail={userEmail}
          onEnter={() => setScreen(userEmail ? "chat" : "login")}
          onLogout={handleLogout}
        />
      )}
      {screen === "login" && (
        <LoginScreen onLogin={handleLogin} onBack={() => setScreen("welcome")} />
      )}
      {screen === "chat" && (
        <ChatScreen
          userEmail={userEmail}
          firstName={firstName}
          messages={messages}
          isLoading={isLoading}
          onSend={handleSend}
          onSaveConcept={handleSaveConcept}
          onDeleteConcept={handleDeleteConcept}
          savedConcepts={savedConcepts}
          conceptLexicon={conceptLexicon}
          onOpenPersonalCard={() => setScreen("personal")}
          onOpenHistory={() => setScreen("history")}
          onLogout={handleLogout}
          onTimeout={() => { handleFinalizeSession(); setShowTimeoutModal(true); }}
          sessionStartTime={sessionStartTime}
          logRecordId={logRecordIdRef.current}
          chatLang={chatLang}
        />
      )}
      {screen === "personal" && (
        <PersonalCard
          record={{ ...userRecord, email: userEmail }}
          airtableRecordId={recordId}
          logRecordId={logRecordIdRef.current}
          savedConcepts={savedConcepts}
          conceptLexicon={conceptLexicon}
          chatLang={chatLang}
          onClose={() => { console.log("[App] PersonalCard opened, savedConcepts:", savedConcepts); setScreen("chat"); }}
          onLogout={handleLogout}
          onRecordUpdate={(updated) => setUserRecord(prev => ({ ...prev, ...updated }))}
          onDeleteConcept={handleDeleteConcept}
        />
      )}
      {screen === "history" && (
        <HistoryScreen
          username={userRecord?.Username || recordId}
          firstName={userRecord?.First_Name || ""}
          onClose={() => setScreen("chat")}
        />
      )}
      {showBetaModal    && <BetaModal onClose={() => setShowBetaModal(false)} />}
      {showTimeoutModal && (
        <TimeoutModal
          logRecordId={logRecordIdRef.current}
          onClose={() => { setShowTimeoutModal(false); setScreen("welcome"); }}
        />
      )}
      {/* DEBUG PANEL — remove before production */}

    </>
  );
}
