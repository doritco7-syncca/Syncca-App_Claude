// App.jsx — Syncca · Main Application Router
// Screen flow: welcome → login → chat ↔ personal

import { useState, useEffect, useCallback, useRef } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen   from "./components/LoginScreen";
import ChatScreen    from "./components/ChatScreen";
import PersonalCard  from "./components/PersonalCard";
import HistoryScreen from "./components/HistoryScreen";
import {
  findOrCreateUser, findUserByEmail, incrementSyncCount,
  checkSessionAllowed, markSessionStarted,
  updateUserProfile, updateSavedConcepts, overwriteSavedConcepts,
  createSessionLog, syncSession, saveFeedback, finalizeSession,
  fetchLexicon, fetchPreviousConcepts, fetchFullHistory,
} from "./AirtableService";
import { SYNCCA_OPENING_MESSAGE } from "./SynccaPrompt";
import { sendToSyncca, generateSessionInsight } from "./SynccaAPI";
import { parseResponse } from "./SynccaParsers";

// ─── Helpers ─────────────────────────────────────────────────────
function shouldShowBetaModal(email) {
  const key = `syncca_beta_seen_${email}`;
  if (localStorage.getItem(key)) return false;
  localStorage.setItem(key, "1");
  return true;
}

function getOpeningMessage(syncCount, firstName, gender) {
  if (!syncCount || syncCount <= 1) return SYNCCA_OPENING_MESSAGE["he"];
  const name   = firstName ? ` ${firstName}` : "";
  const isFem  = gender === "Female" || gender === "אישה";
  const action = isFem ? "תרצי" : "תרצה";
  return `היי${name}, טוב לראות אותך שוב 🙏\nעל מה ${action} לעבוד היום?`;
}

// Count [User]: lines in transcript — used for 3-message minimum check
function countUserMessages(transcript) {
  if (!transcript) return 0;
  return (transcript.match(/\[User\]:/g) || []).length;
}

function stripHeDefiniteArticle(term) {
  return term.split(" ").map(w => w.startsWith("ה") && w.length > 2 ? w.slice(1) : w).join(" ");
}

function parseBracketConcepts(text, conceptLexicon, lang = "he") {
  const concepts = [];
  const cleanText = text.replace(/\[\[([^\]]+)\]\]/g, (_, term) => {
    const t = term.trim();
    const stripped = stripHeDefiniteArticle(t);
    const tLower = t.toLowerCase();
    const entry =
      conceptLexicon.find(c => c.englishTerm?.toLowerCase() === tLower) ||
      conceptLexicon.find(c => c.word === t) ||
      conceptLexicon.find(c => c.word === stripped) ||
      conceptLexicon.find(c =>
        c.aliases?.some(a => a === t || a === stripped ||
          stripHeDefiniteArticle(a) === t || stripHeDefiniteArticle(a) === stripped)
      ) ||
      conceptLexicon.find(c =>
        t.includes(c.word) || stripped.includes(c.word) || c.word.includes(stripped)
      );
   const displayTerm = lang === "he"
  ? (entry?.word || t)
  : lang === "de"
    ? (entry?.germanTerm || entry?.englishTerm || t)
    : (entry?.englishTerm || t);
concepts.push({
  englishTerm:   entry?.englishTerm  || t,
  word:          entry?.word         || t,
  germanTerm:    entry?.germanTerm   || "",
  displayWord:   displayTerm,
  explanation:   entry?.explanation  || "",
  explanationEN: entry?.explanationEN || "",
  explanationDE: entry?.explanationDE || "",
  category:      entry?.category      || "",
});
    return displayTerm;
  });
  return { cleanText, concepts };
}

