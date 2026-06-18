"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Sidebar from "../../../components/Sidebar";
import LoadingScreen from "../../../components/LoadingScreen";
import NbBackdrop from "../../../components/NbBackdrop";
import { settingsApi, authApi, type UserSettings } from "../../../lib/api";
import KeybindsSettings from "../../../components/KeybindsSettings";
import { mergeKeybinds, type KeybindsMap } from "../../../lib/keybinds";
import { KEYBINDS_UPDATED_EVENT } from "../../../components/GlobalKeybinds";

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="nb-shine"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        width: "100%",
        textAlign: "left",
        padding: "0.85rem 1rem",
        background: "var(--surface)",
        border: "2px solid var(--border-strong)",
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div>
        <div
          style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--fg)" }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--fg-dim)",
            marginTop: "0.15rem",
          }}
        >
          {description}
        </div>
      </div>
      <div
        style={{
          flexShrink: 0,
          width: 40,
          height: 22,
          borderRadius: 999,
          border: "2px solid var(--border-strong)",
          background: checked ? "var(--accent)" : "var(--bg-alt)",
          position: "relative",
          transition: "background 0.15s",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 1,
            left: checked ? 18 : 1,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "var(--fg)",
            transition: "left 0.15s",
          }}
        />
      </div>
    </button>
  );
}

