// SynccaAPI.js — Syncca
// Contains: sendToSyncca(), generateSessionInsight()
// Edit this file for model changes, token limits, or API behavior.

import { buildSystemPrompt } from "./SynccaPrompt.js";
// Auto-brackets first-mention lexicon concepts Syncca wrote as plain text.
// Runs as a post-processor on every response, before returning to the UI.
function autoHighlightConcepts(rawText, liveLexicon) {
  if (!liveLexicon || liveLexicon.length === 0) return rawText;

  // Isolate the hidden meta block — never modify it
  const metaRegex = /<!--SYNCCA_META[\s\S]*?-->/;
  const metaMatch = rawText.match(metaRegex);
  const metaBlock = metaMatch ? metaMatch[0] : "";
  let visibleText = rawText.replace(metaRegex, "");

  // Record concepts already bracketed by Syncca
  const alreadyBracketed = new Set();
  const bracketRegex = /\[\[([^\]]+)\]\]/g;
  let m;
  while ((m = bracketRegex.exec(visibleText)) !== null) {
    alreadyBracketed.add(m[1].trim().toLowerCase());
  }

  let addedCount = 0;
  const MAX_AUTO = 3;

  for (const concept of liveLexicon) {
    if (addedCount >= MAX_AUTO) break;

    const termEn = concept.englishTerm;
    if (!termEn || alreadyBracketed.has(termEn.toLowerCase())) continue;

    const escaped = termEn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");

    // Split on existing [[brackets]] — only replace in plain-text segments
    const parts = visibleText.split(/(\[\[[^\]]+\]\])/);
    let found = false;
    const newParts = parts.map(part => {
      if (found || part.startsWith("[[")) return part;
      if (regex.test(part)) {
        found = true;
        return part.replace(regex, `[[${termEn}]]`);
      }
      return part;
    });

    if (found) {
      visibleText = newParts.join("");
      alreadyBracketed.add(termEn.toLowerCase());
      addedCount++;
    }
  }

  return metaBlock ? visibleText + "\n" + metaBlock : visibleText;
}
export async function sendToSyncca(messages, sessionMinutesElapsed = 0, liveLexicon = null, previousConcepts = [], userProfile = {}, sessionHistory = []) {
  const body = JSON.stringify({
    model:      "claude-sonnet-4-6",
    max_tokens: 1500,
    system:     buildSystemPrompt(sessionMinutesElapsed, liveLexicon, previousConcepts, userProfile, sessionHistory),
    messages,
  });

  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch("/api/syncca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (response.status === 529) {
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, attempt * 2000));
        continue;
      }
    }
    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Claude API error: ${JSON.stringify(err)}`);
    }
    const data = await response.json();
const rawText = data.content.map(b => b.type === "text" ? b.text : "").filter(Boolean).join("\n");
return autoHighlightConcepts(rawText, liveLexicon);  }
}

export async function generateSessionInsight(transcript, conceptsSurfaced = []) {
  if (!transcript || transcript.length < 100) return "";
  const conceptList = conceptsSurfaced.length
    ? `מושגים שנגעו בהם: ${conceptsSurfaced.join(", ")}.`
    : "";

  const prompt = `להלן תמליל שיחה בין סינקה לבין יוזר.
${conceptList}

כתבי 2-3 משפטים קצרים בעברית שמסכמים את השיחה — מה הנושא שהיוזר הביא, מה עלה בשיחה, ואיפה הם הגיעו.
חשוב: כתבי סיכום תמיד, גם אם לא הייתה תובנה או שינוי — כי הסיכום משמש לזיכרון לשיחה הבאה.
אם לא הייתה תנועה רגשית, ציינו את הנושא ואת הנקודה שבה הסתיימה השיחה.
כתבי בגוף שלישי ("הוא"/"היא" — ברר מהטקסט).
ענה אך ורק במשפטים, ללא כותרת, ללא תוספות.

תמליל:
${transcript.slice(-3000)}`;

  try {
    const response = await fetch("/api/syncca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json();
    return data.content?.[0]?.text?.trim() || "";
  } catch (e) {
    return "";
  }
}
    export async function generateSessionTitle(transcript, chatLang = "he") {
  if (!transcript || transcript.length < 50) return "";
  const instructions = {
    he: "כתוב כותרת קצרה בעברית (3-5 מילים) שנותנת את התמצית של השיחה. רק הכותרת, ללא גרשיים.",
    en: "Write a short title in English (3–5 words) capturing the emotional journey — poetic, not clinical. Return only the title, no quotes.",
    de: "Schreibe einen kurzen Titel auf Deutsch (3–5 Wörter) für die emotionale Reise — poetisch, nicht klinisch. Nur den Titel, keine Anführungszeichen.",
  };
  const instruction = instructions[chatLang] || instructions.en;
  try {
    const response = await fetch("/api/syncca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 30,
        messages: [{ role: "user", content: `${instruction}\n\nתמליל:\n${transcript.slice(-2000)}` }],
      }),
    });
    const data = await response.json();
    return data.content?.[0]?.text?.trim() || "";
  } catch (e) { return ""; }
}
