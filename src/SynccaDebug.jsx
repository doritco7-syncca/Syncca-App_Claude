// SynccaDebug.jsx — paste this into your browser console OR
// temporarily add <SynccaDebug /> inside App.jsx to diagnose.
// Shows last 10 Airtable calls + results in a floating panel.
// REMOVE before production.

import { useState, useEffect } from "react";

// ── Monkey-patch fetch to log Airtable calls ──────────────────────
// Call installDebugLogger() once at app startup (e.g. top of App.jsx)
export function installDebugLogger() {
  if (window.__synccaDebugInstalled) return;
  window.__synccaDebugInstalled = true;
  window.__synccaLog = [];

  const origFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const url     = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
    const method  = args[1]?.method || "GET";
    const isAirt  = url.includes("airtable.com");
    const isClaude= url.includes("anthropic.com");
    if (!isAirt && !isClaude) return origFetch(...args);

    const label = isAirt
      ? `[Airtable] ${method} ${url.split("/v0/")[1]?.slice(0,60) || url.slice(-60)}`
      : `[Claude] ${method}`;

    const entry = { label, status: "pending", ts: Date.now(), error: null, body: null };
    window.__synccaLog = [entry, ...window.__synccaLog.slice(0, 19)];
    window.dispatchEvent(new Event("syncca-log-update"));

    try {
      const res  = await origFetch(...args);
      const clone= res.clone();
      clone.json().then(data => {
        entry.status = res.ok ? "ok" : "error";
        entry.statusCode = res.status;
        entry.body = res.ok ? null : JSON.stringify(data?.error || data).slice(0, 200);
        window.dispatchEvent(new Event("syncca-log-update"));
      }).catch(() => {});
      return res;
    } catch (err) {
      entry.status = "throw";
      entry.body   = err.message;
      window.dispatchEvent(new Event("syncca-log-update"));
      throw err;
    }
  };
}

// ── Debug panel component ─────────────────────────────────────────
export default function SynccaDebug({ visible = true }) {
  const [log, setLog] = useState([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    installDebugLogger();
    const handler = () => setLog([...(window.__synccaLog || [])]);
    window.addEventListener("syncca-log-update", handler);
    return () => window.removeEventListener("syncca-log-update", handler);
  }, []);

  if (!visible) return null;

  const colors = { ok: "#16a34a", error: "#dc2626", pending: "#d97706", throw: "#7c3aed" };

  return (
    <div style={{
      position: "fixed", bottom: 8, left: 8, zIndex: 9999,
      background: "#1e1e1e", borderRadius: 12, color: "#fff",
      fontSize: 11, fontFamily: "monospace", maxWidth: 420,
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      maxHeight: open ? 360 : 36, overflow: "hidden",
      transition: "max-height 0.2s",
    }}>
      <div onClick={() => setOpen(o => !o)} style={{
        padding: "8px 12px", cursor: "pointer", background: "#333",
        borderRadius: "12px 12px 0 0", display: "flex", justifyContent: "space-between",
      }}>
        <span>🔍 Syncca Debug ({log.length} calls)</span>
        <span>{open ? "▾" : "▸"}</span>
      </div>
      {open && (
        <div style={{ padding: "8px 12px", overflowY: "auto", maxHeight: 320 }}>
          {log.length === 0 && <div style={{ color: "#888" }}>No calls yet...</div>}
          {log.map((entry, i) => (
            <div key={i} style={{ marginBottom: 6, borderBottom: "1px solid #333", paddingBottom: 4 }}>
              <span style={{ color: colors[entry.status] || "#fff" }}>
                {entry.status === "pending" ? "⏳" : entry.status === "ok" ? "✓" : "✗"}
                {" "}{entry.statusCode ? `[${entry.statusCode}] ` : ""}
              </span>
              <span style={{ color: "#ccc" }}>{entry.label}</span>
              {entry.body && (
                <div style={{ color: "#f87171", marginTop: 2, wordBreak: "break-all" }}>
                  {entry.body}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