// ─── Fallback lexicon ────────────────────────────────────────────
const FALLBACK_LEXICON = [
  { englishTerm: "Limbic System", category: "The Biological Map",        word: "מערכת לימבית",         explanation: "המערכת הרגשית-קדומה במוח שמופעלת בתגובה לאיום. כשהיא פעילה, אנחנו בהישרדות — קשה לחשוב בצורה פתוחה, להקשיב, או להרגיש אמפתיה." },
  { englishTerm: "Cortex", category: "The Biological Map",               word: "קורטקס",               explanation: "מערכת החשיבה הרציונלית והאמפתית. כשהלימבי רגוע, הקורטקס יכול לשקול בקשות בצורה פתוחה ואוהבת." },
  { englishTerm: "Biological Shift", category: "Survival & Toxins",     word: "הסטה ביולוגית",        explanation: "הרגע שבו המוח עובר משליטת הקורטקס לשליטת המערכת הלימבית — בדרך כלל בגלל תחושת איום, ביקורת, או סנקציה." },
  { englishTerm: "Reptilian Brain", category: "The Biological Map",      word: "מוח זוחלי",            explanation: "השכבה הקדומה ביותר במוח — אחראית על הישרדות בסיסית: לחימה, בריחה, קיפאון." },
  { englishTerm: "Injury Time", category: "Survival & Toxins",          word: "זמן פציעות",           explanation: "תקופה של ריחוק וקור אחרי סנקציה — כשהאהבה 'מורעבת' מחמת היעדר חמימות וקרבה." },
  { englishTerm: "Sanction", category: "Survival & Toxins",             word: "סנקציה",               explanation: "כל תגובה לא נעימה כלפי הפרטנר כשצורך לא נענה: ביקורת, שתיקה, פנים כועסות, ריחוק, מילים פוגעות." },
  { englishTerm: "Demand", category: "Survival & Toxins",               word: "דרישה",                explanation: "ביטוי כוחני של צורך, עם ציפייה שהפרטנר ייענה לו — ולרוב עם סנקציה מובלעת אם לא ייענה." },
  { englishTerm: "Appeasement", category: "Survival & Toxins",          word: "ריצוי",                explanation: "תגובה לדרישה מתוך פחד מסנקציה — לא מבחירה. מוביל לביצוע עלוב, טינה מצטברת." },
  { englishTerm: "War Mode", category: "Survival & Toxins",             word: "מלחמה",                explanation: "דפוס שבו שני הפרטנרים מגנים על עצמם ונלחמים על שליטה — אף אחד לא מוותר." },
  { englishTerm: "Hierarchy", category: "Survival & Toxins",            word: "היררכיה",              explanation: "כשאחד הפרטנרים מתנהג כאילו הוא 'הבוס' — דורש, מצפה, מסנקציה." },
  { englishTerm: "Extension Arm", category: "Survival & Toxins",        word: "שלוחת ביצוע",          explanation: "להתייחס לפרטנר כאילו הוא כלי לספק את הצרכים שלי — ולא כאדם נפרד." },
  { englishTerm: "Separateness", category: "The Space of Separateness", word: "נפרדות",               explanation: "ההכרה שהפרטנר הוא ישות נפרדת לחלוטין, עם עולמו הפנימי, צרכיו, ותזמונו שלו." },
  { englishTerm: "Holding", category: "The Space of Separateness",      word: "החזקה",                explanation: "להישאר נוכח ולהכיל את המרחב הרגשי של הפרטנר — בלי לתקן, לפתור, או לנתח." },
  { englishTerm: "Interference", category: "The Space of Separateness", word: "הפרעה",                explanation: "הכרה בכך שכשאני מגיש/ה בקשה, אני מפריע/ה לזרימה הטבעית של הפרטנר." },
  { englishTerm: "Plan B", category: "Clean Communication",             word: "תכנית ב",              explanation: "דרך עצמאית לספק את הצורך שלי אם הפרטנר יגיד לא." },
  { englishTerm: "Clean Request", category: "Clean Request sets love free", word: "בקשה נקייה",       explanation: "ביטוי ישיר של צורך שמשאיר לפרטנר חופש בחירה אמיתי — ללא לחץ, ללא ציפייה מובלעת." },
  { englishTerm: "Zero-Sanction Policy", category: "Clean Request sets love free", word: "אפס סנקציות", explanation: "הסכמה פנימית לא להגיב בסנקציה אם הוא/היא יגיד לא לבקשה." },
  { englishTerm: "Yes From Love", category: "Keeping Love Alive",       word: "כן שבא מאהבה",        explanation: "כשאין פחד מסנקציה, ה'כן' של הפרטנר בא מרצון אמיתי ואהבה." },
  { englishTerm: "No From Self-Protection", category: "Keeping Love Alive", word: "לא שבא מהגנה עצמית", explanation: "לא שמגיע מתוך שמירה על הצרכים, הערכים, או הגבולות שלי." },
  { englishTerm: "Compliance-War Cycle", category: "Survival & Toxins", word: "מחזור ריצוי-מלחמה",   explanation: "הדפוס שבו ריצוי מצטבר לטינה שמתפוצצת למלחמה — ואז חוזרים לריצוי." },
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
            <div style={{ fontFamily:"'Alef',sans-serif", fontSize:"0.6rem", fontWeight:700,
                          color:"#757575", marginBottom:"10px", textAlign:"center" }}>
              זמן השיחה הסתיים 🙏
            </div>
            <p style={{ fontFamily:"'Alef',sans-serif", fontSize:"0.88rem", color:"#374151",
                        lineHeight:1.7, marginBottom:"18px", textAlign:"center" }}>
              30 דקות של עבודה אמיתית. כל תובנה שעלתה היום — שייכת לך. נשמח לשמוע מה עלה בשיחה.
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
              שליחת פידבק וסיום
            </button>
          </>
        ) : (
          <div style={{ textAlign:"center", padding:"12px 0" }}>
            <div style={{ fontSize:"0.9rem", marginBottom:"10px" }}>✦</div>
            <div style={{ fontFamily:"'Alef',sans-serif", fontSize:"1rem", fontWeight:700,
                          color:"#16a34a", marginBottom:"6px" }}>תודה!</div>
            <div style={{ fontFamily:"'Alef',sans-serif", fontSize:"0.88rem", color:"#374151",
                          lineHeight:1.6 }}>תודה! נתראה בסינק הבא.</div>
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
    "סינקה היא המקום שלך כשעולה רצון להבין קצת יותר, ללמוד או ליצור שינוי בתקשורת הבין אישית. היא מבוססת על ידע וניסיון של שנים בליווי זוגות ומשפחות, ונועדה לעזור בזיהוי והבנה של דפוסי תקשורת מזיקים ורעילים ואיך משתחררים מהם.",
    "במהלך השיחה, יתכן שסינקה תציע מושגים רלבנטיים. הם מיועדים לתת מילים למה שקורה לנו בפנים. ניתן להרחיב אותם (בלחיצה), ואף לשמור אותם בכרטיס האישי (שנמצא בראש הצ'אט).",
    "כל שיחה מוגבלת ל-30 דקות כדי לאפשר זמן ממוקד לעיבוד והתבוננות.",
    "בסוף השיחה, נשמח לקבל פידבק — זה עוזר לנו להשתפר.",
  ];
  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(117,117,117,0.18)",
                  display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
      <div style={{ background:"#f0fdf4", borderRadius:"24px", padding:"28px 24px",
                    maxWidth:"390px", width:"100%", direction:"rtl", boxShadow:"0 8px 40px rgba(0,0,0,0.15)" }}>
        <div style={{ fontFamily:"'Alef',sans-serif", fontSize:"1.27rem", fontWeight:700,
                      color:"#757575", marginBottom:"16px", textAlign:"center" }}>טוב שהגעת לסינקה 👋</div>
        <ol style={{ paddingRight:"18px" }}>
          {items.map((item, i) => (
            <li key={i} style={{ fontFamily:"'Alef',sans-serif", fontSize:"0.79rem",
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
  const [chatLang,         setChatLang]         = useState("he");
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [savedConcepts,    setSavedConcepts]    = useState([]);
  const [isLoading,        setIsLoading]        = useState(false);
  const [conceptLexicon,   setConceptLexicon]   = useState(FALLBACK_LEXICON);
  const [showBetaModal,    setShowBetaModal]    = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);

  const logRecordIdRef         = useRef(null);
  const fullTranscriptRef      = useRef("");
  const conceptsIntroducedRef  = useRef([]);
  const previousConceptsRef    = useRef([]);
  const sessionHistoryRef      = useRef([]);
  const savedConceptsRef       = useRef([]);
  const securityAlertRef       = useRef(false);
  const insightSavedRef        = useRef(false); // prevents double insight generation

  useEffect(() => { savedConceptsRef.current = savedConcepts; }, [savedConcepts]);

  // ── Save session on tab close ────────────────────────────────
  useEffect(() => {
    function handleBeforeUnload() {
      const logId      = logRecordIdRef.current;
      const transcript = fullTranscriptRef.current;
      const concepts   = conceptsIntroducedRef.current;
      if (!logId || !transcript) return;
      // Only generate insight if session was substantial (3+ user messages)
      const shouldGenerateInsight = countUserMessages(transcript) >= 3 && !insightSavedRef.current;
      const payload = JSON.stringify({
        logRecordId:      logId,
        fullTranscript:   transcript,
        conceptsSurfaced: concepts,
        generateInsight:  shouldGenerateInsight,
      });
      navigator.sendBeacon("/api/airtable-finalize", payload);
      if (shouldGenerateInsight) insightSavedRef.current = true;
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const firstName = userRecord?.First_Name || "";

  // ── Fetch live lexicon on mount ──────────────────────────────
  useEffect(() => {
    fetchLexicon()
      .then(entries => {
        if (entries?.length > 0) {
          const merged = entries.map(entry => {
            if (entry.explanation) return entry;
            const fb = FALLBACK_LEXICON.find(
              f => f.englishTerm === entry.englishTerm || f.word === entry.word
            );
            return fb?.explanation ? { ...entry, explanation: fb.explanation } : entry;
          });
          setConceptLexicon(merged);
          setSavedConcepts(prev => prev.map(c => {
            const match = merged.find(e =>
              e.englishTerm === c.englishTerm || e.word === c.word ||
              e.word === c.englishTerm || e.englishTerm === c.word ||
              e.aliases?.includes(c.word) || e.aliases?.includes(c.englishTerm)
            );
            return match
              ? { word: match.word, englishTerm: match.englishTerm, explanation: match.explanation }
              : c;
          }));
        }
      })
      .catch(e => console.warn("[Lexicon] Using fallback:", e));
  }, []);

  // ── Auto-navigate returning user ─────────────────────────────
  useEffect(() => {
    if (!userEmail || !recordId) return;
    (async () => {
      try {
        const result = await findUserByEmail(userEmail);
        if (result?.fields) {
          setUserRecord(result.fields);
          const savedRaw = (result.fields.Saved_Concepts || "")
            .split(",").map(s => s.trim()).filter(Boolean);
          if (savedRaw.length) {
            const enriched = savedRaw.map(w => {
              const entry = conceptLexicon.find(e =>
                e.word === w || e.englishTerm === w || e.aliases?.includes(w)
              );
              return entry
                ? { word: entry.word, englishTerm: entry.englishTerm, explanation: entry.explanation }
                : { word: w, englishTerm: w, explanation: "" };
            });
            setSavedConcepts(enriched);
          }
        }

        const prev = await fetchPreviousConcepts(recordId);
        previousConceptsRef.current = prev;
        const username = result?.fields?.Username || recordId;
        const history  = await fetchFullHistory(username, 50);
        sessionHistoryRef.current = history;

        // Retroactively generate insight for sessions missing it
        const needsInsight = history.filter(
          s => s.transcript && countUserMessages(s.transcript) >= 3 && !s.insight
        );
        needsInsight.slice(0, 2).forEach(s => {
          fetch("/api/airtable-finalize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              logRecordId:     s.id,
              fullTranscript:  s.transcript,
              generateInsight: true,
            }),
          }).catch(() => {});
        });

        const logId = await createSessionLog(recordId);
        logRecordIdRef.current        = logId;
        fullTranscriptRef.current     = "";
        conceptsIntroducedRef.current = [];
        insightSavedRef.current       = false;

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

    const { allowed, message, isResume } = await checkSessionAllowed(rid, fields);
    if (!allowed) throw new Error(message);

    if (!isResume) await markSessionStarted(rid).catch(() => {});

    setUserEmail(email);
    setUserRecord(fields);
    setRecordId(rid);
    localStorage.setItem("syncca_email",     email);
    localStorage.setItem("syncca_record_id", rid);

    const savedRaw = (fields.Saved_Concepts || "")
      .split(",").map(s => s.trim()).filter(Boolean);
    if (savedRaw.length) {
      const enriched = savedRaw.map(w => {
        const entry = conceptLexicon.find(e =>
          e.word === w || e.englishTerm === w || e.aliases?.includes(w)
        );
        return entry
          ? { word: entry.word, englishTerm: entry.englishTerm, explanation: entry.explanation }
          : { word: w, englishTerm: w, explanation: "" };
      });
      setSavedConcepts(enriched);
    }

    const newSyncCount = await incrementSyncCount(rid, fields.Sync_Count || 0);

    const prev = await fetchPreviousConcepts(rid).catch(() => []);
    previousConceptsRef.current = prev;
    const history = await fetchFullHistory(fields.Username || rid, 50).catch(() => []);
    sessionHistoryRef.current = history;

    // Retroactively generate insight for sessions missing it
    const needsInsight = history.filter(
      s => s.transcript && countUserMessages(s.transcript) >= 3 && !s.insight
    );
    needsInsight.slice(0, 2).forEach(s => {
      fetch("/api/airtable-finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logRecordId:    s.id,
          fullTranscript: s.transcript,
          generateInsight: true,
        }),
      }).catch(() => {});
    });

    if (isResume && history.length > 0) {
      const latest = history[0];
      logRecordIdRef.current        = latest.id;
      fullTranscriptRef.current     = latest.transcript || "";
      conceptsIntroducedRef.current = latest.concepts || [];
      insightSavedRef.current       = false;
      const resumeMessages = (latest.transcript || "")
        .split("\n")
        .filter(l => l.startsWith("[User]:") || l.startsWith("[Syncca]:"))
        .map(l => ({
          role:      l.startsWith("[User]:") ? "user" : "syncca",
          text:      l.replace(/^\[(User|Syncca)\]: /, ""),
          concepts:  [],
          timestamp: new Date().toISOString(),
        }));
      const resumeNote = {
        role: "syncca", concepts: [], timestamp: new Date().toISOString(),
        text: "ברוכה השבה 🙏 ממשיכים מאיפה שהפסקנו.",
      };
      setMessages(resumeMessages.length > 0 ? [...resumeMessages, resumeNote] : [resumeNote]);
    } else {
      const logId = await createSessionLog(rid).catch(() => null);
      logRecordIdRef.current        = logId;
      fullTranscriptRef.current     = "";
      conceptsIntroducedRef.current = [];
      insightSavedRef.current       = false;
      setSessionStartTime(new Date());
      setMessages([{
        role: "syncca", concepts: [], timestamp: new Date().toISOString(),
        text: getOpeningMessage(newSyncCount, fields.First_Name || "", fields.Gender || ""),
      }]);
    }

    if (shouldShowBetaModal(email)) setShowBetaModal(true);
    setScreen("chat");
  }

  // ── SEND MESSAGE ──────────────────────────────────────────────
  const handleSend = useCallback(async (text) => {
    const currentLogId = logRecordIdRef.current;
    if (!currentLogId) console.error("[handleSend] logRecordId is null");

    const userMsg         = { role: "user", text, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    if (messages.filter(m => m.role === "user").length === 0) {
     const isHebrew = /[\u05D0-\u05EA]/.test(text);
const isGerman = !isHebrew && /[äöüÄÖÜß]|(\b(ich|du|ist|das|die|der|und|nicht|mit|wie)\b)/i.test(text);
setChatLang(isHebrew ? "he" : isGerman ? "de" : "en");
    }

    setIsLoading(true);

    const transcriptBeforeAI = fullTranscriptRef.current
      ? fullTranscriptRef.current + "\n[User]: " + text
      : "[User]: " + text;
    fullTranscriptRef.current = transcriptBeforeAI;

    try {
      const apiMessages = updatedMessages
        .filter((m, i) => !(m.role === "syncca" && i === 0))
        .map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));

      const elapsed = sessionStartTime
        ? Math.floor((Date.now() - new Date(sessionStartTime).getTime()) / 60000)
        : 0;

      const rawResponse = await sendToSyncca(
        apiMessages, elapsed, conceptLexicon, previousConceptsRef.current,
        userRecord || {}, sessionHistoryRef.current
      );
      const { visibleText, securityAlert } = parseResponse(rawResponse);
      if (securityAlert) securityAlertRef.current = true;

      const { cleanText, concepts } = parseBracketConcepts(visibleText, conceptLexicon, chatLang);
      if (concepts.length > 0) {
        const newWords = concepts
          .map(c => c.word || c.englishTerm)
          .filter(w => w && !conceptsIntroducedRef.current.includes(w));
        if (newWords.length > 0)
          conceptsIntroducedRef.current = [...conceptsIntroducedRef.current, ...newWords];
      }

      const fullTranscript = transcriptBeforeAI + "\n[Syncca]: " + cleanText;
      fullTranscriptRef.current = fullTranscript;

      setMessages(prev => [...prev, {
        role: "syncca", text: cleanText, concepts,
        timestamp: new Date().toISOString(),
      }]);

      if (currentLogId) {
        try {
          await syncSession({
            logRecordId:      currentLogId,
            fullTranscript,
            conceptsSurfaced: conceptsIntroducedRef.current,
          });
        } catch (syncErr) {
          console.error("[handleSend] syncSession failed:", syncErr);
        }
      }
    } catch (err) {
      console.error("[handleSend] AI error:", err);
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

  // ── SAVE / DELETE CONCEPT ─────────────────────────────────────
  function handleSaveConcept(concept) {
    const current = savedConceptsRef.current;
    if (current.find(c => c.word === concept.word)) return;
    const updated = [...current, concept];
    setSavedConcepts(updated);
    if (recordId) {
      const words = updated.map(c => c.word || c.englishTerm).filter(Boolean);
      updateSavedConcepts(recordId, words)
        .catch(e => console.error("[handleSaveConcept] ✗ failed:", e));
    }
  }

  function handleDeleteConcept(concept) {
    const updated = savedConceptsRef.current.filter(c => c.word !== concept.word);
    setSavedConcepts(updated);
    if (recordId) {
      const words = updated.map(c => c.word || c.englishTerm).filter(Boolean);
      overwriteSavedConcepts(recordId, words)
        .catch(e => console.error("[handleDeleteConcept] ✗ failed:", e));
    }
  }

  // ── FINALIZE SESSION ──────────────────────────────────────────
  // Called by "סיימתי" button, logout, and timeout.
  // Minimum 3 user messages required. Skips if already saved this session.
  async function handleFinalizeSession() {
    const logId    = logRecordIdRef.current;
    const concepts = conceptsIntroducedRef.current;
    if (!logId || insightSavedRef.current) return;

    let transcript = fullTranscriptRef.current;
    if (!transcript && messages.length > 1) {
      transcript = messages
        .filter(m => m.role === "user" || m.role === "syncca")
        .map(m => `[${m.role === "user" ? "User" : "Syncca"}]: ${m.text}`)
        .join("\n");
    }
    if (!transcript || countUserMessages(transcript) < 3) return;

    insightSavedRef.current = true; // mark before async to prevent double-call
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
      insightSavedRef.current = false; // allow retry on error
      console.warn("[handleFinalizeSession] failed:", e);
    }
  }

  // ── LOGOUT ────────────────────────────────────────────────────
  function handleLogout() {
    const logId      = logRecordIdRef.current;
    const transcript = fullTranscriptRef.current;
    const concepts   = conceptsIntroducedRef.current;
    const msgsCopy   = [...messages];
    const alreadySaved = insightSavedRef.current;

    localStorage.removeItem("syncca_email");
    localStorage.removeItem("syncca_record_id");
    setUserEmail(""); setRecordId(""); setUserRecord(null);
    setMessages([]); setSavedConcepts([]);
    logRecordIdRef.current        = null;
    fullTranscriptRef.current     = "";
    conceptsIntroducedRef.current = [];
    previousConceptsRef.current   = [];
    sessionHistoryRef.current     = [];
    insightSavedRef.current       = false;
    setScreen("welcome");

    if (logId && !alreadySaved) {
      let finalTranscript = transcript;
      if (!finalTranscript && msgsCopy.length > 1) {
        finalTranscript = msgsCopy
          .filter(m => m.role === "user" || m.role === "syncca")
          .map(m => `[${m.role === "user" ? "User" : "Syncca"}]: ${m.text}`)
          .join("\n");
      }
      if (finalTranscript && countUserMessages(finalTranscript) >= 3) {
        generateSessionInsight(finalTranscript, concepts)
          .then(insight => finalizeSession({
            logRecordId:      logId,
            fullTranscript:   finalTranscript,
            conceptsSurfaced: concepts,
            sessionStartTime: sessionStartTime || null,
            sessionInsight:   insight,
            securityAlert:    securityAlertRef.current,
          }))
          .catch(e => console.warn("[handleLogout] finalize failed:", e));
      } else if (finalTranscript) {
        // Short session — save transcript/concepts but no insight
        finalizeSession({
          logRecordId:      logId,
          fullTranscript:   finalTranscript,
          conceptsSurfaced: concepts,
          sessionStartTime: sessionStartTime || null,
        }).catch(e => console.warn("[handleLogout] short session save failed:", e));
      }
    }
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
          onSessionEnd={handleFinalizeSession}
          onTimeout={() => {
            const logId      = logRecordIdRef.current;
            const transcript = fullTranscriptRef.current;
            const concepts   = conceptsIntroducedRef.current;
            const msgsCopy   = [...messages];
            const alreadySaved = insightSavedRef.current;
            setShowTimeoutModal(true);
            if (logId && !alreadySaved) {
              let finalTranscript = transcript;
              if (!finalTranscript && msgsCopy.length > 1) {
                finalTranscript = msgsCopy
                  .filter(m => m.role === "user" || m.role === "syncca")
                  .map(m => `[${m.role === "user" ? "User" : "Syncca"}]: ${m.text}`)
                  .join("\n");
              }
              if (finalTranscript && countUserMessages(finalTranscript) >= 3) {
                insightSavedRef.current = true;
                generateSessionInsight(finalTranscript, concepts)
                  .then(insight => finalizeSession({
                    logRecordId:      logId,
                    fullTranscript:   finalTranscript,
                    conceptsSurfaced: concepts,
                    sessionStartTime: sessionStartTime || null,
                    sessionInsight:   insight,
                  }))
                  .catch(e => {
                    insightSavedRef.current = false;
                    console.warn("[timeout] finalize failed:", e);
                  });
              }
            }
          }}
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
          onClose={() => setScreen("chat")}
          onLogout={handleLogout}
          onRecordUpdate={(updated) => setUserRecord(prev => ({ ...prev, ...updated }))}
          onDeleteConcept={handleDeleteConcept}
        />
      )}
      {screen === "history" && (
        <HistoryScreen
          username={userRecord?.Username || recordId}
          firstName={userRecord?.First_Name || ""}
          conceptLexicon={conceptLexicon}
          savedConcepts={savedConcepts}
          onSaveConcept={handleSaveConcept}
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
    </>
  );
}
