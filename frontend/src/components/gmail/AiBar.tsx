"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAiPrompt } from "../../hooks/gmail/useAiPrompt";
import { LoadingDots } from "./GmailUI";
import { KEYBIND_ACTION_EVENT } from "../GlobalKeybinds";

const QUICK_ACTIONS = [
  {
    label: "Prioritize my inbox",
    description: "Rank unread mails by urgency",
    prompt:
      "Look at my unread emails and rank them by urgency and importance, with a short reason for each.",
  },
  {
    label: "Prioritize last week's emails",
    description: "Rank last 7 days by what still matters",
    prompt:
      "Look at my emails from the last 7 days and rank them by urgency and importance. Focus on anything that still needs attention, has an unanswered question, or has an upcoming deadline. Group by priority (High / Medium / Low) with a short reason for each.",
  },
  {
    label: "Summarize unread mails",
    description: "Quick digest of what's new",
    prompt:
      "Summarize all my unread emails into a short digest, grouped by topic or sender.",
  },
  {
    label: "Find action items",
    description: "Things that need a reply or task",
    prompt:
      "Go through my recent emails and list any that need a reply, action, or follow-up from me, with deadlines if mentioned.",
  },
  {
    label: "Draft replies",
    description: "Suggest replies to important mails",
    prompt:
      "Identify the most important unread emails and draft a short reply for each one.",
  },
  {
    label: "Clean up inbox",
    description: "Spot newsletters/promos to archive",
    prompt:
      "Look through my inbox and identify promotional emails, newsletters, or notifications that I could safely archive or unsubscribe from.",
  },
  {
    label: "Daily briefing",
    description: "What happened in my inbox today",
    prompt:
      "Give me a short daily briefing of what's important in my inbox today, including any urgent items and a summary of new messages.",
  },
];

interface AiBarProps {
  compact?: boolean;
}

