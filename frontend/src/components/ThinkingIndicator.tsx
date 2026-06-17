"use client";

export default function ThinkingIndicator() {
  return (
    <div className="msg-enter" style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", alignItems: "flex-start" }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        background: "var(--accent-dim)",
        border: "1px solid rgba(45,122,79,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: 2,
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5" stroke="var(--accent)" strokeWidth="1.5" fill="none"/>
          <circle cx="7" cy="7" r="2" fill="var(--accent)"/>
        </svg>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, paddingTop: 6 }}>
        <div className="thinking-dot" />
        <div className="thinking-dot" />
        <div className="thinking-dot" />
      </div>
    </div>
  );
}
