// ============================================================
// components/SessionTimer.jsx
// ROLE: Displays the 30-minute session timer as a gentle arc
// that fills over time. At 25 minutes remaining, the arc
// pulses softly to signal the Time Wrap. Calls onEnd() when
// the full 30 minutes have elapsed. All durations are props
// so they can be changed from ChatContainer without touching
// this file.
// ============================================================

import { useState, useEffect } from "react";
import { Theme } from "../Theme.js";
import { t, UI_STRINGS } from "../UI_STRINGS.js";

const SIZE      = 40;   // SVG canvas size (px)
const RADIUS    = 16;   // Arc radius
const STROKE    = 2.5;  // Arc stroke width
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function SessionTimer({ startTime, durationMs, onEnd }) {
  const [elapsed, setElapsed] = useState(0); // ms

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const e = Date.now() - new Date(startTime).getTime();
      setElapsed(e);
      if (e >= durationMs) {
        clearInterval(interval);
        onEnd?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, durationMs, onEnd]);

  const progress    = Math.min(elapsed / durationMs, 1);
  const remaining   = Math.max(durationMs - elapsed, 0);
  const minutes     = Math.floor(remaining / 60000);
  const seconds     = Math.floor((remaining % 60000) / 1000);
  const isWarning   = remaining <= 5 * 60 * 1000 && remaining > 0;
  const strokeColor = isWarning
    ? Theme.colors.timerWarning
    : Theme.colors.timerFill;

  // Arc: starts at top (−90°), fills clockwise
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div
      style={{
        ...styles.wrapper,
        animation: isWarning ? "timerPulse 2s ease-in-out infinite" : "none",
      }}
      title={t(UI_STRINGS.chat.timerLabel)}
      aria-label={`${t(UI_STRINGS.chat.timerLabel)}: ${timeStr}`}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={styles.svg}
      >
        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={Theme.colors.timerTrack}
          strokeWidth={STROKE}
        />
        {/* Fill arc */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
        {/* Time text */}
        <text
          x={SIZE / 2}
          y={SIZE / 2 + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isWarning ? Theme.colors.timerWarning : Theme.colors.textSecondary}
          fontSize="8"
          fontFamily={Theme.fonts.ui}
          fontWeight="500"
        >
          {timeStr}
        </text>
      </svg>

      <style>{`
        @keyframes timerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: {
    display:    "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor:     "default",
  },
  svg: {
    display: "block",
  },
};
