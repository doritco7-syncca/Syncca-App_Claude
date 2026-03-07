// App.jsx — Syncca · Main Application Router
// Connects: WelcomeScreen → LoginScreen → ChatScreen ↔ PersonalCard

import { useState, useEffect, useCallback } from "react";
import WelcomeScreen  from "./components/WelcomeScreen";
import LoginScreen    from "./components/LoginScreen";
import ChatScreen     from "./components/ChatScreen";
import PersonalCard   from "./components/PersonalCard";
import {
  findOrCreateUser,
  incrementSyncCount,
} from "./AirtableService";

const ANTHROPIC_KEY = process.env.REACT_APP_ANTHROPIC_KEY;

// ─── BETA MODAL LOGIC (show only first 2 sessions) ───────────────
function shouldShowBetaModal() {
  const count = parseInt(localStorage.getItem("syncca_session_count") || "0", 10);
  const next  = count + 1;
  localStorage.setItem("syncca_session_count", String(next));
  return next <= 2;
}

// ─── SYNCCA AI SYSTEM PROMPT ─────────────────────────────────────
// This is the "brain" — defines when and how to introduce concepts
function buildSystemPrompt(syncCount, userFirstName, conceptsIntroduced) {
  const firstName = userFirstName || "את/ה";
  const isEarlySyncs = syncCount < 3;

  const conceptsAlreadyUsed = conceptsIntroduced.length > 0
    ? `\nConcepts already introduced in this session: ${conceptsIntroduced.join(", ")}. Do NOT repeat them unless the user asks.`
    : "";

  const conceptInstructions = isEarlySyncs
    ? `
CONCEPT RULE (Sync #${syncCount}): This is an early sync. Your role right now is to LISTEN and ASK QUESTIONS ONLY.
- Do NOT introduce highlighted concepts yet.
- Ask open, warm, non-leading questions to understand the user's situation.
- Show empathy. Reflect back what you hear.
- Maximum 1-2 questions per message.
- Keep responses short (2-4 sentences).
- Do NOT lecture or explain methodology.
`
    : `
CONCEPT RULE (Sync #${syncCount}): This is sync #${syncCount}. You may now gently introduce relevant concepts.
- When you use a key concept, mark it with double asterisks: **concept_name** 
- Introduce AT MOST 1-2 concepts per message. Don't flood with terms.
- Always explain the concept naturally within the sentence — don't just label it.
- Continue asking questions alongside any explanation.
- Concepts from the Syncca lexicon you may use when relevant:
  בקשה נקייה, סנקציות, הפרעה, תוכנית ב, מערכת לימבית, קורטקס, פיוס, מלחמה, היררכיה, אוטונומיה זוגית, כן שבא מאהבה, לא שבא מהגנה עצמית
${conceptsAlreadyUsed}
`;

  return `You are Syncca — a warm, wise, professional relationship communication guide.
You are based on 20 years of interpersonal and couples communication methodology developed by Dr. Dorit Cohen.
You converse in Hebrew unless the user writes in another language.
You are NOT a therapist. You are a communication guide.
Your tone: warm, direct, non-judgmental, occasionally poetic.

The user's name is ${firstName}.
This is their sync number: ${syncCount}.

${conceptInstructions}

RESPONSE FORMAT:
- Write in Hebrew (or match the user's language).
- Keep responses conversational and focused — not long essays.
- When you use a marked concept (**like_this**), the UI will highlight it automatically.
- Never use bullet points or numbered lists in your responses.
- Never start with "כמובן" or "בהחלט" or "נהדר".
- End with either a question or a warm reflection — never a lecture.`;
}

// ─── PARSE CONCEPTS FROM AI RESPONSE ────────────────────────────
// Extracts **marked** words and returns clean text + concepts array
function parseConceptsFromResponse(rawText, conceptLexicon) {
  const concepts = [];
  const cleanText = rawText.replace(/\*\*([^*]+)\*\*/g, (match, word) => {
    const trimmed = word.trim();
    const lexEntry = conceptLexicon.find(c =>
      c.word === trimmed || trimmed.includes(c.word)
    );
    concepts.push({
      word: trimmed,
      explanation: lexEntry?.explanation || "",
    });
    return trimmed; // remove ** from displayed text
  });
  return { cleanText, concepts };
}