export default function SettingsPage() {
  const auth = useAuth();
  const { status } = auth;
  const user = "user" in auth ? auth.user : null;
  const router = useRouter();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [preferredModel, setPreferredModel] = useState(
    "gemini-flash-lite-latest",
  );
  const [approvalsRequired, setApprovalsRequired] = useState(false);
  const [systemPromptOverride, setSystemPromptOverride] = useState("");
  const [keybinds, setKeybinds] = useState<KeybindsMap>(mergeKeybinds(null));

  const [gmailConnected, setGmailConnected] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [disconnectingPlugin, setDisconnectingPlugin] = useState<string | null>(
    null,
  );
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const userPlugins = user?.plugins ?? {};
    setGmailConnected(userPlugins.gmail === true);
    setCalendarConnected(userPlugins.googlecalendar === true);
  }, [status, user]);

  useEffect(() => {
    if (status !== "authenticated") return;
    settingsApi
      .get()
      .then(({ settings }) => {
        setSettings(settings);
        setGeminiApiKey(settings.geminiApiKey ?? "");
        setPreferredModel(settings.preferredModel);
        setApprovalsRequired(settings.approvalsRequired);
        setSystemPromptOverride(settings.systemPromptOverride ?? "");
        setKeybinds(mergeKeybinds(settings.keybinds));
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load settings",
        ),
      )
      .finally(() => setLoading(false));
  }, [status]);

  const handleDisconnectPlugin = async (
    pluginId: "gmail" | "googlecalendar",
  ) => {
    setDisconnectError(null);
    setDisconnectingPlugin(pluginId);
    try {
      await authApi.disconnectPlugin(pluginId);
      if (pluginId === "gmail") setGmailConnected(false);
      if (pluginId === "googlecalendar") setCalendarConnected(false);
    } catch (err) {
      setDisconnectError(
        err instanceof Error ? err.message : "Failed to disconnect",
      );
    } finally {
      setDisconnectingPlugin(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const { settings: updated } = await settingsApi.update({
        geminiApiKey: geminiApiKey.trim() === "" ? null : geminiApiKey.trim(),
        preferredModel: preferredModel.trim(),
        approvalsRequired,
        systemPromptOverride:
          systemPromptOverride.trim() === "" ? null : systemPromptOverride,
        keybinds,
      });
      setSettings(updated);
      setKeybinds(mergeKeybinds(updated.keybinds));
      window.dispatchEvent(
        new CustomEvent(KEYBINDS_UPDATED_EVENT, {
          detail: mergeKeybinds(updated.keybinds),
        }),
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return <LoadingScreen />;
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "var(--bg)",
        overflow: "hidden",
      }}
    >
      <Sidebar variant="main" />
      <main
        className="nb-dot-pattern"
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <NbBackdrop />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            flex: 1,
            padding: "2.5rem 2rem",
            maxWidth: 640,
            width: "100%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.4rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                textTransform: "uppercase",
                color: "var(--fg)",
                marginBottom: "0.35rem",
              }}
            >
              Settings
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--fg-dim)",
                lineHeight: 1.5,
              }}
            >
              Configure how Corsair&apos;s AI assistant runs for your account.
            </p>
          </div>

          {loading ? (
            <div style={{ color: "var(--fg-dim)", fontSize: "0.85rem" }}>
              Loading settings…
            </div>
          ) : (
            <div
              className="nb-card nb-cut-corner-tl"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                padding: "1.5rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--fg)",
                    marginBottom: "0.4rem",
                  }}
                >
                  Gemini API key
                </label>
                <input
                  className="nb-input"
                  type="password"
                  placeholder="AIza…"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  autoComplete="off"
                />
                <p
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--fg-dim)",
                    marginTop: "0.35rem",
                  }}
                >
                  Used for AI prompts. Leave blank to use the server&apos;s
                  default key.
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--fg)",
                    marginBottom: "0.4rem",
                  }}
                >
                  Preferred model
                </label>
                <input
                  className="nb-input"
                  type="text"
                  placeholder="gemini-flash-lite-latest"
                  value={preferredModel}
                  onChange={(e) => setPreferredModel(e.target.value)}
                />
                <p
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--fg-dim)",
                    marginTop: "0.35rem",
                  }}
                >
                  Gemini model name used for AI prompts (e.g.
                  gemini-flash-lite-latest, gemini-2.5-flash).
                </p>
              </div>

              <Toggle
                checked={approvalsRequired}
                onChange={setApprovalsRequired}
                label="Require approvals"
                description="Ask for confirmation before the assistant runs actions that change your data."
              />

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--fg)",
                    marginBottom: "0.4rem",
                  }}
                >
                  Custom system prompt
                </label>
                <textarea
                  className="nb-input"
                  rows={5}
                  placeholder="Additional instructions appended to the assistant's system prompt…"
                  value={systemPromptOverride}
                  onChange={(e) => setSystemPromptOverride(e.target.value)}
                  style={{ resize: "vertical", fontFamily: "inherit" }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--fg)",
                    marginBottom: "0.6rem",
                  }}
                >
                  Keyboard shortcuts
                </label>
                <KeybindsSettings value={keybinds} onChange={setKeybinds} />
              </div>

              {settings && (
                <p style={{ fontSize: "0.72rem", color: "var(--fg-dim)" }}>
                  Prompts asked so far: {settings.promptsAsked}
                </p>
              )}

              <div
                style={{
                  borderTop: "2px solid var(--border-strong)",
                  paddingTop: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--fg)",
                  }}
                >
                  Integrations
                </label>

                {disconnectError && (
                  <div
                    style={{
                      padding: "0.5rem 0.75rem",
                      background: "var(--error-dim)",
                      border: "2px solid var(--error)",
                      fontSize: "0.78rem",
                      color: "var(--error)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    {disconnectError}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    background: "var(--surface)",
                    border: "2px solid var(--border-strong)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "var(--fg)",
                      }}
                    >
                      Gmail
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: gmailConnected
                          ? "var(--accent-text)"
                          : "var(--error)",
                        fontWeight: 600,
                        marginTop: "0.1rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {gmailConnected ? "Connected ✓" : "Not connected"}
                    </div>
                  </div>
                  {gmailConnected ? (
                    <button
                      onClick={() => handleDisconnectPlugin("gmail")}
                      disabled={disconnectingPlugin !== null}
                      className="nb-btn-secondary"
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--error)",
                        borderColor: "var(--error)",
                        padding: "0.35rem 0.75rem",
                      }}
                    >
                      {disconnectingPlugin === "gmail"
                        ? "Disconnecting…"
                        : "Disconnect"}
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push("/dashboard/connect")}
                      className="nb-btn-secondary nb-shine"
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.35rem 0.75rem",
                      }}
                    >
                      Connect
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    background: "var(--surface)",
                    border: "2px solid var(--border-strong)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "var(--fg)",
                      }}
                    >
                      Google Calendar
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: calendarConnected
                          ? "var(--accent-text)"
                          : "var(--error)",
                        fontWeight: 600,
                        marginTop: "0.1rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {calendarConnected ? "Connected ✓" : "Not connected"}
                    </div>
                  </div>
                  {calendarConnected ? (
                    <button
                      onClick={() => handleDisconnectPlugin("googlecalendar")}
                      disabled={disconnectingPlugin !== null}
                      className="nb-btn-secondary"
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--error)",
                        borderColor: "var(--error)",
                        padding: "0.35rem 0.75rem",
                      }}
                    >
                      {disconnectingPlugin === "googlecalendar"
                        ? "Disconnecting…"
                        : "Disconnect"}
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push("/dashboard/connect")}
                      className="nb-btn-secondary nb-shine"
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.35rem 0.75rem",
                      }}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div
                  style={{
                    padding: "0.5rem 0.75rem",
                    background: "var(--error-dim)",
                    border: "2px solid var(--error)",
                    fontSize: "0.78rem",
                    color: "var(--error)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  {error}
                </div>
              )}

              {saved && (
                <div
                  style={{
                    padding: "0.5rem 0.75rem",
                    background: "var(--accent-dim)",
                    border: "2px solid var(--accent)",
                    fontSize: "0.78rem",
                    color: "var(--accent-text)",
                    fontWeight: 600,
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  Settings saved ✓
                </div>
              )}

              <button
                className="nb-btn-primary nb-shine"
                onClick={handleSave}
                disabled={saving}
                style={{ justifyContent: "center" }}
              >
                {saving ? "Saving…" : "Save settings"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
