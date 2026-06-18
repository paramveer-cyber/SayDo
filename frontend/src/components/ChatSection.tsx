"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChatMessage from "../components/ChatMessage";
import AgentStepsIndicator, {
  type AgentStepEntry,
} from "../components/AgentStepsIndicator";
import { aiApi } from "../lib/api";
import { KEYBIND_ACTION_EVENT } from "./GlobalKeybinds";
import {
  AGENT_STEP_EVENT,
  type AgentStepEventDetail,
} from "./SSEListener";
import gsap from "gsap";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const STARTERS = [
  "List my latest emails",
  "Show my upcoming calendar events",
  "Summarize my unread emails",
  "What's on my calendar today?",
];

export default function ChatSection() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentSteps, setAgentSteps] = useState<AgentStepEntry[]>([]);
  const pendingRequestIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emptyStateRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const targets = [
      headerRef.current,
      emptyStateRef.current,
      inputAreaRef.current,
    ].filter(Boolean);
    gsap.fromTo(
      targets,
      { y: 18, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power4.out",
        stagger: 0.08,
        delay: 0.15,
      },
    );
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const onAction = (e: Event) => {
      const action = (e as CustomEvent<string>).detail;
      if (action === "chat-focus-input") {
        textareaRef.current?.focus();
      } else if (action === "chat-new") {
        setMessages([]);
        setInput("");
        setError(null);
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        textareaRef.current?.focus();
      }
    };
    window.addEventListener(KEYBIND_ACTION_EVENT, onAction);
    return () => window.removeEventListener(KEYBIND_ACTION_EVENT, onAction);
  }, []);

  useEffect(() => {
    const onAgentStepEvent = (e: Event) => {
      const detail = (e as CustomEvent<AgentStepEventDetail>).detail;
      if (detail.requestId !== pendingRequestIdRef.current) return;

      if (detail.kind === "step") {
        const stepLabel =
          detail.toolCalls.length > 0
            ? detail.toolCalls.map((call) => call.label).join(", ")
            : detail.hasText
              ? "Drafting answer"
              : "Thinking";

        setAgentSteps((prev) => [
          ...prev,
          {
            stepNumber: detail.stepNumber,
            label: stepLabel,
            toolCalls: detail.toolCalls,
          },
        ]);
      }
    };
    window.addEventListener(AGENT_STEP_EVENT, onAgentStepEvent);
    return () =>
      window.removeEventListener(AGENT_STEP_EVENT, onAgentStepEvent);
  }, []);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const send = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || loading) return;

      setError(null);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setLoading(true);
      setAgentSteps([]);

      const requestId = crypto.randomUUID();
      pendingRequestIdRef.current = requestId;

      const history = messages.map((m) => m.content);

      try {
        const message = await aiApi.prompt({
          prompt: trimmed,
          requestId,
          options: { history },
        });
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: message,
            timestamp: new Date(),
          },
        ]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        pendingRequestIdRef.current = null;
        setAgentSteps([]);
        setLoading(false);
      }
    },
    [loading, messages],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <header
        ref={headerRef}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.75rem",
          height: 52,
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: 4,
              height: 4,
              background: "var(--yellow)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontWeight: 800,
              fontSize: "0.62rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--fg)",
            }}
          >
            Chat
          </span>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: isEmpty ? 0 : "1.5rem 0",
        }}
        className="scrollbar-thin"
      >
        {isEmpty ? (
          <div
            ref={emptyStateRef}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              padding: "2rem",
              gap: "2.5rem",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  margin: "0 auto 1.5rem",
                  overflow: "hidden",
                  clipPath: "polygon(0 0, 100% 0, 100% 72%, 72% 100%, 0 100%)",
                  background: "var(--surface)",
                  border: "1px solid var(--border-strong)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src="/icon.png"
                  alt="Corsair"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              <div
                style={{
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "var(--fg-dim)",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 1,
                    background: "var(--border-strong)",
                  }}
                />
                AI for Gmail + Calendar
                <div
                  style={{
                    width: 20,
                    height: 1,
                    background: "var(--border-strong)",
                  }}
                />
              </div>

              <h1
                style={{
                  fontFamily: "'Movement', sans-serif",
                  fontSize: "clamp(2.5rem, 5vw, 4rem)",
                  lineHeight: 0.9,
                  letterSpacing: "-0.03em",
                  margin: "0 0 1.25rem",
                }}
              >
                <span style={{ color: "var(--green)" }}>You say,</span>
                <br />
                <span style={{ color: "var(--fg)" }}>we do.</span>
              </h1>

              <p
                style={{
                  fontSize: "0.82rem",
                  lineHeight: 1.65,
                  color: "var(--fg-dim)",
                  maxWidth: 360,
                  margin: "0 auto",
                  fontWeight: 400,
                  letterSpacing: "-0.01em",
                }}
              >
                Ask about your emails, calendar, and more. Corsair reads and
                acts.
              </p>
            </div>

            <div
              style={{
                borderTop: "1px solid var(--border)",
                paddingTop: "1.5rem",
                width: "100%",
                maxWidth: 480,
              }}
            >
              <div
                style={{
                  fontSize: "0.52rem",
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--fg-dim)",
                  marginBottom: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{ width: 3, height: 3, background: "var(--yellow)" }}
                />
                Starters
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem",
                }}
              >
                {STARTERS.map((s, i) => {
                  const colors = [
                    "var(--yellow)",
                    "var(--red)",
                    "var(--blue)",
                    "var(--green)",
                  ];
                  const color = colors[i % colors.length];
                  return (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      style={{
                        padding: "0.65rem 0.875rem",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        fontSize: "0.72rem",
                        color: "var(--fg-dim)",
                        cursor: "pointer",
                        letterSpacing: "-0.01em",
                        fontFamily: "inherit",
                        textAlign: "left",
                        transition: "border-color 0.15s, color 0.15s",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = color;
                        e.currentTarget.style.color = "var(--fg)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.color = "var(--fg-dim)";
                      }}
                    >
                      <div
                        style={{
                          width: 3,
                          height: 3,
                          background: color,
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 1.5rem" }}>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {loading && <AgentStepsIndicator steps={agentSteps} />}
            {error && (
              <div
                style={{
                  background: "var(--red-dim)",
                  border: "1px solid var(--red)",
                  padding: "0.6rem 0.875rem",
                  fontSize: "0.78rem",
                  color: "var(--red)",
                  marginBottom: "1rem",
                }}
              >
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      <div
        ref={inputAreaRef}
        style={{
          padding: "0.875rem 1.75rem 1.25rem",
          borderTop: messages.length > 0 ? "1px solid var(--border)" : "none",
          flexShrink: 0,
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {isEmpty && error && (
            <div
              style={{
                background: "var(--red-dim)",
                border: "1px solid var(--red)",
                padding: "0.6rem 0.875rem",
                fontSize: "0.78rem",
                color: "var(--red)",
                marginBottom: "0.75rem",
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "0.5rem",
              background: "var(--surface)",
              border: "1px solid var(--border-strong)",
              padding: "0.6rem 0.6rem 0.6rem 1rem",
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Message Corsair…"
              rows={1}
              style={{
                flex: 1,
                resize: "none",
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: "var(--fg)",
                fontFamily: "inherit",
                paddingTop: "0.2rem",
                maxHeight: 160,
                overflowY: "auto",
                letterSpacing: "-0.01em",
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 32,
                height: 32,
                border: "none",
                background:
                  input.trim() && !loading ? "var(--fg)" : "var(--border)",
                color: input.trim() && !loading ? "var(--bg)" : "var(--fg-dim)",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.15s",
                clipPath:
                  "polygon(0 0, 100% 0, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 12V2M7 2L2 7M7 2L12 7"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "0.4rem",
            }}
          >
            <span
              style={{
                fontSize: "0.55rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--fg-dim)",
              }}
            >
              Enter to send · Shift+Enter new line
            </span>
            <div style={{ display: "flex", gap: "0.3rem" }}>
              <div style={{ width: 5, height: 5, background: "var(--red)" }} />
              <div
                style={{ width: 5, height: 5, background: "var(--yellow)" }}
              />
              <div style={{ width: 5, height: 5, background: "var(--blue)" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
