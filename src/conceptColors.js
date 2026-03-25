// conceptColors.js — Syncca
// Category → color mapping for concept pills and tooltips

export function getConceptColors(concept) {
  const cat = concept?.category || "";
  if (!cat) return {
    bg: "rgba(254,215,170,0.35)", border: "rgba(198,40,40,0.4)",
    text: "#C62828", headerBg: "#FFF0E8"
  };
  if (cat.includes("Survival") || cat.includes("Toxin"))
    return { bg: "#FFCDD2", border: "#E57373", text: "#B71C1C", headerBg: "#FFEBEE" };
  if (cat.includes("Clean") || cat.includes("Love") || cat.includes("Communication"))
    return { bg: "#C8E6C9", border: "#81C784", text: "#2E7D32", headerBg: "#E8F5E9" };
  if (cat.includes("Biological") || cat.includes("Separateness") || cat.includes("Space"))
    return { bg: "#BBDEFB", border: "#64B5F6", text: "#1565C0", headerBg: "#E3F2FD" };
  return {
    bg: "rgba(254,215,170,0.35)", border: "rgba(198,40,40,0.4)",
    text: "#C62828", headerBg: "#FFF0E8"
  };
}
