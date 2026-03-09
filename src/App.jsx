// App.jsx — Syncca · Main Application Router
// Connects: WelcomeScreen → LoginScreen → ChatScreen ↔ PersonalCard
// AI brain lives in SynccaService.js — this file only manages routing + state.

import { useState, useEffect, useCallback, useRef } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen   from "./components/LoginScreen";
import ChatScreen    from "./components/ChatScreen";
import PersonalCard  from "./components/PersonalCard";
import { findOrCreateUser, findUserByEmail, incrementSyncCount, createSessionLog, syncSession, updateSavedConcepts, fetchLexicon } from "./AirtableService";
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
// CONCEPT_LEXICON is loaded from Airtable at startup (see useEffect below)
// Fallback entries used only if Airtable fetch fails
const FALLBACK_LEXICON = [
  { englishTerm: "Limbic System",  word: "מערכת לימבית",      explanation: "המערכת הרגשית-קדומה במוח שמופעלת בתגובה לאיום." },
  { englishTerm: "Cortex",         word: "קורטקס",             explanation: "מערכת החשיבה הרציונלית." },
  { englishTerm: "Clean Request",  word: "בקשה נקייה",         explanation: "בקשה שמשאירה לפרטנר חופש בחירה אמיתי." },
  { englishTerm: "Sanction",       word: "סנקציה",             explanation: "תגובה לא נעימה כלפי הפרטנר." },
  { englishTerm: "Demand",         word: "דרישה",              explanation: "ביטוי כוחני של צורך." },
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
  const [savedConcepts,      setSavedConcepts]      = useState([]);
  const [logRecordId,        setLogRecordId]        = useState(null);
  const logRecordIdRef = useRef(null);  // ref to avoid stale closure in handleSend
  const [isLoading,          setIsLoading]          = useState(false);
  // useRef avoids stale-closure bug — always holds current transcript value
  const fullTranscriptRef    = useRef("");
  const conceptsIntroducedRef = useRef([]);

  const [conceptLexicon,   setConceptLexicon]   = useState(FALLBACK_LEXICON);
  const [showBetaModal,    setShowBetaModal]    = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);

  const firstName = userRecord?.First_Name || "";

  // Auto-go to chat if returning user
  // Fetch live lexicon from Airtable on mount
  useEffect(() => {
    fetchLexicon()
      .then(entries => {
        if (entries?.length > 0) {
          setConceptLexicon(entries);
          console.log("[Lexicon] Loaded", entries.length, "concepts from Airtable");
        }
      })
      .catch(e => console.warn("[Lexicon] Failed to load, using fallback:", e));
  }, []);

  useEffect(() => {
    if (userEmail && recordId) {
      // Load user record
      findUserByEmail(userEmail)
        .then(result => { if (result?.fields) setUserRecord(result.fields); })
        .catch(() => {});

      // Create a session log for this returning session
      createSessionLog(recordId)
        .then(logId => {
          setLogRecordId(logId); logRecordIdRef.current = logId;
          setSessionStartTime(new Date());
        })
        .catch(() => {});

      // Show opening message
      fullTranscriptRef.current = "";
      conceptsIntroducedRef.current = [];
      setMessages([{
        role: "syncca",
        text: SYNCCA_OPENING_MESSAGE["he"],
        concepts: [],
        timestamp: new Date().toISOString(),
      }]);

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
    setLogRecordId(logId); logRecordIdRef.current = logId;

    // Fresh session with opening message
    setSessionStartTime(new Date());
    fullTranscriptRef.current = "";
    conceptsIntroducedRef.current = [];
    setMessages([{
      role: "syncca",
      text: SYNCCA_OPENING_MESSAGE["he"],
      concepts: [],
      timestamp: new Date().toISOString(),
    }]);
    conceptsIntroducedRef.current = [];

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
      const rawResponse = await sendToSyncca(apiMessages, elapsed, conceptLexicon);
      const { visibleText } = parseResponse(rawResponse);

      // Parse [[bracket]] concepts
      const { cleanText, concepts } = parseBracketConcepts(visibleText, conceptLexicon);

      if (concepts.length > 0) {
        const newWords = concepts.map(c => c.word).filter(w => !conceptsIntroducedRef.current.includes(w));
        conceptsIntroducedRef.current = [...conceptsIntroducedRef.current, ...newWords];
      }

      const synccaMsg = {
        role: "syncca",
        text: cleanText,
        concepts,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, synccaMsg]);

      // Append this exchange — ref always holds current value, no stale closure
      const prev = fullTranscriptRef.current;
      const newTranscript = prev
        ? prev + "\n[User]: " + text + "\n[Syncca]: " + cleanText
        : "[User]: " + text + "\n[Syncca]: " + cleanText;
      fullTranscriptRef.current = newTranscript;

      // Use ref for logRecordId — avoids stale closure
      const currentLogId = logRecordIdRef.current;
      console.log("[Transcript] Exchange synced. logRecordId:", currentLogId, "length:", newTranscript.length);
      if (currentLogId) {
        syncSession({
          logRecordId:      currentLogId,
          fullTranscript:   newTranscript,
          conceptsSurfaced: conceptsIntroducedRef.current,
        }).catch(e => console.warn("syncSession failed:", e));
      } else {
        console.warn("[Transcript] logRecordId is null — syncSession skipped");
      }

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
  }, [messages, sessionStartTime, logRecordId]);

  // ── SAVE CONCEPT ──────────────────────────────────────────
  function handleSaveConcept(concept) {
    setSavedConcepts(prev => {
      if (prev.find(c => c.word === concept.word)) return prev;
      const updated = [...prev, concept];

      // Persist to Users.Saved_Concepts
      if (recordId) {
        updateSavedConcepts(recordId, updated.map(c => c.word))
          .catch(e => console.warn("updateSavedConcepts failed:", e));
      }

      // Persist to Conversation_Logs.Concepts_Surfaced
      if (logRecordId) {
        syncSession({
          logRecordId,
          conceptsSurfaced: updated.map(c => c.word),
        }).catch(e => console.warn("syncSession concepts failed:", e));
      }

      return updated;
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
          conceptLexicon={conceptLexicon}
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
