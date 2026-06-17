"use client";

import { useEffect, useState } from "react";
import {
  KEYBIND_ACTIONS,
  DEFAULT_KEYBINDS,
  comboFromEvent,
  combosEqual,
  formatCombo,
  type KeybindsMap,
  type KeyCombo,
  type KeybindCategory,
} from "../lib/keybinds";

const CATEGORY_ORDER: KeybindCategory[] = ["General", "Navigation", "Chat", "Gmail"];

interface KeybindsSettingsProps {
  value: KeybindsMap;
  onChange: (next: KeybindsMap) => void;
}

export default function KeybindsSettings({ value, onChange }: KeybindsSettingsProps) {
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [conflictId, setConflictId] = useState<string | null>(null);

  useEffect(() => {
    if (!recordingId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        setRecordingId(null);
        return;
      }

      const combo = comboFromEvent(e);
      if (!combo) return;

      const existingConflict = KEYBIND_ACTIONS.find(
        (a) => a.id !== recordingId && combosEqual(value[a.id] ?? a.default, combo),
      );

      onChange({ ...value, [recordingId]: combo });
      setConflictId(existingConflict ? recordingId : null);
      setRecordingId(null);
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [recordingId, value, onChange]);

  const resetOne = (id: string) => {
    const next = { ...value, [id]: DEFAULT_KEYBINDS[id] };
    onChange(next);
    if (conflictId === id) setConflictId(null);
  };

  const resetAll = () => {
    onChange({ ...DEFAULT_KEYBINDS });
    setConflictId(null);
    setRecordingId(null);
  };

  const findConflict = (id: string, combo: KeyCombo) =>
    KEYBIND_ACTIONS.find((a) => a.id !== id && combosEqual(value[a.id] ?? a.default, combo));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <p style={{ fontSize: "0.72rem", color: "var(--fg-dim)", lineHeight: 1.5, margin: 0 }}>
          Click a shortcut, then press a new key combination. Press Esc to cancel.
        </p>
        <button
          type="button"
          onClick={resetAll}
          className="nb-shine"
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--fg-dim)",
            background: "transparent",
            border: "2px solid var(--border-strong)",
            borderRadius: "var(--radius-sm)",
            padding: "0.3rem 0.6rem",
            cursor: "pointer",
            flexShrink: 0,
            marginLeft: "1rem",
          }}
        >
          Reset all
        </button>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const actions = KEYBIND_ACTIONS.filter((a) => a.category === category);
        if (actions.length === 0) return null;

        return (
          <div key={category} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--fg-dim)",
              }}
            >
              {category}
            </div>
            {actions.map((action) => {
              const combo = value[action.id] ?? action.default;
              const isRecording = recordingId === action.id;
              const conflict = isRecording ? null : findConflict(action.id, combo);
              const isDefault = combosEqual(combo, action.default);

              return (
                <div
                  key={action.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    padding: "0.6rem 0.85rem",
                    background: "var(--surface)",
                    border: `2px solid ${conflict || conflictId === action.id ? "var(--error)" : "var(--border-strong)"}`,
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--fg)" }}>
                      {action.label}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--fg-dim)", marginTop: "0.1rem" }}>
                      {action.description}
                    </div>
                    {conflict && (
                      <div style={{ fontSize: "0.7rem", color: "var(--error)", marginTop: "0.2rem" }}>
                        Conflicts with &quot;{conflict.label}&quot;
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => setRecordingId(action.id)}
                      className="nb-shine"
                      style={{
                        minWidth: 120,
                        textAlign: "center",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        fontFamily: "var(--font-geist-mono), monospace",
                        color: isRecording ? "var(--accent-text)" : "var(--fg)",
                        background: isRecording ? "var(--accent-dim)" : "var(--bg-alt)",
                        border: `2px solid ${isRecording ? "var(--accent)" : "var(--border-strong)"}`,
                        borderRadius: "var(--radius-sm)",
                        padding: "0.35rem 0.6rem",
                        cursor: "pointer",
                      }}
                    >
                      {isRecording ? "Press keys…" : formatCombo(combo)}
                    </button>
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => resetOne(action.id)}
                        title="Reset to default"
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--fg-dim)",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "0.25rem",
                          textDecoration: "underline",
                        }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
