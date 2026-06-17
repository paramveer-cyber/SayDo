"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function GmailPageHeader({
  title,
  accent = "var(--red)",
  onBack,
  right,
}: {
  title: string;
  accent?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" },
    );
  }, []);

  return (
    <div
      ref={ref}
      style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0 1.5rem",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          className="nb-shine"
          style={{
            width: 30,
            height: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--surface)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            color: "var(--fg-dim)",
            flexShrink: 0,
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = accent;
            e.currentTarget.style.color = accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-strong)";
            e.currentTarget.style.color = "var(--fg-dim)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      <div
        style={{
          width: 6,
          height: 6,
          flexShrink: 0,
          background: accent,
          borderRadius: "var(--radius-sm)",
        }}
      />

      <h2
        style={{
          fontSize: "0.78rem",
          fontWeight: 800,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--fg)",
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </h2>

      {right}
    </div>
  );
}
