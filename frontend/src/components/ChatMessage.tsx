"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div
        className="msg-enter"
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "1.25rem",
        }}
      >
        <div
          style={{
            maxWidth: "72%",
            background: "var(--fg)",
            color: "var(--bg)",
            borderRadius: "16px 16px 4px 16px",
            padding: "0.65rem 1rem",
            fontSize: "0.9rem",
            lineHeight: 1.6,
            letterSpacing: "-0.01em",
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className="msg-enter"
      style={{
        display: "flex",
        gap: "0.75rem",
        marginBottom: "1.5rem",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background:
            "var(--accent-dim)",
          border: "1px solid rgba(45,122,79,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle
            cx="7"
            cy="7"
            r="5"
            stroke="var(--accent)"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="7" cy="7" r="2" fill="var(--accent)" />
        </svg>
      </div>
      <div
        style={{
          flex: 1,
          fontSize: "0.9rem",
          color: "var(--fg)",
          letterSpacing: "-0.01em",
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => (
              <p style={{ marginBottom: "0.6rem", lineHeight: 1.7 }}>
                {children}
              </p>
            ),
            strong: ({ children }) => (
              <strong style={{ fontWeight: 600 }}>{children}</strong>
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
              <li style={{ marginBottom: "0.3rem", lineHeight: 1.65 }}>
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
              <div style={{ overflowX: "auto", marginBottom: "0.6rem" }}>
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
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
