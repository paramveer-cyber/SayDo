"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { type GmailMessage } from "../../lib/api";
import MessageRow from "./MessageRow";
import { ActionBtn, EmptyState, ErrorBanner } from "./GmailUI";
import CatLoader from "./CatLoader";

function SkeletonRow({ delay }: { delay: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.65rem 1rem",
        margin: "1px 0.5rem",
        borderRadius: 10,
        opacity: 0,
        animation: `skeletonFadeIn 0.3s ease forwards ${delay}s`,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          background: "var(--border)",
          flexShrink: 0,
        }}
      />
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "var(--border)",
          flexShrink: 0,
        }}
      />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div
            style={{
              height: 11,
              width: `${28 + (Math.floor(delay * 17) % 20)}%`,
              background: "var(--border)",
              borderRadius: 4,
            }}
          />
          <div
            style={{
              height: 10,
              width: 48,
              background: "var(--border)",
              borderRadius: 4,
              flexShrink: 0,
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div
            style={{
              height: 10,
              width: `${20 + (Math.floor(delay * 11) % 15)}%`,
              background: "var(--border)",
              borderRadius: 4,
            }}
          />
          <div
            style={{
              height: 10,
              width: `${30 + (Math.floor(delay * 13) % 20)}%`,
              background: "var(--surface)",
              borderRadius: 4,
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface MessageListProps {
  messages: GmailMessage[];
  loading: boolean;
  error: string | null;
  emptyLabel?: string;
  showTrashActions?: boolean;
  onStar: (msg: GmailMessage) => void;
  onTrash?: (id: string) => void;
  onUntrash?: (id: string) => void;
  onDelete?: (id: string) => void;
  onBatchTrash?: (ids: string[]) => void;
  onBatchMarkRead?: (ids: string[]) => void;
  onRefresh?: () => void;
  labelsById?: Map<
    string,
    { name: string; color?: { textColor: string; backgroundColor: string } }
  >;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
}

export default function MessageList({
  messages,
  loading,
  error,
  emptyLabel = "No messages",
  showTrashActions = false,
  onStar,
  onTrash,
  onUntrash,
  onDelete,
  onBatchTrash,
  onBatchMarkRead,
  onRefresh,
  labelsById,
  onLoadMore,
  loadingMore = false,
  hasMore = true,
}: MessageListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);

  const handleSelect = (id: string, checked: boolean) => {
    const s = new Set(selectedIds);
    if (checked) s.add(id);
    else s.delete(id);
    setSelectedIds(s);
  };

  const clearSelection = () => setSelectedIds(new Set());

  useEffect(() => {
    if (loading || !listRef.current) return;
    const rows = listRef.current.querySelectorAll(":scope > div");
    if (rows.length === 0) return;
    gsap.fromTo(
      rows,
      { y: 8, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3, ease: "power2.out", stagger: 0.02 },
    );
  }, [loading, messages]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        width: "100%",
        minWidth: 0,
      }}
    >
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes skeletonFadeIn {
          to { opacity: 1; }
        }
        .skeleton-shimmer > div {
          animation: skeletonPulse 1.4s ease-in-out infinite;
        }
      `}</style>

      <div
        style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {selectedIds.size > 0 && (
            <>
              {onBatchMarkRead && (
                <ActionBtn
                  onClick={async () => {
                    await onBatchMarkRead(Array.from(selectedIds));
                    clearSelection();
                  }}
                  label="Mark read"
                />
              )}
              {onBatchTrash && (
                <ActionBtn
                  onClick={async () => {
                    await onBatchTrash(Array.from(selectedIds));
                    clearSelection();
                  }}
                  label="Trash"
                  danger
                />
              )}
            </>
          )}
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            style={{
              background: "none",
              border: "1px solid var(--border-strong)",
              borderRadius: 8,
              cursor: "pointer",
              color: "var(--fg-dim)",
              padding: "0.4rem",
              display: "flex",
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--red)";
              e.currentTarget.style.color = "var(--red)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-strong)";
              e.currentTarget.style.color = "var(--fg-dim)";
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
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

      {error && <ErrorBanner message={error} />}

      <div
        ref={listRef}
        style={{ flex: 1, overflowY: "auto", padding: "0.4rem 0" }}
        className="scrollbar-thin"
      >
        {(loading || loadingMore) && <CatLoader />}
        {!loading && !loadingMore && messages.length === 0 && (
          <EmptyState label={emptyLabel} />
        )}
        {!loading &&
          !loadingMore &&
          messages.map((msg) => (
            <MessageRow
              key={msg.id}
              msg={msg}
              isSelected={selectedIds.has(msg.data.id)}
              onSelect={handleSelect}
              onStar={onStar}
              onTrash={onTrash}
              onUntrash={onUntrash}
              onDelete={onDelete}
              showTrashActions={showTrashActions}
              labelsById={labelsById}
            />
          ))}
        {!loading &&
          !loadingMore &&
          messages.length > 0 &&
          onLoadMore &&
          hasMore && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "0.75rem 0 0.5rem",
              }}
            >
              <ActionBtn
                onClick={onLoadMore}
                label={loadingMore ? "Loading…" : "Load more"}
                small
              />
            </div>
          )}
      </div>
    </div>
  );
}