// ─── CONCEPT LEXICON (from syncca-lexicon-seed.json logic) ───────
const CONCEPT_LEXICON = [
  { word: "בקשה נקייה",      explanation: "בקשה שמשאירה לפרטנר חופש בחירה אמיתי — ללא לחץ, ללא ציפייה מובלעת, ומתוך הכנה לתשובה שלילית." },
  { word: "סנקציות",         explanation: "תגובות לא נעימות כלפי הפרטנר — ביקורת, פנים כועסות, שתיקה, ריחוק — שמפעילות את המערכת הלימבית ומונעות קשר אמיתי." },
  { word: "הפרעה",           explanation: "כשאנחנו מגישים בקשה, אנחנו מפריעים לזרימה הטבעית של הפרטנר. הכרה בכך היא בסיס הבקשה הנקייה." },
  { word: "תוכנית ב",        explanation: "תכנית גיבוי עצמאית שמאפשרת להגיש בקשה ללא לחץ — כי גם אם הפרטנר יגיד לא, יש לי פתרון אחר." },
  { word: "מערכת לימבית",    explanation: "המערכת הרגשית-קדומה במוח שמופעלת בתגובה לאיום. כשהיא פעילה, קשה לחשוב בצורה פתוחה ואמפתית." },
  { word: "קורטקס",          explanation: "מערכת החשיבה הרציונלית. כשאין פחד מסנקציות, הקורטקס יכול לשקול בקשות בצורה פתוחה ואוהבת." },
  { word: "פיוס",            explanation: "דפוס שבו אחד הפרטנרים מוותר על עצמו כדי להשכיך מתח — אך מצבור כעס ותסכול בפנים." },
  { word: "מלחמה",           explanation: "דפוס שבו שני הפרטנרים נלחמים על שליטה, אף אחד לא מוותר, ואין מי שמבצע." },
  { word: "כן שבא מאהבה",    explanation: "כשאין פחד מסנקציות, ה'כן' של הפרטנר בא מרצון אמיתי ואהבה — לא מחובה או פחד." },
  { word: "לא שבא מהגנה עצמית", explanation: "לא שמגיע מתוך שמירה על הצרכים, הערכים או הגבולות שלי — ולא מנקמה או סירוב." },
  { word: "היררכיה",         explanation: "במערכות עם היררכיה, הדרישות טבעיות. בזוגיות שווה, דרישה יוצרת התנגדות." },
  { word: "אוטונומיה זוגית", explanation: "תחושת החופש והעצמאות של כל אחד בתוך הזוגיות — תנאי הכרחי לאהבה בריאה." },
];

// ─── CALL CLAUDE API (via SynccaService or direct) ───────────────
async function callClaudeAPI(messages, systemPrompt) {
  // If you have SynccaService.js handling the API call, import and use it.
  // Otherwise this calls Claude directly (needs VITE_ANTHROPIC_KEY in env).
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      // Note: In production, NEVER expose API key in frontend.
      // Route through a Vercel serverless function instead.
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 600,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      })),
    }),
  });
  const data = await response.json();
  return data.content?.[0]?.text || "";
}