export default function AiBar({ compact = false }: AiBarProps) {
  const { aiInput, setAiInput, aiLoading, aiResult, sendPrompt, reset } =
    useAiPrompt();
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onAction = (e: Event) => {
      const action = (e as CustomEvent<string>).detail;
      if (action === "gmail-search") {
        (inputRef.current ?? textareaRef.current)?.focus();
      }
    };
    window.addEventListener(KEYBIND_ACTION_EVENT, onAction);
    return () => window.removeEventListener(KEYBIND_ACTION_EVENT, onAction);
  }, []);

  useEffect(() => {
    if (!cardsRef.current || compact) return;
    const cards = cardsRef.current.querySelectorAll(":scope > button");
    gsap.fromTo(
      cards,
      { y: 14, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.4,
        ease: "power3.out",
        stagger: 0.05,
        delay: 0.15,
      },
    );
  }, [compact]);

  if (compact) {
    return (
      <div
        style={{
          padding: "0.85rem 1.5rem",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-alt)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--surface)",
              border: "1.5px solid var(--border-strong)",
              borderRadius: "var(--radius-lg)",
              padding: "0.45rem 0.9rem",
              transition: "border-color 0.15s",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              style={{ flexShrink: 0, color: "var(--red)" }}
            >
              <path
                d="M8 1.5L9.8 6.2L14.5 8L9.8 9.8L8 14.5L6.2 9.8L1.5 8L6.2 6.2L8 1.5Z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
            </svg>
            <input
              ref={inputRef}
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendPrompt()}
              placeholder="Ask AI about your inbox…"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "0.8rem",
                color: "var(--fg)",
                fontFamily: "inherit",
              }}
            />
          </div>
          <button
            onClick={() => sendPrompt()}
            disabled={aiLoading || !aiInput.trim()}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "var(--radius-lg)",
              border: `1.5px solid ${aiInput.trim() && !aiLoading ? "var(--red)" : "var(--border-strong)"}`,
              background:
                aiInput.trim() && !aiLoading ? "var(--red)" : "var(--surface)",
              color: aiInput.trim() && !aiLoading ? "#fff" : "var(--fg-dim)",
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.04em",
              cursor: aiInput.trim() && !aiLoading ? "pointer" : "not-allowed",
              fontFamily: "inherit",
            }}
          >
            {aiLoading ? "…" : "Ask"}
          </button>
        </div>
        {aiResult && (
          <div
            style={{
              marginTop: "0.6rem",
              padding: "0.7rem 1rem",
              background: "var(--red-dim)",
              borderRadius: "var(--radius-lg)",
              fontSize: "0.78rem",
              color: "var(--fg)",
              lineHeight: 1.6,
              border: "1.5px solid var(--red)",
            }}
          >
            {aiResult}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: "2.5rem 1.5rem", maxWidth: 760, margin: "0 auto" }}>
      {!aiLoading && !aiResult && (
        <>
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <h2
              style={{
                fontSize: "1.05rem",
                fontWeight: 900,
                letterSpacing: "0.02em",
                marginBottom: "0.4rem",
                textTransform: "uppercase",
              }}
            >
              What do you need from your inbox?
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--fg-dim)" }}>
              Ask anything, or pick a quick action below.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              background: "var(--surface)",
              border: "1.5px solid var(--border-strong)",
              borderRadius: "var(--radius-lg)",
              padding: "0.85rem",
              marginBottom: "1.5rem",
              boxShadow: "4px 4px 0 var(--border)",
            }}
          >
            <textarea
              ref={textareaRef}
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendPrompt();
                }
              }}
              placeholder="e.g. Summarize my unread emails from this week…"
              rows={3}
              style={{
                width: "100%",
                resize: "vertical",
                border: "none",
                outline: "none",
                background: "transparent",
                color: "var(--fg)",
                fontSize: "0.875rem",
                lineHeight: 1.6,
                fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => sendPrompt()}
                disabled={aiLoading || !aiInput.trim()}
                style={{
                  padding: "0.55rem 1.4rem",
                  borderRadius: "var(--radius-md)",
                  border: `1.5px solid ${aiInput.trim() && !aiLoading ? "var(--red)" : "var(--border-strong)"}`,
                  background:
                    aiInput.trim() && !aiLoading
                      ? "var(--red)"
                      : "var(--border)",
                  color:
                    aiInput.trim() && !aiLoading ? "#fff" : "var(--fg-dim)",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor:
                    aiInput.trim() && !aiLoading ? "pointer" : "not-allowed",
                  fontFamily: "inherit",
                }}
              >
                {aiLoading ? "Thinking…" : "Ask AI"}
              </button>
            </div>
          </div>

          <div
            ref={cardsRef}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0.65rem",
            }}
          >
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => sendPrompt(action.prompt)}
                disabled={aiLoading}
                style={{
                  textAlign: "left",
                  padding: "0.85rem 1rem",
                  borderRadius: "var(--radius-lg)",
                  border: "1.5px solid var(--border-strong)",
                  background: "var(--bg)",
                  cursor: aiLoading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  transition:
                    "background 0.15s, border-color 0.15s, box-shadow 0.15s",
                  opacity: aiLoading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!aiLoading) {
                    e.currentTarget.style.background = "var(--red-dim)";
                    e.currentTarget.style.borderColor = "var(--red)";
                    e.currentTarget.style.boxShadow =
                      "3px 3px 0 var(--red-glow)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--bg)";
                  e.currentTarget.style.borderColor = "var(--border-strong)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "var(--fg)",
                    marginBottom: "0.2rem",
                  }}
                >
                  {action.label}
                </div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--fg-dim)",
                    lineHeight: 1.4,
                  }}
                >
                  {action.description}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {aiLoading && <LoadingDots />}

      {aiResult && !aiLoading && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <span
              style={{
                fontSize: "0.78rem",
                color: "var(--fg-dim)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "80%",
                fontWeight: 600,
              }}
            >
              {aiInput}
            </span>
            <button
              onClick={reset}
              style={{
                padding: "0.4rem 0.9rem",
                borderRadius: "var(--radius-md)",
                border: "1.5px solid var(--border-strong)",
                background: "transparent",
                color: "var(--fg-dim)",
                fontSize: "0.7rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                flexShrink: 0,
                marginLeft: "0.75rem",
              }}
            >
              New ask
            </button>
          </div>
          <div
            className="prose-response"
            style={{
              fontSize: "0.88rem",
              color: "var(--fg)",
              letterSpacing: "-0.01em",
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {aiResult}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
