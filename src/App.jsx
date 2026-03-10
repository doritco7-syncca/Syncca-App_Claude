// App.jsx — Syncca · Main Application Router
// Screen flow: welcome → login → chat ↔ personal
// All AI logic lives in SynccaService.js
// All Airtable logic lives in AirtableService.js

import { useState, useEffect, useCallback, useRef } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen   from "./components/LoginScreen";
import ChatScreen    from "./components/ChatScreen";
import PersonalCard  from "./components/PersonalCard";
import {
  findOrCreateUser,
  findUserByEmail,
  incrementSyncCount,
  createSessionLog,
  syncSession,
  updateSavedConcepts,
  fetchLexicon,
  fetchPreviousConcepts,
} from "./AirtableService";
import { sendToSyncca, parseResponse, SYNCCA_OPENING_MESSAGE } from "./SynccaService";

// ─── BETA MODAL — show on first 2 sessions ────────────────────────
function shouldShowBetaModal() {
  const count = parseInt(localStorage.getItem("syncca_session_count") || "0", 10);
  localStorage.setItem("syncca_session_count", String(count + 1));
  return count + 1 <= 2;
}

// ─── PARSE [[Bracket]] CONCEPTS from AI response ─────────────────
// Looks up each bracketed term in the live lexicon fetched from Airtable.
// Returns: cleanText (brackets replaced with Hebrew word) + concepts array.
function parseBracketConcepts(text, conceptLexicon) {
  const concepts = [];
  const cleanText = text.replace(/\[\[([^\]]+)\]\]/g, (_, term) => {
    const entry = conceptLexicon.find(
      c => c.englishTerm === term || c.word === term
    );
    if (entry) {
      concepts.push({
        word:        entry.word,
        explanation: entry.explanation,
        englishTerm: entry.englishTerm,
      });
      return entry.word; // show Hebrew word inline
    }
    // term not found in lexicon — show as-is, still record it
    concepts.push({ word: term, explanation: "", englishTerm: term });
    return term;
  });
  return { cleanText, concepts };
}

// ─── FALLBACK LEXICON — used only if Airtable fetch fails ────────
const FALLBACK_LEXICON = [
  { englishTerm: "Limbic System",  word: "מערכת לימבית", explanation: "המערכת הרגשית-קדומה במוח שמופעלת בתגובה לאיום." },
  { englishTerm: "Cortex",         word: "קורטקס",        explanation: "מערכת החשיבה הרציונלית." },
  { englishTerm: "Clean Request",  word: "בקשה נקייה",    explanation: "בקשה שמשאירה לפרטנר חופש בחירה אמיתי." },
  { englishTerm: "Sanction",       word: "סנקציה",        explanation: "תגובה לא נעימה כלפי הפרטנר." },
  { englishTerm: "Demand",         word: "דרישה",         explanation: "ביטוי כוחני של צורך." },
];

