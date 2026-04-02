// SynccaParsers.js — Syncca
// Contains: parseResponse(), detectConceptsFromText()
// Edit this file only if changing metadata format or concept detection logic.

import { LEXICON_DETECTION_MAP } from "./lexicon/LexiconPrompt.js";

export function parseResponse(rawResponse) {
  const metaRegex = /<!--SYNCCA_META\s*([\s\S]*?)-->/;
  const match     = rawResponse.match(metaRegex);
  let meta = null;
  if (match) {
    try { meta = JSON.parse(match[1].trim()); }
    catch (e) { console.warn("[parseResponse] Failed to parse SYNCCA_META:", e); }
  }

  const securityAlert = rawResponse.includes("[SECURITY_ALERT]");
  const visibleText = rawResponse
    .replace(metaRegex, "")
    .replace(/\[SECURITY_ALERT\]/g, "")
    .trim();

  return { visibleText, meta, securityAlert };
}

export function detectConceptsFromText(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const found = new Set();
  for (const [signal, term] of Object.entries(LEXICON_DETECTION_MAP)) {
    if (lower.includes(signal.toLowerCase())) found.add(term);
  }
  return Array.from(found);
}
