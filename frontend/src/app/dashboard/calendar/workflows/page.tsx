"use client";

import { useState, useRef, useEffect } from "react";
import { gmailApi } from "../../../../lib/api";
import gsap from "gsap";

type CalWorkflowId = "week-prep-briefing" | "conflict-detector";

const WORKFLOWS: {
  id: CalWorkflowId;
  label: string;
  description: string;
  detail: string;
  accentColor: string;
  accentDim: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "week-prep-briefing",
    label: "Week prep briefing",
    description:
      "Day-by-day calendar overview with prep suggestions for the next 7 days",
    detail:
      "Reviews your upcoming events and tells you which ones need preparation, where you have back-to-back slots, and what to watch out for. Delivered to your inbox.",
    accentColor: "var(--blue)",
    accentDim: "var(--blue-dim)",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <rect
          x="2"
          y="3"
          width="16"
          height="14"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M6 1.5V4.5M14 1.5V4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path d="M2 7.5H18" stroke="currentColor" strokeWidth="1.5" />
        <rect
          x="5"
          y="10"
          width="3"
          height="3"
          rx="0.5"
          fill="currentColor"
          opacity="0.7"
        />
        <rect
          x="11"
          y="10"
          width="3"
          height="3"
          rx="0.5"
          fill="currentColor"
          opacity="0.4"
        />
      </svg>
    ),
  },
  {
    id: "conflict-detector",
    label: "Conflict detector",
    description:
      "Find overlapping events and tight transitions in the week ahead",
    detail:
      "Scans your next 7 days for hard overlaps, gaps under 10 minutes between meetings, and other scheduling issues — with concrete recommendations. Delivered to your inbox.",
    accentColor: "var(--yellow)",
    accentDim: "var(--yellow-dim)",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <polygon
          points="10,2 18,17 2,17"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill="none"
        />
        <line
          x1="10"
          y1="8"
          x2="10"
          y2="12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="10" cy="14.5" r="0.8" fill="currentColor" />
      </svg>
    ),
  },
];