// ─── TIMEOUT MODAL ────────────────────────────────────────────────
function TimeoutModal({ onClose, logRecordId }) {
  const [feedback, setFeedback] = useState("");
  const [sent,     setSent]     = useState(false);

  async function handleSend() {
    if (logRecordId && feedback.trim()) {
      try {
        const { saveFeedback } = await import("./AirtableService");
        await saveFeedback(logRecordId, feedback.trim());
      } catch (e) { console.warn("saveFeedback failed:", e); }
    }
    setSent(true);
  }

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
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 700, color: "#1e3a8a", marginBottom: "10px" }}>
          זמן השיחה הסתיים
        </div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.88rem", color: "#374151", lineHeight: 1.6, marginBottom: "18px" }}>
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
            <button onClick={handleSend} style={{
              marginTop: "12px", width: "100%", height: "48px",
              background: "#1e3a8a", color: "white",
              border: "none", borderRadius: "9999px",
              fontFamily: "'Inter', sans-serif", fontWeight: 600,
              cursor: "pointer",
            }}>שלח פידבק וסיים</button>
          </>
        ) : (
          <div style={{ textAlign: "center", color: "#16a34a", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
            ✓ תודה! נתראה בסינק הבא.
          </div>
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

// ─── BETA MODAL ────────────────────────────────────────────────────
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
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 700, color: "#1e3a8a", marginBottom: "16px", textAlign: "center" }}>
          ברוכים ל-Syncca 👋
        </div>
        <ol style={{ paddingRight: "18px" }}>
          {items.map((item, i) => (
            <li key={i} style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.86rem", lineHeight: 1.65, marginBottom: "10px", color: "#1a1a1a" }}>
              {item}
            </li>
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

// ─── MAIN APP ──────────────────────────────────────────────────────
export default function App() {
  const [screen,    setScreen]    = useState("welcome");
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("syncca_email") || "");
  const [userRecord,setUserRecord]= useState(null);
  const [recordId,  setRecordId]  = useState(() => localStorage.getItem("syncca_record_id") || "");

  const [messages,         setMessages]         = useState([]);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [savedConcepts,    setSavedConcepts]    = useState([]);
  const [logRecordId,      setLogRecordId]      = useState(null);
  const [isLoading,        setIsLoading]        = useState(false);

  // Lexicon loaded from Airtable on mount
  const [conceptLexicon,   setConceptLexicon]   = useState(FALLBACK_LEXICON);

  // Refs — avoid stale closures in useCallback
  const logRecordIdRef         = useRef(null);
  const fullTranscriptRef      = useRef("");
  const conceptsIntroducedRef  = useRef([]);  // concepts surfaced THIS session
  const previousConceptsRef    = useRef([]);  // concepts from ALL prior sessions

  const [showBetaModal,    setShowBetaModal]    = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);

  const firstName = userRecord?.First_Name || "";

  // ── FETCH LEXICON ON MOUNT ─────────────────────────────────
  useEffect(() => {
    fetchLexicon()
      .then(entries => {
        if (entries?.length > 0) {
          setConceptLexicon(entries);
          console.log("[Lexicon] Loaded", entries.length, "concepts from Airtable");
        }
      })
      .catch(e => console.warn("[Lexicon] Fallback in use:", e));
  }, []);

  // ── AUTO-NAVIGATE returning user ───────────────────────────
  useEffect(() => {
    if (!userEmail || !recordId) return;

    (async () => {
      try {
        // Load user profile
        const result = await findUserByEmail(userEmail);
        if (result?.fields) setUserRecord(result.fields);

        // Load previous concepts for memory injection
        const prevConcepts = await fetchPreviousConcepts(recordId);
        previousConceptsRef.current = prevConcepts;
        console.log("[Memory] Previous concepts:", prevConcepts);

        // Create fresh session log
        const logId = await createSessionLog(recordId);
        setLogRecordId(logId);
        logRecordIdRef.current    = logId;
        fullTranscriptRef.current = "";
        conceptsIntroducedRef.current = [];

        setSessionStartTime(new Date());
        setMessages([{
          role: "syncca",
          text: SYNCCA_OPENING_MESSAGE["he"],
          concepts: [],
          timestamp: new Date().toISOString(),
        }]);
        setScreen("chat");
      } catch (e) {
        console.error("[AutoNav] Error:", e);
      }
    })();
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

    // Increment sync count
    await incrementSyncCount(rid, fields.Sync_Count || 0);

    // Load previous concepts for memory
    const prevConcepts = await fetchPreviousConcepts(rid).catch(() => []);
    previousConceptsRef.current = prevConcepts;
    console.log("[Memory] Previous concepts loaded:", prevConcepts);

    // Create session log
    const logId = await createSessionLog(rid).catch(() => null);
    setLogRecordId(logId);
    logRecordIdRef.current       = logId;
    fullTranscriptRef.current    = "";
    conceptsIntroducedRef.current = [];

    setSessionStartTime(new Date());
    setMessages([{
      role: "syncca",
      text: SYNCCA_OPENING_MESSAGE["he"],
      concepts: [],
      timestamp: new Date().toISOString(),
    }]);

    if (shouldShowBetaModal()) setShowBetaModal(true);
    setScreen("chat");
  }

  // ── SEND MESSAGE ───────────────────────────────────────────
  const handleSend = useCallback(async (text) => {
    const userMsg        = { role: "user", text, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Build API message history — exclude the static opening message
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

      // Call AI — pass live lexicon AND previous concepts for memory
      const rawResponse = await sendToSyncca(
        apiMessages,
        elapsed,
        conceptLexicon,
        previousConceptsRef.current
      );

      const { visibleText } = parseResponse(rawResponse);

      // Parse [[bracket]] concepts — looked up from live Airtable lexicon
      const { cleanText, concepts } = parseBracketConcepts(visibleText, conceptLexicon);

      // Accumulate this session's concepts
      if (concepts.length > 0) {
        const newWords = concepts
          .map(c => c.englishTerm)
          .filter(w => !conceptsIntroducedRef.current.includes(w));
        conceptsIntroducedRef.current = [...conceptsIntroducedRef.current, ...newWords];
      }

      const synccaMsg = {
        role: "syncca",
        text: cleanText,
        concepts,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, synccaMsg]);

      // Append to running transcript (ref — no stale closure)
      const prevTranscript    = fullTranscriptRef.current;
      const newTranscript     = prevTranscript
        ? prevTranscript + "\n[User]: " + text + "\n[Syncca]: " + cleanText
        : "[User]: " + text + "\n[Syncca]: " + cleanText;
      fullTranscriptRef.current = newTranscript;

      // Sync to Airtable — pass raw response so syncSession extracts [[brackets]]
      const currentLogId = logRecordIdRef.current;
      if (currentLogId) {
        syncSession({
          logRecordId:    currentLogId,
          fullTranscript: newTranscript,
          synccaResponse: visibleText,   // regex extracts [[ ]] inside syncSession
        }).catch(e => console.warn("[syncSession] failed:", e));
      } else {
        console.warn("[Transcript] logRecordId null — syncSession skipped");
      }

    } catch (err) {
      console.error("[Syncca API error]", err);
      setMessages(prev => [...prev, {
        role: "syncca",
        text: "מצטערת, הייתה תקלה טכנית. נסי שוב.",
        concepts: [],
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, sessionStartTime, conceptLexicon]);

  // ── SAVE CONCEPT — cumulative wallet ──────────────────────
  function handleSaveConcept(concept) {
    setSavedConcepts(prev => {
      if (prev.find(c => c.word === concept.word)) return prev;
      const updated = [...prev, concept];

      // Append to Users.Saved_Concepts (cumulative across sessions)
      if (recordId) {
        updateSavedConcepts(recordId, updated.map(c => c.englishTerm || c.word))
          .catch(e => console.warn("[updateSavedConcepts] failed:", e));
      }

      return updated;
    });
  }

  // ── LOGOUT ─────────────────────────────────────────────────
  function handleLogout() {
    localStorage.removeItem("syncca_email");
    localStorage.removeItem("syncca_record_id");
    setUserEmail(""); setRecordId(""); setUserRecord(null);
    setMessages([]);
    logRecordIdRef.current        = null;
    fullTranscriptRef.current     = "";
    conceptsIntroducedRef.current = [];
    previousConceptsRef.current   = [];
    setLogRecordId(null);
    setScreen("welcome");
  }

  // ── RENDER ─────────────────────────────────────────────────
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
          savedConcepts={savedConcepts}
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

      {showBetaModal && (
        <BetaModal onClose={() => setShowBetaModal(false)} />
      )}
      {showTimeoutModal && (
        <TimeoutModal
          logRecordId={logRecordId}
          onClose={() => { setShowTimeoutModal(false); setScreen("welcome"); }}
        />
      )}
    </>
  );
}
