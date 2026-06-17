"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import LoadingScreen from "../../components/LoadingScreen";
import NbBackdrop from "../../components/NbBackdrop";

function formatMemberSince(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function initialFromName(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export default function ProfilePage() {
  const auth = useAuth();
  const { status, deleteAccount } = auth;
  const user = "user" in auth ? auth.user : null;
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth");
  }, [status, router]);

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      "Delete your account? This permanently disconnects Gmail and Google Calendar, erases all synced data, and cannot be undone.",
    );
    if (!confirmed) return;

    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteAccount();
      router.replace("/auth");
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete account",
      );
      setDeleting(false);
    }
  };

  if (status === "loading" || status === "unauthenticated" || !user) {
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
              Profile
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--fg-dim)",
                lineHeight: 1.5,
              }}
            >
              Your account details and account-level actions.
            </p>
          </div>

          <div
            className="nb-card nb-cut-corner-tl"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1.5rem",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                flexShrink: 0,
                borderRadius: "50%",
                border: "2px solid var(--border-strong)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--bg-alt)",
                fontSize: "1.4rem",
                fontWeight: 800,
                color: "var(--fg)",
              }}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                initialFromName(user.name)
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
                minWidth: 0,
              }}
            >
              <div
                style={{ fontSize: "1rem", fontWeight: 700, color: "var(--fg)" }}
              >
                {user.name}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--fg-dim)" }}>
                {user.email}
              </div>
              <div style={{ marginTop: "0.2rem" }}>
                <span className="nb-tag">
                  {user.provider === "google"
                    ? "Google account"
                    : "Email & password"}
                </span>
              </div>
            </div>
          </div>

          <div
            className="nb-card"
            style={{
              padding: "1.25rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
            }}
          >
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--fg)",
              }}
            >
              Member since
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--fg-dim)" }}>
              {formatMemberSince(user.createdAt)}
            </div>
          </div>

          <div
            className="nb-card nb-card-red"
            style={{
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--error)",
              }}
            >
              Danger zone
            </div>
            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--fg-dim)",
                lineHeight: 1.5,
              }}
            >
              Permanently deletes your account, disconnects Gmail and Google
              Calendar, and erases all synced data. This cannot be undone.
            </p>

            {deleteError && (
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
                {deleteError}
              </div>
            )}

            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="nb-btn-secondary"
              style={{
                fontSize: "0.78rem",
                color: "var(--error)",
                borderColor: "var(--error)",
                justifyContent: "center",
                alignSelf: "flex-start",
                padding: "0.5rem 1rem",
              }}
            >
              {deleting ? "Deleting…" : "Delete account"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
