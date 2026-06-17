"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import NbBackdrop from "../../../components/NbBackdrop";

type ConnectionStatus = {
  gmail: boolean;
  googlecalendar: boolean;
};

function ConnectPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    gmail: false,
    googlecalendar: false,
  });
  const [activeLoadingPlugin, setActiveLoadingPlugin] = useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
    if (auth.status === "authenticated") {
      const userPlugins = auth.user.plugins ?? {};
      setConnectionStatus({
        gmail: userPlugins.gmail === true,
        googlecalendar: userPlugins.googlecalendar === true,
      });
    }
  }, [auth]);

  useEffect(() => {
    if (searchParams.get("connected") !== "true") return;

    setShowSuccessBanner(true);
    const bannerTimer = setTimeout(() => setShowSuccessBanner(false), 4000);

    authApi
      .me()
      .then(({ user }) => {
        setConnectionStatus({
          gmail: user.plugins?.gmail === true,
          googlecalendar: user.plugins?.googlecalendar === true,
        });
      })
      .catch(() => {});

    return () => clearTimeout(bannerTimer);
  }, [searchParams]);

  const handleConnect = async (pluginId: "gmail" | "googlecalendar") => {
    setErrorMessage(null);
    setActiveLoadingPlugin(pluginId);
    try {
      const { url } = await authApi.connectLink(pluginId);
      window.location.href = url;
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to get connect link",
      );
      setActiveLoadingPlugin(null);
    }
  };

  const handleDisconnect = async (pluginId: "gmail" | "googlecalendar") => {
    setErrorMessage(null);
    setActiveLoadingPlugin(`disconnect-${pluginId}`);
    try {
      await authApi.disconnectPlugin(pluginId);
      setConnectionStatus((prev) => ({ ...prev, [pluginId]: false }));
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to disconnect",
      );
    } finally {
      setActiveLoadingPlugin(null);
    }
  };

  const handleContinue = () => {
    router.push("/dashboard");
  };

  const handleLogout = async () => {
    await auth.logout();
    router.replace("/");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <NbBackdrop variant="auth" />

      <div
        className="nb-card nb-scrap-strip nb-cut-corner-tl"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
          padding: "2.5rem 2rem",
          width: 340,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          className="nb-logo-mark"
          style={{ width: 44, height: 44, marginBottom: "0.25rem" }}
        >
          <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 13L8 3L13 13"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5 9.5H11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
          <h1
            style={{
              fontSize: "1.1rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              marginBottom: "0.3rem",
              color: "var(--fg)",
            }}
          >
            Connect accounts
          </h1>
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--fg-dim)",
              lineHeight: 1.5,
              letterSpacing: "0.01em",
            }}
          >
            Link your Google services to get started.
          </p>
        </div>

        {showSuccessBanner && (
          <div
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              background: "var(--accent-dim)",
              border: "2px solid var(--accent)",
              fontSize: "0.78rem",
              color: "var(--accent-text)",
              textAlign: "center",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              borderRadius: "var(--radius-sm)",
            }}
          >
            Account connected ✓
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              background: "var(--error-dim)",
              border: "2px solid var(--error)",
              fontSize: "0.78rem",
              color: "var(--error)",
              textAlign: "center",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {errorMessage}
          </div>
        )}

        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
            <button
              onClick={() => handleConnect("gmail")}
              disabled={activeLoadingPlugin !== null || connectionStatus.gmail}
              className="nb-btn-secondary nb-shine"
              style={{ flex: 1, justifyContent: "center" }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect
                  x="1.5"
                  y="3.5"
                  width="13"
                  height="9"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M1.5 4.5L8 9L14.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              {connectionStatus.gmail
                ? "Gmail ✓"
                : activeLoadingPlugin === "gmail"
                  ? "Redirecting…"
                  : "Connect Gmail"}
            </button>
            {connectionStatus.gmail && (
              <button
                onClick={() => handleDisconnect("gmail")}
                disabled={activeLoadingPlugin !== null}
                className="nb-btn-secondary"
                style={{
                  padding: "0 0.65rem",
                  flexShrink: 0,
                  color: "var(--error)",
                  borderColor: "var(--error)",
                }}
                title="Disconnect Gmail"
              >
                {activeLoadingPlugin === "disconnect-gmail" ? "…" : "✕"}
              </button>
            )}
            {!connectionStatus.gmail && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "0.7rem",
                  color: "var(--error)",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  flexShrink: 0,
                  paddingLeft: "0.25rem",
                }}
              >
                NOT CONNECTED
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
            <button
              onClick={() => handleConnect("googlecalendar")}
              disabled={
                activeLoadingPlugin !== null || connectionStatus.googlecalendar
              }
              className="nb-btn-secondary nb-shine"
              style={{ flex: 1, justifyContent: "center" }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect
                  x="1.5"
                  y="2.5"
                  width="13"
                  height="12"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M5 1.5V3.5M11 1.5V3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M1.5 6.5H14.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <rect
                  x="4"
                  y="9"
                  width="2"
                  height="2"
                  rx="0.3"
                  fill="currentColor"
                />
                <rect
                  x="7"
                  y="9"
                  width="2"
                  height="2"
                  rx="0.3"
                  fill="currentColor"
                />
                <rect
                  x="10"
                  y="9"
                  width="2"
                  height="2"
                  rx="0.3"
                  fill="currentColor"
                />
              </svg>
              {connectionStatus.googlecalendar
                ? "Calendar ✓"
                : activeLoadingPlugin === "googlecalendar"
                  ? "Redirecting…"
                  : "Connect Calendar"}
            </button>
            {connectionStatus.googlecalendar && (
              <button
                onClick={() => handleDisconnect("googlecalendar")}
                disabled={activeLoadingPlugin !== null}
                className="nb-btn-secondary"
                style={{
                  padding: "0 0.65rem",
                  flexShrink: 0,
                  color: "var(--error)",
                  borderColor: "var(--error)",
                }}
                title="Disconnect Calendar"
              >
                {activeLoadingPlugin === "disconnect-googlecalendar"
                  ? "…"
                  : "✕"}
              </button>
            )}
            {!connectionStatus.googlecalendar && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "0.7rem",
                  color: "var(--error)",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  flexShrink: 0,
                  paddingLeft: "0.25rem",
                }}
              >
                NOT CONNECTED
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleContinue}
          className="nb-btn-primary nb-shine"
          style={{
            width: "100%",
            justifyContent: "center",
            marginTop: "0.25rem",
          }}
        >
          Continue →
        </button>

        <button
          onClick={handleLogout}
          className="nb-btn-primary nb-shine"
          style={{
            width: "100%",
            justifyContent: "center",
            marginTop: "0.25rem",
          }}
        >
          Logout
        </button>

        <p
          style={{
            fontSize: "0.7rem",
            color: "var(--fg-dim)",
            textAlign: "center",
            marginTop: "0.25rem",
            letterSpacing: "0.01em",
          }}
        >
          Each account is connected individually and stored securely.
        </p>
      </div>
    </div>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={null}>
      <ConnectPageInner />
    </Suspense>
  );
}