// ─── TIMEOUT MODAL ───────────────────────────────────────────────
function TimeoutModal({ onClose }) {
  const [feedback, setFeedback] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSend() {
    // Optionally save feedback to Airtable here
    setSent(true);
    setTimeout(onClose, 2000);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.25)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      <div style={{
        background: "#EFF6FF",
        borderRadius: "24px",
        border: "1.5px solid rgba(30,58,138,0.15)",
        padding: "28px 24px",
        maxWidth: "380px", width: "100%",
        direction: "rtl",
        boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
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
          הזמן המיועד להתבוננות ממוקדת הסתיים, וזהו רגע טוב לעצור ולעודד חשיבה עצמאית על הדברים שעלו.
        </p>
        {!sent ? (
          <>
            <label style={{
              display: "block", fontFamily: "'Inter', sans-serif",
              fontSize: "0.8rem", fontWeight: 600, color: "#1e3a8a",
              marginBottom: "8px",
            }}>
              לפני שנפרדים, נשמח לפידבק:
            </label>
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
                direction: "rtl",
              }}
            />
            <button onClick={handleSend} style={{
              marginTop: "12px", width: "100%", height: "48px",
              background: "#1e3a8a", color: "white",
              border: "none", borderRadius: "9999px",
              fontFamily: "'Inter', sans-serif", fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(30,58,138,0.28)",
            }}>
              שלח פידבק וסיים
            </button>
          </>
        ) : (
          <div style={{
            textAlign: "center", color: "#16a34a",
            fontFamily: "'Inter', sans-serif", fontWeight: 600,
          }}>
            ✓ תודה! נתראה בסינק הבא.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BETA WELCOME MODAL ──────────────────────────────────────────
function BetaModal({ onClose }) {
  const items = [
    "המערכת מבוססת על מודל בינה מלאכותית claude ועל מתודולוגיה של תקשורת בין אישית וזוגית שפותחה בעשרים השנים האחרונות.",
    "במהלך השיחה יופיעו מושגים צבועים ומודגשים. לחיצה עליהם תפתח הסבר שיעזור להעמיק בשפה של 'זוגיות נקייה'. כל מושג שתשמרו יחכה לכם בכרטיס האישי שלכם.",
    "כל שיחה מוגבלת ל-30 דקות. זהו זמן המיועד להתבוננות ממוקדת ולעידוד חשיבה עצמאית.",
    "הפידבק עוזר לנו לצמוח. בסיום השיחה, נשמח לשמוע מה כדאי להוסיף, להוריד או לשנות ב-Syncca.",
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
        direction: "rtl",
        boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
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
          boxShadow: "0 4px 14px rgba(234,88,12,0.30)",
        }}>
          הבנתי, בואנו ✦
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────
export default function App() {
  // ── Screen state ──
  const [screen, setScreen] = useState("welcome"); // welcome | login | chat | personal

  // ── User state ──
  const [userEmail,    setUserEmail]    = useState(() => localStorage.getItem("syncca_email") || "");
  const [userRecord,   setUserRecord]   = useState(null); // full Airtable record fields
  const [recordId,     setRecordId]     = useState(() => localStorage.getItem("syncca_record_id") || "");

  // ── Chat state ──
  const [messages,          setMessages]          = useState([]);
  const [sessionStartTime,  setSessionStartTime]  = useState(null);
  const [conceptsIntroduced,setConceptsIntroduced] = useState([]);
  const [savedConcepts,     setSavedConcepts]      = useState([]);
  const [isLoading,         setIsLoading]          = useState(false);

  // ── Modal state ──
  const [showBetaModal,    setShowBetaModal]    = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);

  // ── Derived ──
  const syncCount  = userRecord?.Sync_Count || 0;
  const firstName  = userRecord?.First_Name || "";

  // Auto-navigate if already logged in
  useEffect(() => {
    if (userEmail && recordId) {
      setScreen("chat");
    }
  }, []);

  // ── LOGIN ──────────────────────────────────────────────────────
  async function handleLogin(email) {
    const { recordId: rid, fields, isNew } = await findOrCreateUser(email);

    if (!rid) {
      throw new Error("לא ניתן למצוא או ליצור משתמש — בדקי את פרטי Airtable");
    }

    setUserEmail(email);
    setUserRecord(fields);
    setRecordId(rid);
    localStorage.setItem("syncca_email",     email);
    localStorage.setItem("syncca_record_id", rid);

    // Track sync count — save to Airtable AND localStorage
    const countKey = `syncca_sync_count_${email}`;
    const prevCount = parseInt(localStorage.getItem(countKey) || "0", 10);
    const newCount = (fields.Sync_Count || prevCount) + 1;
    localStorage.setItem(countKey, String(newCount));
    await incrementSyncCount(rid, fields.Sync_Count || 0);
    setUserRecord(prev => ({ ...prev, Sync_Count: newCount }));

    // Start session
    const now = new Date();
    setSessionStartTime(now);
    setMessages([]);
    setConceptsIntroduced([]);

    // Beta modal logic
    if (shouldShowBetaModal()) setShowBetaModal(true);

    setScreen("chat");
  }

  // ── SEND MESSAGE ───────────────────────────────────────────────
  const handleSend = useCallback(async (text) => {
    // Add user message immediately
    const userMsg = { role: "user", text, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(syncCount, firstName, conceptsIntroduced);
      const rawResponse  = await callClaudeAPI(updatedMessages, systemPrompt);
      const { cleanText, concepts } = parseConceptsFromResponse(rawResponse, CONCEPT_LEXICON);

      // Track which concepts have been introduced this session
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

    } catch (err) {
      console.error("Claude API error:", err);
      setMessages(prev => [...prev, {
        role: "syncca",
        text: "מצטערת, הייתה תקלה טכנית. נסי שוב.",
        concepts: [],
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, syncCount, firstName, conceptsIntroduced]);

  // ── SAVE CONCEPT (from tooltip click) ─────────────────────────
  function handleSaveConcept(concept) {
    setSavedConcepts(prev => {
      if (prev.find(c => c.word === concept.word)) return prev;
      return [...prev, concept];
    });
  }

  // ── LOGOUT ─────────────────────────────────────────────────────
  function handleLogout() {
    localStorage.removeItem("syncca_email");
    localStorage.removeItem("syncca_record_id");
    setUserEmail(""); setRecordId(""); setUserRecord(null);
    setMessages([]); setScreen("welcome");
  }

  // ─── RENDER ──────────────────────────────────────────────────
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
          savedConcepts={savedConcepts}
          onClose={() => setScreen("chat")}
        />
      )}

      {showBetaModal    && <BetaModal    onClose={() => setShowBetaModal(false)} />}
      {showTimeoutModal && <TimeoutModal onClose={() => { setShowTimeoutModal(false); setScreen("welcome"); }} />}
    </>
  );
}
