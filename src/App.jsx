// App.jsx — Syncca · Main Application Router
// Connects: WelcomeScreen → LoginScreen → ChatScreen ↔ PersonalCard
// AI brain lives in SynccaService.js — this file only manages routing + state.

import { useState, useEffect, useCallback } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen   from "./components/LoginScreen";
import ChatScreen    from "./components/ChatScreen";
import PersonalCard  from "./components/PersonalCard";
import { findOrCreateUser, findUserByEmail, incrementSyncCount, createSessionLog, syncSession } from "./AirtableService";
import { sendToSyncca, parseResponse, SYNCCA_OPENING_MESSAGE } from "./SynccaService";

// ─── BETA MODAL — show only on first 2 sessions ──────────────────
function shouldShowBetaModal() {
  const count = parseInt(localStorage.getItem("syncca_session_count") || "0", 10);
  const next = count + 1;
  localStorage.setItem("syncca_session_count", String(next));
  return next <= 2;
}

// ─── PARSE [[Bracket]] CONCEPTS from AI response ─────────────────
function parseBracketConcepts(text, conceptLexicon) {
  const concepts = [];
  const cleanText = text.replace(/\[\[([^\]]+)\]\]/g, (_, term) => {
    const entry = conceptLexicon.find(
      c => c.englishTerm === term || c.word === term || term.includes(c.word)
    );
    concepts.push({
      word: entry?.word || term,
      explanation: entry?.explanation || "",
      englishTerm: term,
    });
    return entry?.word || term;
  });
  return { cleanText, concepts };
}

// ─── CONCEPT LEXICON — Hebrew display + explanations ─────────────
const CONCEPT_LEXICON = [
  { englishTerm: "Clean Request",            word: "בקשה נקייה",          explanation: "בקשה שמשאירה לפרטנר חופש בחירה אמיתי — ללא לחץ, ללא ציפייה מובלעת, ומתוך הכנה לתשובה שלילית." },
  { englishTerm: "Sanction",                 word: "סנקציה",               explanation: "תגובה לא נעימה כלפי הפרטנר — ביקורת, פנים כועסות, שתיקה, ריחוק — שמפעילה את המערכת הלימבית." },
  { englishTerm: "Demand",                   word: "דרישה",                explanation: "ביטוי כוחני של צורך שמפעיל פחד מסנקציה אצל הפרטנר ומכבה את הקורטקס." },
  { englishTerm: "Separateness",             word: "נפרדות",               explanation: "הפרטנר הוא ישות נפרדת עם עולם פנימי, רצונות ולוח זמנים משלו — יכולת קורטיקלית חיובית." },
  { englishTerm: "Separateness Recognition", word: "הכרה בנפרדות",         explanation: "הכרה פעילה בכך שהצורך שלי הוא הפרעה לזרימה הטבעית של הפרטנר — והוא לא חייב לי כן." },
  { englishTerm: "Plan B",                   word: "תוכנית ב",             explanation: "לקיחת אחריות אישית אמיתית על הצורך שלי אם הפרטנר יגיד לא — ממקום של שלום פנימי." },
  { englishTerm: "Zero-Sanction Policy",     word: "אפס סנקציות",          explanation: "מחויבות פנימית אמיתית לקבל 'לא' ללא שום תגובה מעניישת — לא רק מבחוץ, אלא גם רגשית." },
  { englishTerm: "Limbic System",            word: "מערכת לימבית",         explanation: "המערכת הרגשית-קדומה במוח שמופעלת בתגובה לאיום. כשהיא פעילה, קשה לחשוב בפתיחות." },
  { englishTerm: "Cortex",                   word: "קורטקס",               explanation: "מערכת החשיבה הרציונלית. כשאין פחד מסנקציות, הקורטקס יכול לשקול בקשות בצורה פתוחה." },
  { englishTerm: "Compliance",               word: "פיוס",                 explanation: "פעולה מתוך פחד, לא בחירה — ביצוע חלקי עם טינה שנצברת." },
  { englishTerm: "War Mode",                 word: "מלחמה",                explanation: "התנגדות פעילה ומאבקי כוח — אף אחד לא מוותר ואין מי שמבצע." },
  { englishTerm: "Compliance-War Cycle",     word: "מחזור פיוס-מלחמה",    explanation: "טינה שנצברת מפיוס מתפוצצת למלחמה — דפוס חוזר ונשנה." },
  { englishTerm: "Injury Time",              word: "זמן הפציעה",           explanation: "שתיקה וריחוק לאחר סנקציה — האהבה רועבת מחוסר חמימות." },
  { englishTerm: "Functional Extension",     word: "הארכה פונקציונלית",    explanation: "התייחסות לפרטנר כהמשך של עצמי — לא כאדם נפרד עם עולמו שלו." },
  { englishTerm: "Hierarchy",                word: "היררכיה",              explanation: "דרישות יוצרות מבנה כוח מרומז בזוגיות שווה — ומפעילות פיוס או מלחמה." },
  { englishTerm: "Biological Shift",         word: "מעבר ביולוגי",         explanation: "המוח פועל ב-3 מצבים — קורטקס, לימבי, זוחלי. הקורטקס יכול לקחת פיקוד." },
  { englishTerm: "Reptilian Brain",          word: "מוח הזוחל",            explanation: "מערכת ההישרדות. הצפה של אדרנלין — להילחם/לברוח/לקפוא." },
  { englishTerm: "Holding Environment",      word: "מרחב מחזיק",           explanation: "מרחב רגשי בטוח לקושי ולפגיעות — ללא פחד מדחייה או הסלמה." },
  { englishTerm: "Deep Dialogue",            word: "דיאלוג עמוק",          explanation: "מדבר משתף ללא האשמה; מאזין משקף באמפתיה לפני שהוא מגיב." },
  { englishTerm: "Healing Apology",          word: "התנצלות מרפאת",        explanation: "הכרה בנזק, אימות רגשות הפרטנר, מחויבות לשינוי מעשי." },
  { englishTerm: "Reframing",                word: "מסגור מחדש",           explanation: "זיהוי הצורך החיובי מאחורי הכעס של הפרטנר — ומתן שם לו בכבוד." },
];

