"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { useEffect, useRef } from "react";
import gsap from "gsap";

type SidebarVariant = "main" | "gmail" | "calendar";

const mainNavItems = [
  {
    id: "chat",
    label: "Chat",
    href: "/dashboard",
    color: "var(--green)",
    colorDim: "var(--green-dim)",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <path
          d="M14 10.667A1.333 1.333 0 0 1 12.667 12H4L1.333 14.667V3.333A1.333 1.333 0 0 1 2.667 2h10A1.333 1.333 0 0 1 14 3.333v7.334z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "gmail",
    label: "Gmail",
    href: "/dashboard/gmail",
    color: "var(--red)",
    colorDim: "var(--red-dim)",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <rect
          x="1.5"
          y="3.5"
          width="13"
          height="9"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M1.5 4.5L8 9L14.5 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "calendar",
    label: "Calendar",
    href: "/dashboard/calendar",
    color: "var(--blue)",
    colorDim: "var(--blue-dim)",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <rect
          x="1.5"
          y="2.5"
          width="13"
          height="12"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M5 1.5V3.5M11 1.5V3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path d="M1.5 6.5H14.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="4" y="9" width="2" height="2" rx="0.3" fill="currentColor" />
        <rect x="7" y="9" width="2" height="2" rx="0.3" fill="currentColor" />
        <rect x="10" y="9" width="2" height="2" rx="0.3" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profile",
    href: "/profile",
    color: "var(--yellow)",
    colorDim: "var(--yellow-dim)",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5.25" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M2.5 14c0-2.9 2.46-5.25 5.5-5.25S13.5 11.1 13.5 14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    href: "/dashboard/settings",
    color: "var(--border-strong)",
    colorDim: "var(--surface)",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <circle
          cx="8"
          cy="8"
          r="2.25"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M8 1.5v1.6M8 12.9v1.6M14.5 8h-1.6M3.1 8H1.5M12.36 3.64l-1.13 1.13M4.77 11.23l-1.13 1.13M12.36 12.36l-1.13-1.13M4.77 4.77 3.64 3.64"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const gmailNavItems = [
  { href: "/dashboard/gmail", label: "Home", exact: true },
  { href: "/dashboard/gmail/inbox", label: "Inbox" },
  { href: "/dashboard/gmail/important", label: "Important" },
  { href: "/dashboard/gmail/sent", label: "Sent" },
  { href: "/dashboard/gmail/drafts", label: "Drafts" },
  { href: "/dashboard/gmail/starred", label: "Starred" },
  { href: "/dashboard/gmail/all", label: "All Mail" },
  { href: "/dashboard/gmail/spam", label: "Spam" },
  { href: "/dashboard/gmail/trash", label: "Trash" },
  { href: "/dashboard/gmail/labels", label: "Labels" },
];

function isPathActive(
  pathname: string,
  href: string,
  exact?: boolean,
): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
      <div
        style={{
          width: 28,
          height: 28,
          flexShrink: 0,
          overflow: "hidden",
          clipPath: "polygon(0 0, 100% 0, 100% 72%, 72% 100%, 0 100%)",
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src="/icon.png"
          alt="Corsair"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <span
        style={{
          fontWeight: 900,
          fontSize: "0.78rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--fg)",
        }}
      >
        SayDo
      </span>
    </div>
  );
}

function ThemeToggler() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.45rem",
        padding: "0.45rem 0.75rem",
        border: "1px solid var(--border-strong)",
        background: "transparent",
        color: "var(--fg-dim)",
        fontSize: "0.62rem",
        fontFamily: "inherit",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontWeight: 700,
        cursor: "pointer",
        width: "100%",
        transition: "border-color 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--yellow)";
        e.currentTarget.style.color = "var(--yellow)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-strong)";
        e.currentTarget.style.color = "var(--fg-dim)";
      }}
    >
      {theme === "dark" ? (
        <>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <circle
              cx="8"
              cy="8"
              r="3.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Light mode
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path
              d="M13.5 10.5A6 6 0 0 1 5.5 2.5a6 6 0 1 0 8 8z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Dark mode
        </>
      )}
    </button>
  );
}

function SignOutBtn({ logout }: { logout: () => void }) {
  return (
    <button
      onClick={logout}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.45rem 0.75rem",
        border: "none",
        background: "transparent",
        color: "var(--fg-dim)",
        fontSize: "0.62rem",
        fontFamily: "inherit",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontWeight: 700,
        cursor: "pointer",
        width: "100%",
        transition: "color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--red)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--fg-dim)";
      }}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path
          d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M10.667 11.333 14 8l-3.333-3.333M14 8H6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Sign out
    </button>
  );
}

