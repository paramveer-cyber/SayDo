"use client";

import { useRouter, usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/gmail", label: "Home", exact: true },
  { href: "/gmail/inbox", label: "Inbox" },
  { href: "/gmail/drafts", label: "Drafts" },
  { href: "/gmail/sent", label: "Sent" },
  { href: "/gmail/starred", label: "Starred" },
  { href: "/gmail/trash", label: "Trash" },
  { href: "/gmail/labels", label: "Labels" },
] as const;

export default function GmailNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <button
        onClick={() => router.push("/gmail/compose")}
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
          ((e.currentTarget as HTMLButtonElement).style.background = "var(--accent-dim)")
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

      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href, "exact" in item ? item.exact : false);
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.55rem",
              padding: "0.5rem 0.75rem",
              borderRadius: 8,
              border: "none",
              background: active ? "var(--accent-dim)" : "transparent",
              color: active ? "var(--accent)" : "var(--fg-dim)",
              fontSize: "0.825rem",
              fontWeight: active ? 600 : 400,
              cursor: "pointer",
              fontFamily: "inherit",
              width: "100%",
              textAlign: "left",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!active) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--surface)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--fg)";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--fg-dim)";
              }
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
