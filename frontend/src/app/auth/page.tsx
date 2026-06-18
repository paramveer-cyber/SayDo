"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import NbBackdrop from "../../components/NbBackdrop";
import { allPluginsConnected } from "../../lib/plugins";

type Mode = "login" | "register";

function GeoDoodle() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      style={{
        position: "absolute",
        top: -20,
        right: -30,
        opacity: 0.5,
        pointerEvents: "none",
      }}
    >
      <rect
        x="10"
        y="10"
        width="60"
        height="60"
        stroke="var(--blue)"
        strokeWidth="2"
        transform="rotate(15 40 40)"
        fill="none"
      />
      <circle
        cx="90"
        cy="30"
        r="20"
        stroke="var(--red)"
        strokeWidth="2"
        fill="var(--red-dim)"
      />
      <line
        x1="0"
        y1="100"
        x2="100"
        y2="0"
        stroke="var(--yellow)"
        strokeWidth="1.5"
      />
      <circle cx="20" cy="95" r="4" fill="var(--green)" />
    </svg>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const auth = useAuth();
  const { status, login, register, googleLogin } = auth;
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "authenticated") {
      router.replace(
        allPluginsConnected(auth.user.plugins)
          ? "/dashboard"
          : "/dashboard/connect",
      );
    }
  }, [auth, router]);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return null;

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
        style={{
          width: "100%",
          maxWidth: 400,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          className="nb-card nb-scrap-strip nb-cut-corner"
          style={{
            padding: "2.5rem 2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <GeoDoodle />

          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div
              className="nb-logo-mark"
              style={{ width: 36, height: 36, overflow: "hidden" }}
            >
              <img
                src="/icon.png"
                alt="Corsair"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <span className="nb-wordmark" style={{ fontSize: "1.1rem" }}>
              Corsair
            </span>
          </div>

          <div>
            <h1
              style={{
                fontSize: "1.4rem",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                textTransform: "uppercase",
                marginBottom: "0.2rem",
                color: "var(--fg)",
              }}
            >
              {mode === "login" ? "Welcome back" : "Join Corsair"}
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--fg-dim)",
                letterSpacing: "0.02em",
              }}
            >
              {mode === "login" ? "Sign in to continue" : "Create your account"}
            </p>
          </div>

          <div className="nb-google-wrap">
            <div className="nb-google-shapes">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect
                  x="1"
                  y="1"
                  width="8"
                  height="8"
                  stroke="var(--red)"
                  strokeWidth="1.6"
                />
              </svg>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <polygon
                  points="5,0.8 9.2,9 0.8,9"
                  stroke="var(--yellow)"
                  strokeWidth="1.6"
                  fill="none"
                />
              </svg>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle
                  cx="5"
                  cy="5"
                  r="4"
                  stroke="var(--blue)"
                  strokeWidth="1.6"
                />
              </svg>
            </div>
            <GoogleLogin
              onSuccess={({ credential }) => {
                if (!credential) {
                  setError("Google sign-in failed");
                  return;
                }
                setLoading(true);
                googleLogin(credential)
                  .catch((err) =>
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Google sign-in failed",
                    ),
                  )
                  .finally(() => setLoading(false));
              }}
              onError={() => setError("Google sign-in failed")}
              useOneTap={false}
              theme="filled_black"
              shape="rectangular"
              text="continue_with"
              width="356"
            />
          </div>

          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div style={{ flex: 1, height: 2, background: "var(--border)" }} />
            <span
              style={{
                fontSize: "0.65rem",
                color: "var(--fg-dim)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              or
            </span>
            <div style={{ flex: 1, height: 2, background: "var(--border)" }} />
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {mode === "register" && (
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="nb-input"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="nb-input"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="nb-input"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {error && (
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--error)",
                margin: 0,
                padding: "0.5rem 0.75rem",
                background: "var(--error-dim)",
                border: "1.5px solid var(--error)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {error}
            </p>
          )}

          <button
            className="nb-btn-primary nb-shine"
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>

          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--fg-dim)",
              textAlign: "center",
              margin: 0,
            }}
          >
            {mode === "login" ? "No account? " : "Have an account? "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--accent-text)",
                fontWeight: 700,
                fontSize: "inherit",
                fontFamily: "inherit",
                padding: 0,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              {mode === "login" ? "Register" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