function NavButton({
  label,
  icon,
  isActive,
  activeColor,
  activeBg,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  isActive: boolean;
  activeColor: string;
  activeBg: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.55rem",
        padding: "0.5rem 0.75rem",
        border: "none",
        borderLeft: isActive
          ? `2px solid ${activeColor}`
          : "2px solid transparent",
        background: isActive ? activeBg : "transparent",
        color: isActive ? activeColor : "var(--fg-dim)",
        fontSize: "0.65rem",
        fontWeight: 700,
        fontFamily: "inherit",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
        transition: "background 0.12s, color 0.12s, border-color 0.12s",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "var(--surface)";
          e.currentTarget.style.color = "var(--fg)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--fg-dim)";
        }
      }}
    >
      {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
      {label}
    </button>
  );
}

export default function Sidebar({ variant }: { variant: SidebarVariant }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sidebarRef.current) return;
    gsap.fromTo(
      sidebarRef.current,
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.55, ease: "power4.out" },
    );
  }, []);

  return (
    <aside
      ref={sidebarRef}
      style={{
        width: 240,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        borderRight: "1px solid var(--border)",
        padding: "1.25rem 0",
        gap: 2,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle, var(--border-strong) 1px, transparent 1px)`,
          backgroundSize: "18px 18px",
          opacity: 0.12,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: 2,
        }}
      >
        <div style={{ padding: "0 1rem", marginBottom: "1.75rem" }}>
          <BrandLogo />
        </div>

        {variant === "main" && (
          <>
            <div
              style={{
                fontSize: "0.52rem",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--fg-dim)",
                padding: "0 1rem",
                marginBottom: "0.25rem",
                marginTop: "0.25rem",
              }}
            >
              Navigate
            </div>
            {mainNavItems.map((item) => {
              const isActive = isPathActive(
                pathname,
                item.href,
                item.href === "/dashboard",
              );
              return (
                <NavButton
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  isActive={isActive}
                  activeColor={item.color}
                  activeBg={item.colorDim}
                  onClick={() => router.push(item.href)}
                />
              );
            })}
          </>
        )}

        {variant === "gmail" && (
          <>
            <NavButton
              label="Back to App"
              icon={
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M10 13L5 8l5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
              isActive={false}
              activeColor="var(--fg)"
              activeBg="var(--surface)"
              onClick={() => router.push("/dashboard")}
            />

            <div
              style={{
                height: 1,
                background: "var(--border)",
                margin: "0.5rem 1rem",
              }}
            />

            <button
              onClick={() => router.push("/dashboard/gmail/compose")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.55rem 0.75rem",
                margin: "0 1rem",
                border: "1px solid var(--red)",
                background: "var(--red-dim)",
                color: "var(--red)",
                fontSize: "0.65rem",
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                transition: "background 0.12s, color 0.12s",
                clipPath:
                  "polygon(0 0, 100% 0, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--red)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--red-dim)";
                e.currentTarget.style.color = "var(--red)";
              }}
            >
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1v12M1 7h12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Compose
            </button>

            <div
              style={{
                fontSize: "0.52rem",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--fg-dim)",
                padding: "0 1rem",
                marginTop: "0.75rem",
                marginBottom: "0.25rem",
              }}
            >
              Mailbox
            </div>

            {gmailNavItems.map((item) => {
              const active = isPathActive(
                pathname,
                item.href,
                "exact" in item ? item.exact : false,
              );
              return (
                <NavButton
                  key={item.href}
                  label={item.label}
                  isActive={active}
                  activeColor="var(--red)"
                  activeBg="var(--red-dim)"
                  onClick={() => router.push(item.href)}
                />
              );
            })}
          </>
        )}

        {variant === "calendar" && (
          <>
            <NavButton
              label="Back to App"
              icon={
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M10 13L5 8l5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
              isActive={false}
              activeColor="var(--fg)"
              activeBg="var(--surface)"
              onClick={() => router.push("/dashboard")}
            />

            <div
              style={{
                height: 1,
                background: "var(--border)",
                margin: "0.5rem 1rem",
              }}
            />

            <div
              style={{
                fontSize: "0.52rem",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--fg-dim)",
                padding: "0 1rem",
                marginBottom: "0.25rem",
              }}
            >
              Calendar
            </div>

            {[
              {
                href: "/dashboard/calendar",
                label: "My Calendar",
                exact: true,
              },
              { href: "/dashboard/calendar/workflows", label: "AI Workflows" },
            ].map((item) => {
              const active = isPathActive(pathname, item.href, item.exact);
              return (
                <NavButton
                  key={item.href}
                  label={item.label}
                  isActive={active}
                  activeColor="var(--blue)"
                  activeBg="var(--blue-dim)"
                  onClick={() => router.push(item.href)}
                />
              );
            })}
          </>
        )}

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            padding: "0.75rem 1rem 0",
            borderTop: "1px solid var(--border)",
          }}
        >
          <ThemeToggler />
          <SignOutBtn logout={logout} />
        </div>
      </div>
    </aside>
  );
}
