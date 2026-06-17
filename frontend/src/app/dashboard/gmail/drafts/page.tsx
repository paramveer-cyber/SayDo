"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { useDrafts } from "../../../../hooks/gmail/useDrafts";
import type { GmailDraft } from "../../../../lib/api";
import {
  EmptyState,
  ErrorBanner,
  LoadingDots,
  ActionBtn,
  IconBtn,
  ComposeField,
} from "../../../../components/gmail/GmailUI";
import GmailPageHeader from "../../../../components/gmail/GmailPageHeader";

type EditState = {
  draftId: string;
  to: string;
  subject: string;
  body: string;
};

export default function DraftsPage() {
  const {
    drafts,
    loading,
    error,
    fetchDrafts,
    updateDraft,
    deleteDraft,
    sendDraft,
  } = useDrafts();

  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [actionError, setActionError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  useEffect(() => {
    if (loading || editing || !listRef.current) return;
    const rows = listRef.current.querySelectorAll(":scope > div");
    if (rows.length === 0) return;
    gsap.fromTo(
      rows,
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, ease: "power2.out", stagger: 0.03 },
    );
  }, [loading, drafts, editing]);

  const openEdit = (draft: GmailDraft) => {
    const msg = draft.data.message;
    setEditing({
      draftId: draft.data.id,
      to: msg.to ?? "",
      subject: msg.subject ?? "",
      body: msg.snippet ?? "",
    });
    setActionMsg("");
    setActionError("");
  };

  const closeEdit = () => {
    setEditing(null);
    setActionMsg("");
    setActionError("");
  };

  const handleSaveDraft = async () => {
    if (!editing) return;
    setSaving(true);
    setActionMsg("");
    setActionError("");
    try {
      await updateDraft(editing.draftId, {
        to: editing.to,
        subject: editing.subject,
        body: editing.body,
      });
      setActionMsg("Draft saved.");
    } catch {
      setActionError("Failed to save draft.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendDraft = async () => {
    if (!editing) return;
    setSending(true);
    setActionMsg("");
    setActionError("");
    try {
      await updateDraft(editing.draftId, {
        to: editing.to,
        subject: editing.subject,
        body: editing.body,
      });
      await sendDraft(editing.draftId);
      setActionMsg("Sent!");
      setTimeout(() => closeEdit(), 1200);
    } catch {
      setActionError("Failed to send draft.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDraft(id);
      if (editing?.draftId === id) closeEdit();
    } catch {
      setActionError("Failed to delete draft.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        minWidth: 0,
      }}
    >
      <GmailPageHeader
        title={editing ? "Edit Draft" : "Drafts"}
        onBack={editing ? closeEdit : undefined}
      />

      {(error || actionError) && <ErrorBanner message={error ?? actionError} />}

      {editing ? (
        <div
          style={{ flex: 1, overflowY: "auto", padding: "1.75rem 1.5rem" }}
          className="scrollbar-thin"
        >
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
            <ComposeField
              label="To *"
              value={editing.to}
              onChange={(v) => setEditing((e) => e && { ...e, to: v })}
              placeholder="recipient@example.com"
            />
            <ComposeField
              label="Subject *"
              value={editing.subject}
              onChange={(v) => setEditing((e) => e && { ...e, subject: v })}
              placeholder="Subject"
            />

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
                value={editing.body}
                onChange={(e) =>
                  setEditing(
                    (prev) => prev && { ...prev, body: e.target.value },
                  )
                }
                rows={12}
                placeholder="Write your message…"
                className="nb-input"
                style={{
                  resize: "vertical",
                  borderRadius: "var(--radius-md)",
                  lineHeight: 1.6,
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.6rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handleSendDraft}
                disabled={sending || saving}
                className="nb-btn-primary"
                style={{
                  opacity: sending || saving ? 0.6 : 1,
                  cursor: sending || saving ? "not-allowed" : "pointer",
                }}
              >
                {sending ? "Sending…" : "Send"}
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={saving || sending}
                className="nb-btn-secondary"
                style={{
                  opacity: saving || sending ? 0.6 : 1,
                  cursor: saving || sending ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving…" : "Save draft"}
              </button>
              <button
                onClick={closeEdit}
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
              {actionMsg && (
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: "var(--green)",
                  }}
                >
                  {actionMsg}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{ flex: 1, overflowY: "auto", padding: "0.4rem 0" }}
          className="scrollbar-thin"
        >
          {loading && <LoadingDots />}
          {!loading && drafts.length === 0 && <EmptyState label="No drafts" />}
          <div ref={listRef}>
            {!loading &&
              drafts.map((draft) => {
                const msg = draft.data.message;
                return (
                  <div
                    key={draft.id}
                    onClick={() => openEdit(draft)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.7rem 1.25rem",
                      margin: "0.3rem 0.75rem",
                      borderRadius: "var(--radius-lg)",
                      border: "1.5px solid transparent",
                      cursor: "pointer",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.background =
                        "var(--surface)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.background =
                        "transparent")
                    }
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          color: "var(--fg)",
                        }}
                      >
                        To: {msg.to || "—"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--fg-dim)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {msg.subject || "(no subject)"} — {msg.snippet}
                      </div>
                    </div>
                    <div
                      style={{ display: "flex", gap: "0.25rem" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ActionBtn
                        onClick={async () => {
                          try {
                            await sendDraft(draft.data.id);
                          } catch {
                            setActionError("Failed to send draft.");
                          }
                        }}
                        label="Send"
                        small
                      />
                      <IconBtn
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(draft.data.id);
                        }}
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
        </div>
      )}
    </div>
  );
}
