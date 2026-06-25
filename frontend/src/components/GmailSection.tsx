"use client";

import { useState, useEffect, useCallback } from "react";
import {
  gmailApi,
  aiApi,
  type GmailMessage,
  type GmailDraft,
  type GmailLabel,
} from "../lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SecureMailFrame, getBody } from "./gmail/GmailUI";

type GmailView =
  | "home"
  | "inbox"
  | "drafts"
  | "sent"
  | "starred"
  | "trash"
  | "labels"
  | "compose"
  | "message"
  | "label-detail";

function formatDate(ts: string): string {
  const num = Number(ts);
  const d = !isNaN(num) && ts.trim() !== "" ? new Date(num) : new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function GmailSection() {
  const [view, setView] = useState<GmailView>("home");
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [drafts, setDrafts] = useState<GmailDraft[]>([]);
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<GmailMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedLabel, setSelectedLabel] = useState<GmailLabel | null>(null);

  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeSending, setComposeSending] = useState(false);
  const [composeMsg, setComposeMsg] = useState("");

  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const fetchMessages = useCallback(async (q?: string, labelIds?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await gmailApi.listMessages({ q, labelIds, maxResults: 30 });
      const list = Array.isArray(data) ? data : [];
      list.sort((a, b) => {
        const aTime =
          Number(a.data.internalDate ?? 0) ||
          new Date(a.data.createdAt ?? 0).getTime();
        const bTime =
          Number(b.data.internalDate ?? 0) ||
          new Date(b.data.createdAt ?? 0).getTime();
        return bTime - aTime;
      });
      setMessages(list);
    } catch {
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gmailApi.listDrafts();
      setDrafts(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load drafts");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLabels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gmailApi.listLabels();
      setLabels(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load labels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSelectedIds(new Set());
    setSelectedMsg(null);
    if (view === "inbox") fetchMessages(undefined, "INBOX");
    else if (view === "sent") fetchMessages(undefined, "SENT");
    else if (view === "starred") fetchMessages(undefined, "STARRED");
    else if (view === "trash") fetchMessages(undefined, "TRASH");
    else if (view === "drafts") fetchDrafts();
    else if (view === "labels") fetchLabels();
    else if (view === "label-detail" && selectedLabel)
      fetchMessages(undefined, selectedLabel.data.id);
  }, [view, fetchMessages, fetchDrafts, fetchLabels, selectedLabel]);

  const openMessage = async (msg: GmailMessage) => {
    setSelectedMsg(msg);
    setView("message");
    if (msg.data.labelIds?.includes("UNREAD")) {
      try {
        await gmailApi.modifyMessage(msg.data.id, {
          removeLabelIds: ["UNREAD"],
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id
              ? {
                  ...m,
                  data: {
                    ...m.data,
                    labelIds: m.data.labelIds.filter((l) => l !== "UNREAD"),
                  },
                }
              : m,
          ),
        );
        setSelectedMsg((prev) =>
          prev && prev.id === msg.id
            ? {
                ...prev,
                data: {
                  ...prev.data,
                  labelIds: prev.data.labelIds.filter((l) => l !== "UNREAD"),
                },
              }
            : prev,
        );
      } catch {}
    }
  };

  const trashMessage = async (id: string) => {
    try {
      await gmailApi.trashMessage(id);
      setMessages((prev) => prev.filter((m) => m.data.id !== id));
      if (view === "message") {
        setView("inbox");
        setSelectedMsg(null);
      }
    } catch {
      setError("Failed to trash message");
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Permanently delete? This cannot be undone.")) return;
    try {
      await gmailApi.deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m.data.id !== id));
      if (view === "message") {
        setView("inbox");
        setSelectedMsg(null);
      }
    } catch {
      setError("Failed to delete");
    }
  };

  const toggleStar = async (msg: GmailMessage) => {
    const isStarred = msg.data.labelIds?.includes("STARRED");
    try {
      const updated = await gmailApi.modifyMessage(
        msg.data.id,
        isStarred
          ? { removeLabelIds: ["STARRED"] }
          : { addLabelIds: ["STARRED"] },
      );
      setMessages((prev) =>
        prev.map((m) =>
          m.data.id === updated.data.id
            ? { ...m, data: { ...m.data, labelIds: updated.data.labelIds } }
            : m,
        ),
      );
      setSelectedMsg((prev) =>
        prev && prev.data.id === updated.data.id
          ? { ...prev, data: { ...prev.data, labelIds: updated.data.labelIds } }
          : prev,
      );
    } catch {
      setError("Failed to update star");
    }
  };

  const batchTrash = async () => {
    if (!selectedIds.size) return;
    try {
      await gmailApi.batchModify({
        ids: Array.from(selectedIds),
        addLabelIds: ["TRASH"],
        removeLabelIds: ["INBOX"],
      });
      setMessages((prev) => prev.filter((m) => !selectedIds.has(m.data.id)));
      setSelectedIds(new Set());
    } catch {
      setError("Batch trash failed");
    }
  };

  const batchMarkRead = async () => {
    if (!selectedIds.size) return;
    try {
      await gmailApi.batchModify({
        ids: Array.from(selectedIds),
        removeLabelIds: ["UNREAD"],
      });
      setMessages((prev) =>
        prev.map((m) =>
          selectedIds.has(m.data.id)
            ? {
                ...m,
                data: {
                  ...m.data,
                  labelIds: m.data.labelIds.filter((l) => l !== "UNREAD"),
                },
              }
            : m,
        ),
      );
      setSelectedIds(new Set());
    } catch {
      setError("Batch mark read failed");
    }
  };

  const sendCompose = async () => {
    if (!composeTo || !composeSubject || !composeBody) {
      setComposeMsg("To, subject, and body are required.");
      return;
    }
    setComposeSending(true);
    setComposeMsg("");
    try {
      await gmailApi.sendMessage({
        to: composeTo,
        subject: composeSubject,
        body: composeBody,
        cc: composeCc || undefined,
      });
      setComposeMsg("Sent!");
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setComposeCc("");
      setTimeout(() => setView("inbox"), 1200);
    } catch {
      setComposeMsg("Failed to send.");
    } finally {
      setComposeSending(false);
    }
  };

  const saveDraft = async () => {
    if (!composeTo || !composeSubject || !composeBody) {
      setComposeMsg("Fill required fields first.");
      return;
    }
    try {
      await gmailApi.createDraft({
        to: composeTo,
        subject: composeSubject,
        body: composeBody,
      });
      setComposeMsg("Draft saved.");
    } catch {
      setComposeMsg("Failed to save draft.");
    }
  };

  const deleteDraft = async (id: string) => {
    try {
      await gmailApi.deleteDraft(id);
      setDrafts((prev) => prev.filter((d) => d.data.id !== id));
    } catch {
      setError("Delete draft failed");
    }
  };

  const sendDraft = async (id: string) => {
    try {
      await gmailApi.sendDraft(id);
      setDrafts((prev) => prev.filter((d) => d.data.id !== id));
    } catch {
      setError("Send draft failed");
    }
  };

  const createLabel = async () => {
    const name = prompt("Label name:");
    if (!name) return;
    try {
      const label = await gmailApi.createLabel({
        name,
        messageListVisibility: "show",
        labelListVisibility: "labelShow",
      });
      setLabels((prev) => [...prev, label]);
    } catch {
      setError("Create label failed");
    }
  };

  const deleteLabel = async (id: string) => {
    if (!confirm("Delete this label?")) return;
    try {
      await gmailApi.deleteLabel(id);
      setLabels((prev) => prev.filter((l) => l.data.id !== id));
    } catch {
      setError("Delete label failed");
    }
  };

  const sendAiPrompt = async (promptOverride?: string) => {
    const promptText = (promptOverride ?? aiInput).trim();
    if (!promptText) return;
    if (promptOverride) setAiInput(promptOverride);
    setAiLoading(true);
    setAiResult(null);
    try {
      const result = await aiApi.prompt({
        prompt: promptText,
      });
      setAiResult(result ?? "Done.");
    } catch {
      setAiResult("AI request failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const navItems: { id: GmailView; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Home", icon: <HomeIcon /> },
    { id: "inbox", label: "Inbox", icon: <InboxIcon /> },
    { id: "drafts", label: "Drafts", icon: <DraftIcon /> },
    { id: "sent", label: "Sent", icon: <SentIcon /> },
    { id: "starred", label: "Starred", icon: <StarIcon /> },
    { id: "trash", label: "Trash", icon: <TrashIcon /> },
    { id: "labels", label: "Labels", icon: <LabelIcon /> },
  ];

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <div
        style={{
          width: 180,
          flexShrink: 0,
          borderRight: "1px solid var(--border)",
          padding: "1rem 0.625rem",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflowY: "auto",
        }}
      >
        <button
          onClick={() => {
            setView("compose");
            setComposeMsg("");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.55rem 0.75rem",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--accent-dim)",
            color: "var(--accent)",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            marginBottom: "0.75rem",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "var(--accent-dim)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "var(--accent-dim)")
          }
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1v12M1 7h12"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
          Compose
        </button>

        {navItems.map((item) => {
          const isActive =
            view === item.id ||
            (view === "label-detail" && item.id === "labels");
          return (
            <button
              key={item.id}
              onClick={() => {
                setSelectedLabel(null);
                setView(item.id);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.55rem",
                padding: "0.5rem 0.75rem",
                borderRadius: 8,
                border: "none",
                background: isActive ? "var(--accent-dim)" : "transparent",
                color: isActive ? "var(--accent)" : "var(--fg-dim)",
                fontSize: "0.825rem",
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
                width: "100%",
                textAlign: "left",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--surface)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--fg)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--fg-dim)";
                }
              }}
            >
              <span style={{ opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 1.25rem",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            {view === "message" && (
              <button
                onClick={() => {
                  setView("inbox");
                  setSelectedMsg(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--fg-dim)",
                  display: "flex",
                  alignItems: "center",
                  padding: 4,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M10 12L6 8L10 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            <h2
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              {view === "home" && "Home"}
              {view === "inbox" && "Inbox"}
              {view === "drafts" && "Drafts"}
              {view === "sent" && "Sent"}
              {view === "starred" && "Starred"}
              {view === "trash" && "Trash"}
              {view === "labels" && "Labels"}
              {view === "compose" && "Compose"}
              {view === "message" &&
                (selectedMsg
                  ? selectedMsg.data.subject || "Message"
                  : "Message")}
              {view === "label-detail" && selectedLabel?.data.name}
            </h2>
          </div>

          {selectedIds.size > 0 && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <ActionBtn onClick={batchMarkRead} label="Mark read" />
              <ActionBtn onClick={batchTrash} label="Trash" danger />
            </div>
          )}

          {(view === "inbox" ||
            view === "sent" ||
            view === "starred" ||
            view === "trash") && (
            <button
              onClick={() =>
                fetchMessages(
                  undefined,
                  view === "inbox"
                    ? "INBOX"
                    : view === "sent"
                      ? "SENT"
                      : view === "starred"
                        ? "STARRED"
                        : "TRASH",
                )
              }
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--fg-dim)",
                padding: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M12.5 2.5A6 6 0 1 1 7 1"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <path
                  d="M7 1L9.5 3.5L7 6"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        {view === "inbox" && (
          <div
            style={{
              padding: "0.75rem 1.25rem",
              borderBottom: "1px solid var(--border)",
              background: "var(--surface)",
            }}
          >
            <div
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "0.4rem 0.75rem",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  style={{ flexShrink: 0, opacity: 0.5 }}
                >
                  <circle
                    cx="7"
                    cy="7"
                    r="5"
                    stroke="var(--accent)"
                    strokeWidth="1.3"
                    fill="none"
                  />
                  <circle cx="7" cy="7" r="2" fill="var(--accent)" />
                </svg>
                <input
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendAiPrompt()}
                  placeholder="Ask AI about your inbox…"
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: "0.825rem",
                    color: "var(--fg)",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <button
                onClick={() => sendAiPrompt()}
                disabled={aiLoading || !aiInput.trim()}
                style={{
                  padding: "0.4rem 0.875rem",
                  borderRadius: 8,
                  border: "none",
                  background:
                    aiInput.trim() && !aiLoading
                      ? "var(--fg)"
                      : "var(--border)",
                  color:
                    aiInput.trim() && !aiLoading
                      ? "var(--bg)"
                      : "var(--fg-dim)",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor:
                    aiInput.trim() && !aiLoading ? "pointer" : "not-allowed",
                  fontFamily: "inherit",
                }}
              >
                {aiLoading ? "…" : "Ask"}
              </button>
            </div>
            {aiResult && (
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.6rem 0.875rem",
                  background: "var(--accent-dim)",
                  borderRadius: 8,
                  fontSize: "0.8rem",
                  color: "var(--fg)",
                  lineHeight: 1.6,
                  border: "1px solid rgba(45,122,79,0.15)",
                }}
              >
                {aiResult}
              </div>
            )}
          </div>
        )}

        {error && (
          <div
            style={{
              margin: "0.75rem 1.25rem",
              padding: "0.6rem 0.875rem",
              background: "var(--error-dim)",
              border: "1px solid #fecaca",
              borderRadius: 8,
              fontSize: "0.8rem",
              color: "var(--error)",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-thin">
          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "3rem",
                color: "var(--fg-dim)",
                fontSize: "0.85rem",
              }}
            >
              <LoadingDots />
            </div>
          )}

          {view === "home" && (
            <div
              style={{
                padding: "2.5rem 1.5rem",
                maxWidth: 720,
                margin: "0 auto",
              }}
            >
              {!aiLoading && !aiResult && (
                <>
                  <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: "var(--accent-dim)",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <SparkleIcon />
                    </div>
                    <h2
                      style={{
                        fontSize: "1.15rem",
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        marginBottom: "0.35rem",
                      }}
                    >
                      What do you need from your inbox?
                    </h2>
                    <p
                      style={{
                        fontSize: "0.825rem",
                        color: "var(--fg-dim)",
                      }}
                    >
                      Ask anything, or pick a quick action below.
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: "0.75rem",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <textarea
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendAiPrompt();
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
                        fontSize: "0.9rem",
                        lineHeight: 1.6,
                        fontFamily: "inherit",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => sendAiPrompt()}
                        disabled={aiLoading || !aiInput.trim()}
                        style={{
                          padding: "0.5rem 1.25rem",
                          borderRadius: 8,
                          border: "none",
                          background:
                            aiInput.trim() && !aiLoading
                              ? "var(--fg)"
                              : "var(--border)",
                          color:
                            aiInput.trim() && !aiLoading
                              ? "var(--bg)"
                              : "var(--fg-dim)",
                          fontSize: "0.825rem",
                          fontWeight: 600,
                          cursor:
                            aiInput.trim() && !aiLoading
                              ? "pointer"
                              : "not-allowed",
                          fontFamily: "inherit",
                        }}
                      >
                        {aiLoading ? "Thinking…" : "Ask AI"}
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "0.6rem",
                      marginBottom: "1.25rem",
                    }}
                  >
                    {[
                      {
                        label: "Prioritize my inbox",
                        description: "Rank unread mails by urgency",
                        prompt:
                          "Look at my unread emails and rank them by urgency and importance, with a short reason for each.",
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
                    ].map((action) => (
                      <button
                        key={action.label}
                        onClick={() => sendAiPrompt(action.prompt)}
                        disabled={aiLoading}
                        style={{
                          textAlign: "left",
                          padding: "0.75rem 0.9rem",
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "var(--bg)",
                          cursor: aiLoading ? "not-allowed" : "pointer",
                          fontFamily: "inherit",
                          transition: "background 0.15s, border-color 0.15s",
                          opacity: aiLoading ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!aiLoading) {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.background = "var(--accent-dim)";
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.borderColor = "var(--accent)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "var(--bg)";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.borderColor = "var(--border)";
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "var(--fg)",
                            marginBottom: "0.15rem",
                          }}
                        >
                          {action.label}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
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

              {aiLoading && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "3rem",
                  }}
                >
                  <LoadingDots />
                </div>
              )}

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
                        fontSize: "0.825rem",
                        color: "var(--fg-dim)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "80%",
                      }}
                    >
                      {aiInput}
                    </span>
                    <button
                      onClick={() => {
                        setAiResult(null);
                        setAiInput("");
                      }}
                      style={{
                        padding: "0.35rem 0.75rem",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "transparent",
                        color: "var(--fg-dim)",
                        fontSize: "0.775rem",
                        fontWeight: 500,
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
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--fg)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => (
                          <p
                            style={{ marginBottom: "0.6rem", lineHeight: 1.7 }}
                          >
                            {children}
                          </p>
                        ),
                        strong: ({ children }) => (
                          <strong style={{ fontWeight: 600 }}>
                            {children}
                          </strong>
                        ),
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: "var(--accent)",
                              textDecoration: "underline",
                              textUnderlineOffset: 3,
                            }}
                          >
                            {children}
                          </a>
                        ),
                        ul: ({ children }) => (
                          <ul
                            style={{
                              paddingLeft: "1.25rem",
                              marginBottom: "0.6rem",
                              listStyleType: "disc",
                            }}
                          >
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol
                            style={{
                              paddingLeft: "1.25rem",
                              marginBottom: "0.6rem",
                              listStyleType: "decimal",
                            }}
                          >
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li
                            style={{ marginBottom: "0.3rem", lineHeight: 1.65 }}
                          >
                            {children}
                          </li>
                        ),
                        h1: ({ children }) => (
                          <h1
                            style={{
                              fontWeight: 700,
                              fontSize: "1.15rem",
                              marginBottom: "0.4rem",
                              marginTop: "0.75rem",
                              letterSpacing: "-0.02em",
                            }}
                          >
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2
                            style={{
                              fontWeight: 700,
                              fontSize: "1rem",
                              marginBottom: "0.4rem",
                              marginTop: "0.75rem",
                              letterSpacing: "-0.02em",
                            }}
                          >
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3
                            style={{
                              fontWeight: 600,
                              fontSize: "0.95rem",
                              marginBottom: "0.35rem",
                              marginTop: "0.6rem",
                            }}
                          >
                            {children}
                          </h3>
                        ),
                        code: ({ className, children, ...props }) => {
                          const isBlock = !!className;
                          if (isBlock) {
                            const lang = className?.replace("language-", "");
                            return (
                              <pre
                                style={{
                                  background: "var(--surface)",
                                  border: "1px solid var(--border)",
                                  borderRadius: 8,
                                  padding: "1rem",
                                  overflowX: "auto",
                                  margin: "0.6rem 0",
                                }}
                              >
                                {lang && (
                                  <span
                                    style={{
                                      color: "var(--fg-dim)",
                                      fontSize: "0.7rem",
                                      display: "block",
                                      marginBottom: "0.4rem",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.05em",
                                    }}
                                  >
                                    {lang}
                                  </span>
                                )}
                                <code
                                  style={{
                                    fontFamily: "var(--font-geist-mono)",
                                    fontSize: "0.83rem",
                                    lineHeight: 1.6,
                                  }}
                                >
                                  {children}
                                </code>
                              </pre>
                            );
                          }
                          return (
                            <code
                              style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: 4,
                                padding: "1px 5px",
                                fontFamily: "var(--font-geist-mono)",
                                fontSize: "0.82em",
                                color: "var(--accent)",
                              }}
                            >
                              {children}
                            </code>
                          );
                        },
                        pre: ({ children }) => <>{children}</>,
                        blockquote: ({ children }) => (
                          <blockquote
                            style={{
                              borderLeft: "3px solid var(--accent)",
                              paddingLeft: "0.875rem",
                              margin: "0.6rem 0",
                              color: "var(--fg-dim)",
                              fontStyle: "italic",
                            }}
                          >
                            {children}
                          </blockquote>
                        ),
                        hr: () => (
                          <hr
                            style={{
                              border: "none",
                              borderTop: "1px solid var(--border)",
                              margin: "1rem 0",
                            }}
                          />
                        ),
                        table: ({ children }) => (
                          <div
                            style={{
                              overflowX: "auto",
                              marginBottom: "0.6rem",
                            }}
                          >
                            <table
                              style={{
                                borderCollapse: "collapse",
                                width: "100%",
                                fontSize: "0.85rem",
                              }}
                            >
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th
                            style={{
                              border: "1px solid var(--border)",
                              padding: "0.4rem 0.75rem",
                              background: "var(--surface)",
                              fontWeight: 600,
                              textAlign: "left",
                            }}
                          >
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td
                            style={{
                              border: "1px solid var(--border)",
                              padding: "0.4rem 0.75rem",
                            }}
                          >
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {aiResult}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}
          {!loading &&
            (view === "inbox" ||
              view === "sent" ||
              view === "starred" ||
              view === "trash" ||
              view === "label-detail") && (
              <div>
                {messages.length === 0 && (
                  <EmptyState label={`No messages in ${view}`} />
                )}
                {messages.map((msg) => {
                  const isUnread = msg.data.labelIds?.includes("UNREAD");
                  const isStarred = msg.data.labelIds?.includes("STARRED");
                  const isSelected = selectedIds.has(msg.data.id);
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.65rem 1.25rem",
                        borderBottom: "1px solid var(--border)",
                        cursor: "pointer",
                        background: isSelected
                          ? "var(--accent-dim)"
                          : isUnread
                            ? "var(--surface)"
                            : "transparent",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected)
                          (e.currentTarget as HTMLDivElement).style.background =
                            "var(--surface)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected)
                          (e.currentTarget as HTMLDivElement).style.background =
                            isUnread ? "var(--surface)" : "transparent";
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          const s = new Set(selectedIds);
                          if (isSelected) s.delete(msg.data.id);
                          else s.add(msg.data.id);
                          setSelectedIds(s);
                        }}
                        style={{
                          flexShrink: 0,
                          accentColor: "var(--accent)",
                          cursor: "pointer",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(msg);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 2,
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill={isStarred ? "#f59e0b" : "none"}
                          style={{ display: "block" }}
                        >
                          <path
                            d="M7 1L8.545 5.09H13L9.636 7.545L10.818 12L7 9.454L3.182 12L4.364 7.545L1 5.09H5.455L7 1Z"
                            stroke={isStarred ? "#f59e0b" : "var(--fg-dim)"}
                            strokeWidth="1.2"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <div
                        style={{ flex: 1, minWidth: 0 }}
                        onClick={() => openMessage(msg)}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            gap: "1rem",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.825rem",
                              fontWeight: isUnread ? 600 : 400,
                              color: "var(--fg)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {msg.data.from || "Unknown"}
                          </span>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--fg-dim)",
                              flexShrink: 0,
                            }}
                          >
                            {formatDate(
                              msg.data.internalDate ??
                                msg.data.date ??
                                msg.data.createdAt ??
                                "",
                            )}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: isUnread ? 500 : 400,
                            color: isUnread ? "var(--fg)" : "var(--fg-dim)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {msg.data.subject || "(no subject)"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.775rem",
                            color: "var(--fg-dim)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {msg.data.snippet}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.25rem",
                          flexShrink: 0,
                        }}
                      >
                        {view !== "trash" && (
                          <IconBtn
                            onClick={(e) => {
                              e.stopPropagation();
                              trashMessage(msg.data.id);
                            }}
                            title="Trash"
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 13 13"
                              fill="none"
                            >
                              <path
                                d="M1.5 3.5H11.5M4 3.5V2H9V3.5M5 6V10M8 6V10M2.5 3.5L3.5 11H9.5L10.5 3.5H2.5Z"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </IconBtn>
                        )}
                        {view === "trash" && (
                          <>
                            <IconBtn
                              onClick={(e) => {
                                e.stopPropagation();
                                gmailApi
                                  .untrashMessage(msg.data.id)
                                  .then(() =>
                                    fetchMessages(undefined, "TRASH"),
                                  );
                              }}
                              title="Restore"
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 13 13"
                                fill="none"
                              >
                                <path
                                  d="M9 5L6 2L3 5M6 2V10"
                                  stroke="currentColor"
                                  strokeWidth="1.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </IconBtn>
                            <IconBtn
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMessage(msg.data.id);
                              }}
                              title="Delete forever"
                              danger
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 13 13"
                                fill="none"
                              >
                                <path
                                  d="M2 2L11 11M11 2L2 11"
                                  stroke="currentColor"
                                  strokeWidth="1.3"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </IconBtn>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          {!loading && view === "drafts" && (
            <div>
              {drafts.length === 0 && <EmptyState label="No drafts" />}
              {drafts.map((draft) => {
                const msg = draft.data.message;
                return (
                  <div
                    key={draft.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.65rem 1.25rem",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.825rem",
                          fontWeight: 500,
                          color: "var(--fg)",
                        }}
                      >
                        To: {msg.to || "—"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--fg-dim)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {msg.subject || "(no subject)"} — {msg.snippet}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      <ActionBtn
                        onClick={() => sendDraft(draft.data.id)}
                        label="Send"
                        small
                      />
                      <IconBtn
                        onClick={() => deleteDraft(draft.data.id)}
                        title="Delete"
                        danger
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 13 13"
                          fill="none"
                        >
                          <path
                            d="M2 2L11 11M11 2L2 11"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            strokeLinecap="round"
                          />
                        </svg>
                      </IconBtn>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && view === "labels" && (
            <div style={{ padding: "1rem 1.25rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "var(--fg-dim)" }}>
                  {labels.length} label{labels.length !== 1 ? "s" : ""}
                </span>
                <ActionBtn onClick={createLabel} label="New label" />
              </div>
              {labels.length === 0 && <EmptyState label="No labels" />}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                {labels.map((label) => (
                  <div
                    key={label.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.6rem 0.875rem",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background:
                            label.data.color?.backgroundColor ??
                            "var(--accent)",
                        }}
                      />
                      <button
                        onClick={() => {
                          setSelectedLabel(label);
                          setView("label-detail");
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "0.825rem",
                          fontWeight: 500,
                          color: "var(--fg)",
                          fontFamily: "inherit",
                        }}
                      >
                        {label.data.name}
                      </button>
                      {label.data.messagesUnread ? (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "1px 6px",
                            borderRadius: 100,
                            background: "var(--accent-dim)",
                            color: "var(--accent)",
                            fontWeight: 600,
                          }}
                        >
                          {label.data.messagesUnread}
                        </span>
                      ) : null}
                    </div>
                    {label.data.type !== "system" && (
                      <IconBtn
                        onClick={() => deleteLabel(label.data.id)}
                        title="Delete label"
                        danger
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 13 13"
                          fill="none"
                        >
                          <path
                            d="M2 2L11 11M11 2L2 11"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            strokeLinecap="round"
                          />
                        </svg>
                      </IconBtn>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && view === "message" && selectedMsg && (
            <div style={{ padding: "1.5rem", maxWidth: 720 }}>
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  marginBottom: "1rem",
                }}
              >
                {selectedMsg.data.subject || "(no subject)"}
              </h2>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "1.25rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.825rem",
                    color: "var(--fg-dim)",
                    lineHeight: 1.7,
                  }}
                >
                  <div>
                    <strong style={{ color: "var(--fg)" }}>From:</strong>{" "}
                    {selectedMsg.data.from}
                  </div>
                  <div>
                    <strong style={{ color: "var(--fg)" }}>To:</strong>{" "}
                    {selectedMsg.data.to}
                  </div>
                  <div>
                    <strong style={{ color: "var(--fg)" }}>Date:</strong>{" "}
                    {(() => {
                      const ts = selectedMsg.data.internalDate;
                      const d = ts
                        ? new Date(Number(ts))
                        : new Date(selectedMsg.data.createdAt ?? "");
                      return d.toLocaleString();
                    })()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    onClick={() => toggleStar(selectedMsg)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 14 14"
                      fill={
                        selectedMsg.data.labelIds?.includes("STARRED")
                          ? "#f59e0b"
                          : "none"
                      }
                    >
                      <path
                        d="M7 1L8.545 5.09H13L9.636 7.545L10.818 12L7 9.454L3.182 12L4.364 7.545L1 5.09H5.455L7 1Z"
                        stroke={
                          selectedMsg.data.labelIds?.includes("STARRED")
                            ? "#f59e0b"
                            : "var(--fg-dim)"
                        }
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <ActionBtn
                    onClick={() => trashMessage(selectedMsg.data.id)}
                    label="Trash"
                    danger
                  />
                </div>
              </div>
              <div
                style={{
                  background: "var(--surface)",
                  borderRadius: 10,
                  padding: "1.25rem",
                  border: "1px solid var(--border)",
                }}
              >
                {(() => {
                  const { content, isHtml } = getBody(selectedMsg.data);
                  const bodyText = content || "(empty)";

                  return isHtml ? (
                    <SecureMailFrame htmlContent={bodyText} />
                  ) : (
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontSize: "0.875rem",
                        lineHeight: 1.75,
                        color: "var(--fg)",
                      }}
                    >
                      {bodyText}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {view === "compose" && (
            <div style={{ padding: "1.5rem", maxWidth: 620 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <ComposeField
                  label="To *"
                  value={composeTo}
                  onChange={setComposeTo}
                  placeholder="recipient@example.com"
                />
                <ComposeField
                  label="CC"
                  value={composeCc}
                  onChange={setComposeCc}
                  placeholder="cc@example.com"
                />
                <ComposeField
                  label="Subject *"
                  value={composeSubject}
                  onChange={setComposeSubject}
                  placeholder="Subject"
                />
                <div>
                  <label
                    style={{
                      fontSize: "0.775rem",
                      color: "var(--fg-dim)",
                      display: "block",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Body *
                  </label>
                  <textarea
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    rows={10}
                    placeholder="Write your message…"
                    style={{
                      width: "100%",
                      resize: "vertical",
                      padding: "0.625rem 0.875rem",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      background: "var(--surface)",
                      color: "var(--fg)",
                      fontSize: "0.875rem",
                      lineHeight: 1.6,
                      fontFamily: "inherit",
                      outline: "none",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <button
                    onClick={sendCompose}
                    disabled={composeSending}
                    style={{
                      padding: "0.55rem 1.25rem",
                      borderRadius: 8,
                      border: "none",
                      background: "var(--fg)",
                      color: "var(--bg)",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      cursor: composeSending ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      opacity: composeSending ? 0.6 : 1,
                    }}
                  >
                    {composeSending ? "Sending…" : "Send"}
                  </button>
                  <button
                    onClick={saveDraft}
                    style={{
                      padding: "0.55rem 1.25rem",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "transparent",
                      color: "var(--fg)",
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Save draft
                  </button>
                  {composeMsg && (
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color:
                          composeMsg === "Sent!"
                            ? "var(--accent)"
                            : "var(--error)",
                      }}
                    >
                      {composeMsg}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ComposeField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label
        style={{
          fontSize: "0.775rem",
          color: "var(--fg-dim)",
          display: "block",
          marginBottom: "0.35rem",
        }}
      >
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "0.525rem 0.875rem",
          border: "1px solid var(--border)",
          borderRadius: 8,
          background: "var(--surface)",
          color: "var(--fg)",
          fontSize: "0.875rem",
          fontFamily: "inherit",
          outline: "none",
        }}
      />
    </div>
  );
}

function ActionBtn({
  onClick,
  label,
  danger,
  small,
}: {
  onClick: () => void;
  label: string;
  danger?: boolean;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: small ? "0.3rem 0.625rem" : "0.35rem 0.75rem",
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: danger ? "var(--error-dim)" : "var(--surface)",
        color: danger ? "var(--error)" : "var(--fg)",
        fontSize: "0.775rem",
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "background 0.15s",
      }}
    >
      {label}
    </button>
  );
}

function IconBtn({
  onClick,
  title,
  danger,
  children,
}: {
  onClick: (e: React.MouseEvent) => void;
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 26,
        height: 26,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "none",
        border: "none",
        cursor: "pointer",
        borderRadius: 5,
        color: danger ? "var(--error)" : "var(--fg-dim)",
        transition: "background 0.1s, color 0.1s",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.background = danger
          ? "var(--error-dim)"
          : "var(--surface)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.background = "none")
      }
    >
      {children}
    </button>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "3rem",
        color: "var(--fg-dim)",
        fontSize: "0.85rem",
      }}
    >
      {label}
    </div>
  );
}

function LoadingDots() {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="thinking-dot"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M1.5 6.5L7 1.5L12.5 6.5V12.5H8.5V8.5H5.5V12.5H1.5V6.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
      <path
        d="M7 1L8.545 5.09H13L9.636 7.545L10.818 12L7 9.454L3.182 12L4.364 7.545L1 5.09H5.455L7 1Z"
        stroke="var(--accent)"
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill="var(--accent-dim)"
      />
    </svg>
  );
}
function InboxIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M1.5 9.5H4L5.5 12H8.5L10 9.5H12.5V2.5H1.5V9.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function DraftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M9.5 1.5L12.5 4.5L5 12H2V9L9.5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function SentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M12.5 1.5L6.5 7.5M12.5 1.5L8.5 12.5L6.5 7.5M12.5 1.5L1.5 5.5L6.5 7.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M7 1L8.545 5.09H13L9.636 7.545L10.818 12L7 9.454L3.182 12L4.364 7.545L1 5.09H5.455L7 1Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M1.5 3.5H12.5M4.5 3.5V2H9.5V3.5M5.5 6V10M8.5 6V10M2.5 3.5L3.5 12H10.5L11.5 3.5H2.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function LabelIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M1.5 1.5H7.5L12.5 7L7.5 12.5H1.5V1.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="4.5" cy="5" r="1" fill="currentColor" />
    </svg>
  );
}
