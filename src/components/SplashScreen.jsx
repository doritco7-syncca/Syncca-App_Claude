import { useEffect, useState } from "react";

export default function SplashScreen({ onDone }) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const t0 = setTimeout(() => setOpacity(1),    50);
    const t1 = setTimeout(() => setOpacity(0),  2200);
    const t2 = setTimeout(() => onDone?.(),     3000);
    return () => [t0, t1, t2].forEach(clearTimeout);
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "#F9F6EE",
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity,
      transition: opacity === 0 ? "opacity 0.8s ease" : "opacity 0.8s ease",
    }}>
      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontWeight: 700,
        fontSize: "4.5rem",
        color: "#C62828",
        letterSpacing: "-0.01em",
      }}>Syncca</div>
    </div>
  );
}
