"use client";

import React, { useEffect, useRef, useState } from "react";
import type { GmailMessageData, GmailMessagePart } from "../../lib/api";

export function ActionBtn({
  onClick,
  label,
  danger,
  small,
}: {
  onClick: () => void;
  label: string;
  danger?: boolean;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: small ? "0.32rem 0.7rem" : "0.4rem 0.85rem",
        borderRadius: "var(--radius-md)",
        border: `1.5px solid ${danger ? "var(--red)" : "var(--border-strong)"}`,
        background: danger ? "var(--red-dim)" : "var(--surface)",
        color: danger ? "var(--red)" : "var(--fg)",
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.04em",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "background 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!danger) e.currentTarget.style.borderColor = "var(--fg-dim)";
      }}
      onMouseLeave={(e) => {
        if (!danger) e.currentTarget.style.borderColor = "var(--border-strong)";
      }}
    >
      {label}
    </button>
  );
}

export function IconBtn({
  onClick,
  title,
  danger,
  children,
}: {
  onClick: (e: React.MouseEvent) => void;
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "none",
        border: "1px solid transparent",
        cursor: "pointer",
        borderRadius: "var(--radius-md)",
        color: danger ? "var(--red)" : "var(--fg-dim)",
        transition: "background 0.12s, color 0.12s, border-color 0.12s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger
          ? "var(--red-dim)"
          : "var(--surface)";
        e.currentTarget.style.borderColor = danger
          ? "var(--red)"
          : "var(--border-strong)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "none";
        e.currentTarget.style.borderColor = "transparent";
      }}
    >
      {children}
    </button>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.75rem",
        textAlign: "center",
        padding: "4rem 1rem",
        color: "var(--fg-dim)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--radius-lg)",
          border: "2px dashed var(--border-strong)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
          <rect
            x="1.5"
            y="3.5"
            width="13"
            height="9"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="M1.5 4.5L8 9L14.5 4.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span
        style={{ fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.02em" }}
      >
        {label}
      </span>
    </div>
  );
}

export function LoadingDots() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3.5rem",
        gap: 6,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="thinking-dot"
          style={{
            animationDelay: `${i * 0.2}s`,
            borderRadius: "var(--radius-sm)",
          }}
        />
      ))}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        margin: "0.75rem 1.25rem",
        padding: "0.65rem 1rem",
        background: "var(--red-dim)",
        border: "1.5px solid var(--red)",
        borderRadius: "var(--radius-md)",
        fontSize: "0.78rem",
        fontWeight: 600,
        color: "var(--red)",
      }}
    >
      {message}
    </div>
  );
}

export function ComposeField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label
        style={{
          fontSize: "0.6rem",
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--fg-dim)",
          display: "block",
          marginBottom: "0.4rem",
        }}
      >
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="nb-input"
        style={{ borderRadius: "var(--radius-md)" }}
      />
    </div>
  );
}

