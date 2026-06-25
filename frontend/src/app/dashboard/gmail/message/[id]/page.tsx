"use client";

export const runtime = "edge";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import gsap from "gsap";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { gmailApi, type GmailMessage } from "../../../../../lib/api";
import {
  getBody,
  ErrorBanner,
  ActionBtn,
  SecureMailFrame,
} from "../../../../../components/gmail/GmailUI";
import GmailPageHeader from "../../../../../components/gmail/GmailPageHeader";

function MessageSkeleton() {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "1.75rem 1.5rem",
        maxWidth: 760,
      }}
      className="scrollbar-thin"
    >
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }
        .sk { animation: skeletonPulse 1.5s ease-in-out infinite; background: var(--border); border-radius: 6px; }
      `}</style>

      <div
        className="sk"
        style={{ height: 20, width: "60%", marginBottom: "1.25rem" }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}
        >
          <div className="sk" style={{ height: 12, width: "45%" }} />
          <div className="sk" style={{ height: 12, width: "38%" }} />
          <div className="sk" style={{ height: 12, width: "30%" }} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div
            className="sk"
            style={{ width: 34, height: 34, borderRadius: 8 }}
          />
          <div
            className="sk"
            style={{ width: 60, height: 34, borderRadius: 8 }}
          />
        </div>
      </div>

      <div
        style={{
          background: "var(--surface)",
          borderRadius: 12,
          padding: "1.4rem",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {[90, 100, 75, 100, 88, 60, 100, 45].map((w, i) => (
          <div
            key={i}
            className="sk"
            style={{
              height: 13,
              width: `${w}%`,
              animationDelay: `${i * 0.06}s`,
            }}
          />
        ))}
        <div style={{ height: 16 }} />
        {[100, 92, 80, 100, 55].map((w, i) => (
          <div
            key={i + 8}
            className="sk"
            style={{
              height: 13,
              width: `${w}%`,
              animationDelay: `${(i + 8) * 0.06}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function MessageDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [message, setMessage] = useState<GmailMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setMessage(null);
    setError(null);
    gmailApi
      .getMessage(id)
      .then(async (msg) => {
        if (!msg) {
          setError("Message not found");
          return;
        }
        setMessage(msg);
        if (msg.data.labelIds?.includes("UNREAD")) {
          await gmailApi
            .modifyMessage(msg.data.id, { removeLabelIds: ["UNREAD"] })
            .catch(() => {});
        }
      })
      .catch(() => setError("Failed to load message"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!message || !bodyRef.current) return;
    gsap.fromTo(
      bodyRef.current,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: "power3.out", delay: 0.05 },
    );
  }, [message]);

  const toggleStar = async () => {
    if (!message) return;
    const isStarred = message.data.labelIds?.includes("STARRED");
    const newLabelIds = isStarred
      ? (message.data.labelIds ?? []).filter((l) => l !== "STARRED")
      : [...(message.data.labelIds ?? []), "STARRED"];
    setMessage((prev) =>
      prev ? { ...prev, data: { ...prev.data, labelIds: newLabelIds } } : prev,
    );
    try {
      const updated = await gmailApi.modifyMessage(
        message.data.id,
        isStarred
          ? { removeLabelIds: ["STARRED"] }
          : { addLabelIds: ["STARRED"] },
      );
      if (updated?.data?.labelIds) {
        setMessage((prev) =>
          prev
            ? {
                ...prev,
                data: { ...prev.data, labelIds: updated.data.labelIds },
              }
            : prev,
        );
      }
    } catch {
      setMessage((prev) =>
        prev
          ? { ...prev, data: { ...prev.data, labelIds: message.data.labelIds } }
          : prev,
      );
    }
  };

  const trash = async () => {
    if (!message) return;
    await gmailApi.trashMessage(message.data.id);
    router.back();
  };

  const isStarred = message?.data.labelIds?.includes("STARRED");

  const dateStr = (() => {
    if (!message) return "";
    const ts = message.data.internalDate;
    const d = ts
      ? new Date(Number(ts))
      : new Date(message.data.createdAt ?? "");
    return d.toLocaleString();
  })();

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
        title={message?.data.subject || (loading ? "" : "(no subject)")}
        onBack={() => router.back()}
      />

      {error && <ErrorBanner message={error} />}

      {loading && <MessageSkeleton />}

      {!loading &&
        !error &&
        message &&
        (() => {
          const { content: body, isHtml } = getBody(message.data);
          return (
            <div
              ref={bodyRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1.75rem 1.5rem",
                maxWidth: 760,
              }}
              className="scrollbar-thin"
            >
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                  marginBottom: "1rem",
                  lineHeight: 1.3,
                }}
              >
                {message.data.subject || "(no subject)"}
              </h2>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "1.25rem",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--fg-dim)",
                    lineHeight: 1.7,
                    minWidth: 0,
                  }}
                >
                  <div>
                    <strong style={{ color: "var(--fg)" }}>From:</strong>{" "}
                    {message.data.from}
                  </div>
                  <div>
                    <strong style={{ color: "var(--fg)" }}>To:</strong>{" "}
                    {message.data.to}
                  </div>
                  <div>
                    <strong style={{ color: "var(--fg)" }}>Date:</strong>{" "}
                    {dateStr}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <button
                    onClick={toggleStar}
                    style={{
                      background: "none",
                      border: "1px solid var(--border-strong)",
                      borderRadius: 8,
                      width: 34,
                      height: 34,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "border-color 0.12s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = "var(--yellow)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor =
                        "var(--border-strong)")
                    }
                  >
                    <svg
                      width="15"
                      height="15"
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
                  <ActionBtn onClick={trash} label="Trash" danger />
                </div>
              </div>

              <div
                style={{
                  background: "var(--surface)",
                  borderRadius: 12,
                  padding: "1.5rem",
                  border: "1px solid var(--border)",
                }}
              >
                {isHtml ? (
                  <SecureMailFrame htmlContent={body} />
                ) : (
                  <div
                    className="prose-response"
                    style={{
                      fontSize: "0.875rem",
                      lineHeight: 1.75,
                      color: "var(--fg)",
                    }}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: "var(--red)",
                              textDecoration: "underline",
                              textUnderlineOffset: 3,
                            }}
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {body || "(empty)"}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
    </div>
  );
}