// ─── TIMEOUT MODAL ───────────────────────────────────────────────
function TimeoutModal({ onClose }) {
  const [feedback, setFeedback] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.25)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      <div style={{
        background: "#EFF6FF", borderRadius: "24px",
        border: "1.5px solid rgba(30,58,138,0.15)",
        padding: "28px 24px", maxWidth: "380px", width: "100%",
        direction: "rtl", boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "1.4rem", fontWeight: 700,
          color: "#1e3a8a", marginBottom: "10px",
        }}>זמן השיחה הסתיים</div>
        <p style={{
          fontFamily: "'Inter', sans-serif", fontSize: "0.88rem",
          color: "#374151", lineHeight: 1.6, marginBottom: "18px",
        }}>
          הזמן המיועד להתבוננות הסתיים. זהו רגע טוב לעצור ולחשוב.
        </p>
        {!sent ? (
          <>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="מה כדאי להוסיף, להוריד או לשנות ב-Syncca?"
              style={{
                width: "100%", height: "84px",
                border: "1.5px solid rgba(30,58,138,0.2)",
                borderRadius: "12px", padding: "12px",
                fontFamily: "'Inter', sans-serif", fontSize: "0.88rem",
                background: "white", resize: "none", outline: "none",
                direction: "rtl", boxSizing: "border-box",
              }}
            />
            <button onClick={() => setSent(true)} style={{
              marginTop: "12px", width: "100%", height: "48px",
              background: "#1e3a8a", color: "white",
              border: "none", borderRadius: "9999px",
              fontFamily: "'Inter', sans-serif", fontWeight: 600,
              cursor: "pointer",
            }}>שלח פידבק וסיים</button>
          </>
        ) : (
          <div style={{
            textAlign: "center", color: "#16a34a",
            fontFamily: "'Inter', sans-serif", fontWeight: 600,
          }}>✓ תודה! נתראה בסינק הבא.</div>
        )}
        <button onClick={onClose} style={{
          marginTop: "10px", width: "100%", height: "44px",
          background: "transparent", color: "#6b7280",
          border: "1px solid #E5E0D8", borderRadius: "9999px",
          fontFamily: "'Inter', sans-serif", cursor: "pointer",
        }}>סגירה</button>
      </div>
    </div>
  );
}

