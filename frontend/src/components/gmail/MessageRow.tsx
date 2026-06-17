"use client";

import { useRouter } from "next/navigation";
import { type GmailMessage } from "../../lib/api";
import { IconBtn, formatDate, LabelBadges } from "./GmailUI";

interface MessageRowProps {
  msg: GmailMessage;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onStar: (msg: GmailMessage) => void;
  onTrash?: (id: string) => void;
  onUntrash?: (id: string) => void;
  onDelete?: (id: string) => void;
  showTrashActions?: boolean;
  labelsById?: Map<string, { name: string; color?: { textColor: string; backgroundColor: string } }>;
}

function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      style={{
        flexShrink: 0,
        width: 18,
        height: 18,
        borderRadius: 5,
        border: `1.5px solid ${checked ? "var(--red)" : "var(--border-strong)"}`,
        background: checked ? "var(--red)" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.12s",
      }}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="#fff"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

export default function MessageRow({
  msg,
  isSelected,
  onSelect,
  onStar,
  onTrash,
  onUntrash,
  onDelete,
  showTrashActions = false,
  labelsById,
}: MessageRowProps) {
  const router = useRouter();
  const isUnread = msg.data.labelIds?.includes("UNREAD");
  const isStarred = msg.data.labelIds?.includes("STARRED");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.65rem 1rem",
        margin: "1px 0.5rem",
        borderRadius: 10,
        cursor: "pointer",
        border: `1px solid ${isSelected ? "var(--red)" : "transparent"}`,
        background: isSelected
          ? "var(--red-dim)"
          : isUnread
            ? "var(--surface)"
            : "transparent",
        transition: "background 0.12s, border-color 0.12s",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!isSelected)
          (e.currentTarget as HTMLDivElement).style.background =
            "var(--surface)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected)
          (e.currentTarget as HTMLDivElement).style.background = isUnread
            ? "var(--surface)"
            : "transparent";
      }}
    >
      {isUnread && !isSelected && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: 3,
            height: 20,
            background: "var(--red)",
            borderRadius: "0 2px 2px 0",
          }}
        />
      )}

      <Checkbox
        checked={isSelected}
        onChange={(v) => onSelect(msg.data.id, v)}
      />

      <button
        onClick={(e) => {
          e.stopPropagation();
          onStar(msg);
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 2,
          flexShrink: 0,
          opacity: isStarred ? 1 : 0.4,
          transition: "opacity 0.12s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.opacity = isStarred ? "1" : "0.4")
        }
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill={isStarred ? "var(--yellow)" : "none"}
        >
          <path
            d="M7 1L8.545 5.09H13L9.636 7.545L10.818 12L7 9.454L3.182 12L4.364 7.545L1 5.09H5.455L7 1Z"
            stroke={isStarred ? "var(--yellow)" : "var(--fg-dim)"}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        style={{ flex: 1, minWidth: 0 }}
        onClick={() => router.push(`/dashboard/gmail/message/${msg.data.id}`)}
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
              fontSize: "0.8rem",
              fontWeight: isUnread ? 700 : 500,
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
              fontSize: "0.67rem",
              color: "var(--fg-dim)",
              flexShrink: 0,
              fontWeight: isUnread ? 700 : 500,
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
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            marginTop: 2,
          }}
        >
          <div
            style={{
              fontSize: "0.77rem",
              fontWeight: isUnread ? 600 : 400,
              color: isUnread ? "var(--fg)" : "var(--fg-dim)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flexShrink: 0,
              maxWidth: "40%",
            }}
          >
            {msg.data.subject || "(no subject)"}
          </div>
          <span
            style={{
              color: "var(--border-strong)",
              fontSize: "0.7rem",
              flexShrink: 0,
            }}
          >
            —
          </span>
          <div
            style={{
              fontSize: "0.74rem",
              color: "var(--fg-dim)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              opacity: 0.8,
            }}
          >
            {msg.data.snippet}
          </div>
        </div>

        <LabelBadges
          labelIds={msg.data.labelIds}
          labelsById={labelsById ?? new Map()}
        />
      </div>

      <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
        {!showTrashActions && onTrash && (
          <IconBtn
            onClick={(e) => {
              e.stopPropagation();
              onTrash(msg.data.id);
            }}
            title="Trash"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
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
        {showTrashActions && (
          <>
            {onUntrash && (
              <IconBtn
                onClick={(e) => {
                  e.stopPropagation();
                  onUntrash(msg.data.id);
                }}
                title="Restore"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path
                    d="M9 5L6 2L3 5M6 2V10"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </IconBtn>
            )}
            {onDelete && (
              <IconBtn
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(msg.data.id);
                }}
                title="Delete forever"
                danger
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path
                    d="M2 2L11 11M11 2L2 11"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
              </IconBtn>
            )}
          </>
        )}
      </div>
    </div>
  );
}
