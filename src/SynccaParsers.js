// SynccaParsers.js — Syncca
// Contains: parseResponse(), detectConceptsFromText()
// Edit this file only if changing metadata format or concept detection logic.

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

// Extracts concepts directly from Syncca's [[bracketed]] output.
// Source of truth: Syncca's own response — not a local keyword map.
// This ensures saved concept names are always exactly what Syncca introduced.
export function detectConceptsFromText(text) {
  if (!text) return [];
  const found = new Set();
  const bracketRegex = /\[\[([^\]]+)\]\]/g;
  let match;
  while ((match = bracketRegex.exec(text)) !== null) {
    found.add(match[1].trim());
  }
  return Array.from(found);
}