// ─── BETA MODAL ──────────────────────────────────────────────────
function BetaModal({ onClose }) {
  const items = [
    "המערכת מבוססת על Claude ועל מתודולוגיה של תקשורת בין-אישית וזוגית שפותחה בעשרים השנים האחרונות.",
    "במהלך השיחה יופיעו מושגים מודגשים. לחיצה עליהם תפתח הסבר. כל מושג שתשמרו יחכה לכם בכרטיס האישי.",
    "כל שיחה מוגבלת ל-30 דקות — זמן להתבוננות ממוקדת.",
    "הפידבק שלכם עוזר לנו לצמוח. בסיום השיחה נשמח לשמוע.",
  ];
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.22)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      <div style={{
        background: "#FDFBF7", borderRadius: "24px",
        padding: "28px 24px", maxWidth: "390px", width: "100%",
        direction: "rtl", boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "1.4rem", fontWeight: 700,
          color: "#1e3a8a", marginBottom: "16px", textAlign: "center",
        }}>ברוכים ל-Syncca 👋</div>
        <ol style={{ paddingRight: "18px" }}>
          {items.map((item, i) => (
            <li key={i} style={{
              fontFamily: "'Inter', sans-serif", fontSize: "0.86rem",
              lineHeight: 1.65, marginBottom: "10px", color: "#1a1a1a",
            }}>{item}</li>
          ))}
        </ol>
        <button onClick={onClose} style={{
          marginTop: "18px", width: "100%", height: "50px",
          background: "#ea580c", color: "white",
          border: "none", borderRadius: "9999px",
          fontFamily: "'Inter', sans-serif", fontWeight: 600,
          fontSize: "1rem", cursor: "pointer",
        }}>הבנתי, בואנו ✦</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────
