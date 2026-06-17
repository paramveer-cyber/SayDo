"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useLabels } from "../../../../hooks/gmail/useLabels";
import { EmptyState, ErrorBanner, LoadingDots, ActionBtn, IconBtn } from "../../../../components/gmail/GmailUI";
import GmailPageHeader from "../../../../components/gmail/GmailPageHeader";

export default function LabelsPage() {
  const router = useRouter();
  const { labels, loading, error, fetchLabels, createLabel, deleteLabel } = useLabels();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchLabels(); }, [fetchLabels]);

  useEffect(() => {
    if (loading || !listRef.current) return;
    const rows = listRef.current.querySelectorAll(":scope > div");
    if (rows.length === 0) return;
    gsap.fromTo(
      rows,
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, ease: "power2.out", stagger: 0.04 },
    );
  }, [loading, labels]);

  const handleCreate = async () => {
    const name = prompt("Label name:");
    if (!name) return;
    try { await createLabel(name); } catch { alert("Create label failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this label?")) return;
    try { await deleteLabel(id); } catch { alert("Delete label failed"); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", minWidth: 0 }}>
      <GmailPageHeader title="Labels" />

      {error && <ErrorBanner message={error} />}

      <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }} className="scrollbar-thin">
        {loading && <LoadingDots />}

        {!loading && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.1rem" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--fg-dim)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {labels.length} label{labels.length !== 1 ? "s" : ""}
              </span>
              <ActionBtn onClick={handleCreate} label="New label" />
            </div>

            {labels.length === 0 && <EmptyState label="No labels" />}

            <div ref={listRef} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {labels.filter((label) => label.data != null).map((label) => (
                <div
                  key={label.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.7rem 1rem",
                    borderRadius: "var(--radius-lg)",
                    border: "1.5px solid var(--border-strong)",
                    background: "var(--surface)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "var(--radius-sm)",
                        background: label.data.color?.backgroundColor ?? "var(--red)",
                      }}
                    />
                    <button
                      onClick={() => router.push(`/dashboard/gmail/labels/${label.data.id}`)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: "var(--fg)",
                        fontFamily: "inherit",
                      }}
                    >
                      {label.data.name}
                    </button>
                    {label.data.messagesUnread ? (
                      <span style={{
                        fontSize: "0.68rem",
                        padding: "1px 7px",
                        borderRadius: "var(--radius-md)",
                        background: "var(--red-dim)",
                        color: "var(--red)",
                        fontWeight: 700,
                      }}>
                        {label.data.messagesUnread}
                      </span>
                    ) : null}
                  </div>
                  {label.data.type !== "system" && (
                    <IconBtn onClick={() => handleDelete(label.data.id)} title="Delete label" danger>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2 2L11 11M11 2L2 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    </IconBtn>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