export default function CalendarWorkflowsPage() {
  const [runningId, setRunningId] = useState<CalWorkflowId | null>(null);
  const [doneId, setDoneId] = useState<CalWorkflowId | null>(null);
  const [errorId, setErrorId] = useState<CalWorkflowId | null>(null);

  const headerRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.fromTo(
      headerRef.current,
      { y: 14, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, delay: 0.15 },
    );
    tl.fromTo(
      card1Ref.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55 },
      "-=0.25",
    );
    tl.fromTo(
      card2Ref.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55 },
      "-=0.38",
    );
  }, []);

  const handleRun = async (id: CalWorkflowId) => {
    setRunningId(id);
    setDoneId(null);
    setErrorId(null);
    try {
      await gmailApi.runWorkflow(id);
      setDoneId(id);
      setTimeout(() => setDoneId(null), 4000);
    } catch {
      setErrorId(id);
      setTimeout(() => setErrorId(null), 4000);
    } finally {
      setRunningId(null);
    }
  };

  const cardRefs = [card1Ref, card2Ref];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
      }}
    >
      {/* Header */}
      <div
        ref={headerRef}
        style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.75rem",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 4, height: 4, background: "var(--yellow)" }} />
          <span
            style={{
              fontWeight: 800,
              fontSize: "0.62rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            AI Workflows
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.3rem" }}>
          <div style={{ width: 5, height: 5, background: "var(--blue)" }} />
          <div style={{ width: 5, height: 5, background: "var(--yellow)" }} />
          <div style={{ width: 5, height: 5, background: "var(--red)" }} />
        </div>
      </div>

      <div
        style={{ flex: 1, overflowY: "auto", padding: "2rem 1.75rem" }}
        className="scrollbar-thin"
      >
        {/* Intro block */}
        <div
          style={{
            borderBottom: "1px solid var(--border)",
            paddingBottom: "2rem",
            marginBottom: "2rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0",
          }}
        >
          <div
            style={{
              paddingRight: "2rem",
              borderRight: "1px solid var(--border)",
            }}
          >
            <h1
              style={{
                fontFamily: "'Movement', sans-serif",
                fontSize: "clamp(2rem, 3.5vw, 3rem)",
                letterSpacing: "-0.03em",
                lineHeight: 0.92,
                margin: "0 0 1rem",
              }}
            >
              Run AI on
              <br />
              <span style={{ color: "var(--yellow)" }}>your calendar.</span>
            </h1>
          </div>
          <div
            style={{
              paddingLeft: "2rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            <p
              style={{
                fontSize: "0.8rem",
                lineHeight: 1.65,
                color: "var(--fg-dim)",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Run a workflow and get results delivered directly to your inbox.
              Each one scans your real calendar and generates something
              actionable.
            </p>
          </div>
        </div>

        {/* Workflow cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            maxWidth: 680,
          }}
        >
          {WORKFLOWS.map((workflow, i) => {
            const isRunning = runningId === workflow.id;
            const isDone = doneId === workflow.id;
            const isError = errorId === workflow.id;

            return (
              <div
                key={workflow.id}
                ref={cardRefs[i]}
                style={{
                  background: "var(--surface)",
                  border: `1px solid ${isDone ? "var(--green)" : isError ? "var(--red)" : "var(--border-strong)"}`,
                  padding: "1.75rem",
                  position: "relative",
                  clipPath:
                    "polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)",
                  transition: "border-color 0.25s",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: isDone
                      ? "var(--green)"
                      : isError
                        ? "var(--red)"
                        : workflow.accentColor,
                    transition: "background 0.25s",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    gap: "1.25rem",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      background: workflow.accentDim,
                      border: `1px solid ${workflow.accentColor}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: workflow.accentColor,
                    }}
                  >
                    {workflow.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.52rem",
                        fontWeight: 800,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: workflow.accentColor,
                        marginBottom: "0.4rem",
                      }}
                    >
                      Workflow
                    </div>
                    <div
                      style={{
                        fontFamily: "'Movement', sans-serif",
                        fontSize: "1.5rem",
                        letterSpacing: "-0.02em",
                        lineHeight: 1,
                        marginBottom: "0.6rem",
                      }}
                    >
                      {workflow.label}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--fg-dim)",
                        lineHeight: 1.6,
                        marginBottom: "0.75rem",
                      }}
                    >
                      {workflow.description}
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--fg-dim)",
                        lineHeight: 1.65,
                        borderLeft: `2px solid ${workflow.accentColor}`,
                        paddingLeft: "0.75rem",
                        opacity: 0.8,
                      }}
                    >
                      {workflow.detail}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginTop: "1.5rem",
                    paddingTop: "1.25rem",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <button
                    onClick={() => handleRun(workflow.id)}
                    disabled={isRunning || runningId !== null}
                    style={{
                      padding: "0.55rem 1.5rem",
                      border: "none",
                      background:
                        isRunning || runningId !== null
                          ? "var(--border)"
                          : "var(--fg)",
                      color:
                        isRunning || runningId !== null
                          ? "var(--fg-dim)"
                          : "var(--bg)",
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      cursor:
                        isRunning || runningId !== null
                          ? "not-allowed"
                          : "pointer",
                      fontFamily: "inherit",
                      clipPath:
                        "polygon(0 0, 100% 0, 100% 100%, 7px 100%, 0 calc(100% - 7px))",
                      transition: "background 0.15s, color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isRunning && runningId === null) {
                        e.currentTarget.style.opacity = "0.85";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    {isRunning ? "Running…" : "Run workflow"}
                  </button>

                  {isDone && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          width: 5,
                          height: 5,
                          background: "var(--green)",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--green)",
                        }}
                      >
                        On its way — check your inbox
                      </span>
                    </div>
                  )}
                  {isError && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          width: 5,
                          height: 5,
                          background: "var(--red)",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--red)",
                        }}
                      >
                        Failed — try again
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom capability strip */}
        <div
          style={{
            marginTop: "2.5rem",
            borderTop: "1px solid var(--border)",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
          }}
        >
          {[
            { label: "Inbox delivery", color: "var(--blue)" },
            { label: "Real calendar data", color: "var(--yellow)" },
            { label: "Actionable output", color: "var(--green)" },
          ].map((item, i) => (
            <div
              key={item.label}
              style={{
                padding: "0.875rem 1rem",
                borderRight: i < 2 ? "1px solid var(--border)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 4,
                  background: item.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--fg-dim)",
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
