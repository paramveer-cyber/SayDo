"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { gmailApi } from "../../../../lib/api";
import { ComposeField, ErrorBanner } from "../../../../components/gmail/GmailUI";
import GmailPageHeader from "../../../../components/gmail/GmailPageHeader";

export default function ComposePage() {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const send = async () => {
    if (!to || !subject || !body) { setMsg("To, subject, and body are required."); return; }
    setSending(true);
    setMsg("");
    setError("");
    try {
      await gmailApi.sendMessage({ to, subject, body, cc: cc || undefined });
      setMsg("Sent!");
      setTimeout(() => router.push("/dashboard/gmail/inbox"), 1200);
    } catch {
      setError("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const saveDraft = async () => {
    if (!to || !subject || !body) { setMsg("Fill required fields first."); return; }
    try {
      await gmailApi.createDraft({ to, subject, body });
      setMsg("Draft saved.");
    } catch {
      setError("Failed to save draft.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", minWidth: 0 }}>
      <GmailPageHeader title="Compose" onBack={() => router.back()} />

      {error && <ErrorBanner message={error} />}

      <div style={{ flex: 1, overflowY: "auto", padding: "1.75rem 1.5rem" }} className="scrollbar-thin">
        <div
          style={{
            maxWidth: 640,
            display: "flex",
            flexDirection: "column",
            gap: "0.9rem",
            background: "var(--surface)",
            border: "1.5px solid var(--border-strong)",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem",
            boxShadow: "4px 4px 0 var(--border)",
          }}
        >
          <ComposeField label="To *" value={to} onChange={setTo} placeholder="recipient@example.com" />
          <ComposeField label="CC" value={cc} onChange={setCc} placeholder="cc@example.com" />
          <ComposeField label="Subject *" value={subject} onChange={setSubject} placeholder="Subject" />

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
              Body *
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder="Write your message…"
              className="nb-input"
              style={{
                resize: "vertical",
                borderRadius: "var(--radius-md)",
                lineHeight: 1.6,
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={send}
              disabled={sending}
              className="nb-btn-primary"
              style={{ opacity: sending ? 0.6 : 1, cursor: sending ? "not-allowed" : "pointer" }}
            >
              {sending ? "Sending…" : "Send"}
            </button>
            <button onClick={saveDraft} className="nb-btn-secondary">
              Save draft
            </button>
            <button
              onClick={() => router.back()}
              style={{
                padding: "0.6rem 1rem",
                borderRadius: "var(--radius-sm)",
                border: "1.5px solid transparent",
                background: "transparent",
                color: "var(--fg-dim)",
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
            {msg && (
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: msg === "Sent!" || msg === "Draft saved." ? "var(--green)" : "var(--red)" }}>
                {msg}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
