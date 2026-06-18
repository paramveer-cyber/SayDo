"use client";

export interface AgentStepEntry {
  stepNumber: number;
  label: string;
  toolCalls: { toolName: string; label: string }[];
}

interface AgentStepsIndicatorProps {
  steps: AgentStepEntry[];
}

export default function AgentStepsIndicator({
  steps,
}: AgentStepsIndicatorProps) {
  return (
    <div
      className="msg-enter"
      style={{
        display: "flex",
        gap: "0.75rem",
        marginBottom: "1.5rem",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
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
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle
            cx="7"
            cy="7"
            r="5"
            stroke="var(--accent)"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="7" cy="7" r="2" fill="var(--accent)" />
        </svg>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 7,
          paddingTop: 6,
        }}
      >
        {steps.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div className="thinking-dot" />
            <div className="thinking-dot" />
            <div className="thinking-dot" />
          </div>
        ) : (
          steps.map((step, index) => {
            const isLatestStep = index === steps.length - 1;
            return (
              <div
                key={step.stepNumber}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  letterSpacing: "0.02em",
                  color: isLatestStep ? "var(--fg)" : "var(--fg-dim)",
                  transition: "color 0.2s ease",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: isLatestStep
                      ? "var(--accent)"
                      : "var(--border-strong)",
                    boxShadow: isLatestStep
                      ? "0 0 6px var(--accent-glow)"
                      : "none",
                  }}
                />
                {step.label}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