export function formatDate(ts: string): string {
  const num = Number(ts);
  const d = !isNaN(num) && ts.trim() !== "" ? new Date(num) : new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

const HIDDEN_SYSTEM_LABEL_IDS = new Set([
  "INBOX",
  "UNREAD",
  "SENT",
  "DRAFT",
  "SPAM",
  "TRASH",
  "STARRED",
  "IMPORTANT",
  "CATEGORY_PERSONAL",
  "CATEGORY_SOCIAL",
  "CATEGORY_PROMOTIONS",
  "CATEGORY_UPDATES",
  "CATEGORY_FORUMS",
]);

const PRIORITY_LABEL_COLORS: Record<
  string,
  { background: string; text: string }
> = {
  "Priority/High": { background: "#fde8e8", text: "#b91c1c" },
  "Priority/Medium": { background: "#fef9c3", text: "#a16207" },
  "Priority/Low": { background: "#dcfce7", text: "#15803d" },
};

function humanizeLabelId(labelId: string): string {
  return labelId
    .replace(/^CATEGORY_/, "")
    .split(/[/_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function LabelBadges({
  labelIds,
  labelsById,
}: {
  labelIds: string[] | undefined;
  labelsById: Map<
    string,
    { name: string; color?: { textColor: string; backgroundColor: string } }
  >;
}) {
  const visibleLabelIds = (labelIds ?? []).filter(
    (labelId) => !HIDDEN_SYSTEM_LABEL_IDS.has(labelId),
  );

  if (visibleLabelIds.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.3rem",
        flexWrap: "wrap",
        marginTop: 4,
      }}
    >
      {visibleLabelIds.map((labelId) => {
        const label = labelsById.get(labelId);
        const displayName = label?.name ?? humanizeLabelId(labelId);
        const priorityColor = label?.name
          ? PRIORITY_LABEL_COLORS[label.name]
          : undefined;
        const backgroundColor =
          priorityColor?.background ?? label?.color?.backgroundColor;
        const textColor = priorityColor?.text ?? label?.color?.textColor;

        return (
          <span
            key={labelId}
            style={{
              fontSize: "0.62rem",
              fontWeight: 600,
              lineHeight: 1,
              padding: "0.18rem 0.45rem",
              borderRadius: "var(--radius-sm, 6px)",
              border: backgroundColor
                ? `1px solid ${backgroundColor}`
                : "1px solid var(--border-strong)",
              background: backgroundColor ?? "var(--surface)",
              color: textColor ?? "var(--fg-dim)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {displayName}
          </span>
        );
      })}
    </div>
  );
}

function decodeBase64(encoded: string): string {
  try {
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    return decodeURIComponent(
      atob(normalized)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
  } catch {
    return encoded;
  }
}

function extractPartsBody(
  parts: GmailMessagePart[],
  preferredMime: string,
): string | null {
  for (const part of parts) {
    if (part.mimeType === preferredMime && part.body.data) {
      return decodeBase64(part.body.data);
    }
    if (part.parts) {
      const nested = extractPartsBody(part.parts, preferredMime);
      if (nested) return nested;
    }
  }
  return null;
}

export function getBody(data: GmailMessageData): {
  content: string;
  isHtml: boolean;
} {
  if (data.payload?.parts) {
    const html = extractPartsBody(data.payload.parts, "text/html");
    if (html) return { content: html, isHtml: true };
    const plain = extractPartsBody(data.payload.parts, "text/plain");
    if (plain) return { content: plain, isHtml: false };
  }
  if (data.payload?.body?.data) {
    const decoded = decodeBase64(data.payload.body.data);
    const isHtml = /<[a-z][\s\S]*>/i.test(decoded);
    return { content: decoded, isHtml };
  }
  const fallback = data.body || data.snippet || "";
  const isHtml = /<[a-z][\s\S]*>/i.test(fallback);
  return { content: fallback, isHtml };
}

const MAIL_FRAME_STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.75;
    color: #f2f0ec;
    background: transparent;
    word-break: break-word;
    overflow-x: hidden;
  }
  a { color: #1b4fd8; }
  img { max-width: 100%; height: auto; display: block; }
  table { max-width: 100%; border-collapse: collapse; }
  pre, code { white-space: pre-wrap; word-break: break-all; }
  blockquote {
    margin: 0.5rem 0;
    padding: 0.25rem 0.75rem;
    border-left: 3px solid #3a3a3a;
    color: #888884;
  }
`;

function buildSrcdocDocument(rawHtml: string): string {
  const styleTag = `<style>${MAIL_FRAME_STYLES}</style>`;
  const hasHtmlTag = /<html[\s>]/i.test(rawHtml);

  if (hasHtmlTag) {
    return rawHtml.replace(/<head([^>]*)>/i, `<head$1>${styleTag}`);
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${styleTag}</head><body>${rawHtml}</body></html>`;
}

export function SecureMailFrame({ htmlContent }: { htmlContent: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = useState(600);

  const srcdoc = buildSrcdocDocument(htmlContent);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      try {
        const scrollHeight = iframe.contentDocument?.body?.scrollHeight;
        if (scrollHeight && scrollHeight > 0) {
          setFrameHeight(scrollHeight + 32);
        }
      } catch {
        // sandboxed document — best effort height
      }
    };

    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, [srcdoc]);

  return (
    <iframe
      ref={iframeRef}
      title="Email content"
      srcDoc={srcdoc}
      sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
      referrerPolicy="no-referrer"
      style={{
        width: "100%",
        height: frameHeight,
        border: "none",
        display: "block",
        background: "transparent",
      }}
    />
  );
}