export default function App() {
  const [screen,     setScreen]     = useState("welcome");
  const [userEmail,  setUserEmail]  = useState(() => localStorage.getItem("syncca_email") || "");
  const [userRecord, setUserRecord] = useState(null);
  const [recordId,   setRecordId]   = useState(() => localStorage.getItem("syncca_record_id") || "");

  const [messages,           setMessages]           = useState([]);
  const [sessionStartTime,   setSessionStartTime]   = useState(null);
  const [conceptsIntroduced, setConceptsIntroduced] = useState([]);
  const [savedConcepts,      setSavedConcepts]      = useState([]);
  const [logRecordId,        setLogRecordId]        = useState(null);
  const [isLoading,          setIsLoading]          = useState(false);

  const [showBetaModal,    setShowBetaModal]    = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);

  const firstName = userRecord?.First_Name || "";

  // Auto-go to chat if returning user
  useEffect(() => {
    if (userEmail && recordId) {
      findUserByEmail(userEmail)
        .then(result => { if (result?.fields) setUserRecord(result.fields); })
        .catch(() => {});
      setScreen("chat");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── LOGIN ──────────────────────────────────────────────────
  async function handleLogin(email) {
    const { recordId: rid, fields } = await findOrCreateUser(email);
    if (!rid) throw new Error("לא ניתן למצוא או ליצור משתמש");

    setUserEmail(email);
    setUserRecord(fields);
    setRecordId(rid);
    localStorage.setItem("syncca_email",     email);
    localStorage.setItem("syncca_record_id", rid);

    // Track sync count silently — never shown to user
    const countKey  = `syncca_sync_count_${email}`;
    const prevCount = parseInt(localStorage.getItem(countKey) || "0", 10);
    const newCount  = (fields.Sync_Count || prevCount) + 1;
    localStorage.setItem(countKey, String(newCount));
    await incrementSyncCount(rid, fields.Sync_Count || 0);
    setUserRecord(prev => ({ ...(prev || fields), Sync_Count: newCount }));

    // Create Conversation_Logs record for this session
    const logId = await createSessionLog(rid).catch(() => null);
    setLogRecordId(logId);

    // Fresh session with opening message
    setSessionStartTime(new Date());
    setMessages([{
      role: "syncca",
      text: SYNCCA_OPENING_MESSAGE["he"],
      concepts: [],
      timestamp: new Date().toISOString(),
    }]);
    setConceptsIntroduced([]);

    if (shouldShowBetaModal()) setShowBetaModal(true);
    setScreen("chat");
  }

  // ── SEND MESSAGE ───────────────────────────────────────────
  const handleSend = useCallback(async (text) => {
    const userMsg = { role: "user", text, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Filter opening message from API history, format for Anthropic
      const openingText = SYNCCA_OPENING_MESSAGE["he"];
      const apiMessages = updatedMessages
        .filter(m => m.text !== openingText)
        .map(m => ({
          role:    m.role === "user" ? "user" : "assistant",
          content: m.text,
        }));

      const elapsed = sessionStartTime
        ? Math.floor((Date.now() - new Date(sessionStartTime).getTime()) / 60000)
        : 0;

      // ✓ Uses the proper 4-layer SynccaService system prompt
      const rawResponse = await sendToSyncca(apiMessages, elapsed);
      const { visibleText } = parseResponse(rawResponse);

      // Parse [[bracket]] concepts
      const { cleanText, concepts } = parseBracketConcepts(visibleText, CONCEPT_LEXICON);

      if (concepts.length > 0) {
        setConceptsIntroduced(prev => [
          ...prev,
          ...concepts.map(c => c.word).filter(w => !prev.includes(w)),
        ]);
      }

      const synccaMsg = {
        role: "syncca",
        text: cleanText,
        concepts,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, synccaMsg]);

      // Build transcript and sync to Conversation_Logs
      const allMsgs = [...updatedMessages, synccaMsg];
      const transcript = allMsgs
      // שורות 290-292 המעודכנות:
.map(m => `[${m.role === "user" ? "User" : "Syncca"}]: ${m.text}`)
.join("\n");
      const conceptWords = concepts.map(c => c.word);
      syncSession({
        logRecordId,
        fullTranscript: transcript,
        conceptsSurfaced: conceptWords,
      }).catch(e => console.warn("syncSession failed:", e));

    } catch (err) {
      console.error("Syncca API error:", err);
      setMessages(prev => [...prev, {
        role: "syncca",
        text: "מצטערת, הייתה תקלה טכנית. נסי שוב.",
        concepts: [],
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, sessionStartTime]);

  // ── SAVE CONCEPT ──────────────────────────────────────────
  function handleSaveConcept(concept) {
    setSavedConcepts(prev => {
      if (prev.find(c => c.word === concept.word)) return prev;
      return [...prev, concept];
    });
  }

  // ── LOGOUT ────────────────────────────────────────────────
  function handleLogout() {
    localStorage.removeItem("syncca_email");
    localStorage.removeItem("syncca_record_id");
    setUserEmail(""); setRecordId(""); setUserRecord(null);
    setMessages([]); setScreen("welcome");
  }

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
        <LoginScreen
          onLogin={handleLogin}
          onBack={() => setScreen("welcome")}
        />
      )}

      {screen === "chat" && (
        <ChatScreen
          userEmail={userEmail}
          firstName={firstName}
          messages={messages}
          isLoading={isLoading}
          onSend={handleSend}
          onSaveConcept={handleSaveConcept}
          onOpenPersonalCard={() => setScreen("personal")}
          onTimeout={() => setShowTimeoutModal(true)}
          sessionStartTime={sessionStartTime}
        />
      )}

      {screen === "personal" && (
        <PersonalCard
          record={{ ...userRecord, email: userEmail }}
          airtableRecordId={recordId}
          logRecordId={logRecordId}
          savedConcepts={savedConcepts}
          onClose={() => setScreen("chat")}
          onLogout={handleLogout}
        />
      )}

      {showBetaModal    && <BetaModal    onClose={() => setShowBetaModal(false)} />}
      {showTimeoutModal && <TimeoutModal onClose={() => { setShowTimeoutModal(false); setScreen("welcome"); }} />}
    </>
  );
}
