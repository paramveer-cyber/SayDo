"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Lenis from "lenis";

type PrivacySection = {
  marker: string;
  title: string;
  body: React.ReactNode;
  accentColor: string;
};

const privacySections: PrivacySection[] = [
  {
    marker: "01",
    title: "What We Collect (Spoiler: Not Much)",
    accentColor: "var(--blue)",
    body: (
      <>
        <p>
          When you sign in via Google OAuth, we receive your name, email
          address, and a Google account identifier. That's it. We store these so
          you have a persistent account that doesn't amnesia itself between
          sessions.
        </p>
        <p>
          We also store your connected plugin state — i.e., whether you've
          connected Gmail and Google Calendar — so we know which Google APIs to
          talk to on your behalf.
        </p>
      </>
    ),
  },
  {
    marker: "02",
    title: "Your Email & Calendar: Read, Not Kept",
    accentColor: "var(--green)",
    body: (
      <>
        <p>
          SayDo accesses your Gmail messages and Google Calendar events via
          Google's official APIs in real-time, on-demand, when you ask it to. We
          do <strong>not</strong> crawl your inbox in the background, index your
          entire email history, or store your messages on our servers.
        </p>
        <p>
          When you ask SayDo to summarize an email, it fetches that email,
          processes it, and returns the result. The email itself is not
          persisted anywhere outside of Google's own infrastructure.
        </p>
        <p>
          AI-generated digests and summaries produced by our scheduled workflows
          are stored temporarily to be delivered to you, and cleared after
          delivery. We don't build a corpus of your personal communications.
        </p>
      </>
    ),
  },
  {
    marker: "03",
    title: "We Will Never Sell Your Data",
    accentColor: "var(--yellow)",
    body: (
      <>
        <p>
          Your data is never sold, traded, rented, or disclosed to third parties
          for advertising or commercial purposes. Not now, not ever. We have no
          interest in your personal data beyond making SayDo work correctly for
          you.
        </p>
        <p>
          We don't use your email content to train AI models. We don't share
          your behavior with ad networks. We don't do any of the things that
          make you feel gross about using software in 2026. That behavior is
          exactly the frustration that led us to build this in the first place.
        </p>
      </>
    ),
  },
  {
    marker: "04",
    title: "Third-Party Services We Use",
    accentColor: "var(--red)",
    body: (
      <>
        <p>To function, SayDo uses the following external services:</p>
        <ul
          style={{
            paddingLeft: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <li>
            <strong>Google OAuth & APIs</strong> — for authentication and
            accessing Gmail/Calendar on your behalf
          </li>
          <li>
            <strong>Google Gemini AI</strong> — for processing natural language
            requests and generating responses
          </li>
          <li>
            <strong>Inngest</strong> — for running scheduled background jobs
            like digests
          </li>
        </ul>
        <p>
          Each of these services has their own privacy policies. We only send
          them the minimum data necessary for the feature you're using.
        </p>
      </>
    ),
  },
  {
    marker: "05",
    title: "Deleting Your Data",
    accentColor: "var(--blue)",
    body: (
      <>
        <p>
          You own everything you put in here. To delete your account and all
          associated data, go to your profile page and hit delete — it's
          immediate and permanent. No forms, no waiting period, no confirmation
          email loop.
        </p>
        <p>
          Revoking SayDo's access in your Google Account settings will
          immediately cut off our ability to access your Gmail and Calendar,
          regardless of your account status with us.
        </p>
      </>
    ),
  },
  {
    marker: "06",
    title: "Cookies & Local Storage",
    accentColor: "var(--green)",
    body: (
      <>
        <p>
          We use a session cookie and browser local storage to keep you logged
          in across page refreshes. We do not use tracking cookies. We do not
          drop third-party ad cookies. The only cookies here are the ones that
          make the app work.
        </p>
        <p>
          If you disable cookies entirely, the app won't function correctly —
          but that's a technical constraint, not a data grab.
        </p>
      </>
    ),
  },
  {
    marker: "07",
    title: "This Policy Will Evolve",
    accentColor: "var(--yellow)",
    body: (
      <>
        <p>
          As SayDo grows and adds features, this policy may be updated to
          reflect what we actually do. We'll always try to give you notice of
          material changes — but continued use of the platform constitutes
          acceptance of the current policy.
        </p>
        <p>
          The "last updated" date below tells you when this was last touched. If
          something here is unclear, reach out via the contact link in the
          footer.
        </p>
      </>
    ),
  },
];

function DotGrid() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        backgroundImage: `radial-gradient(circle, var(--border-strong) 1.3px, transparent 1.3px)`,
        backgroundSize: `24px 24px`,
        opacity: 0.4,
      }}
    />
  );
}

export default function PrivacyPage() {
  const router = useRouter();

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.075, smoothWheel: true });
    const onFrame = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(onFrame);
    };
    const rafId = requestAnimationFrame(onFrame);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div
      style={{
        background: "var(--bg)",
        color: "var(--fg)",
        minHeight: "100vh",
        position: "relative",
        fontFamily: "var(--font-geist-sans)",
      }}
    >
      <DotGrid />

      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 2.5rem",
          height: 56,
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          onClick={() => router.push("/")}
          style={{
            fontWeight: 900,
            fontSize: "0.82rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            background: "none",
            border: "none",
            color: "var(--fg)",
            cursor: "pointer",
            fontFamily: "inherit",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <img
            src="/icon.png"
            alt="Corsair"
            style={{ width: 28, height: 28, objectFit: "cover" }}
          />
          SayDo
        </button>
        <div style={{ display: "flex", gap: "2rem" }}>
          {[
            { label: "Terms", href: "/tos" },
            { label: "Pricing", href: "/pricing" },
          ].map((link) => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              style={{
                fontSize: "0.62rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--fg-dim)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--fg-dim)")
              }
            >
              {link.label}
            </button>
          ))}
        </div>
      </nav>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 860,
          margin: "0 auto",
          padding: "56px 2.5rem 6rem",
        }}
      >
        <div
          style={{
            borderBottom: "1px solid var(--border)",
            paddingTop: "4rem",
            paddingBottom: "3rem",
            marginBottom: "4rem",
          }}
        >
          <div
            style={{
              fontSize: "0.58rem",
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--fg-dim)",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div style={{ width: 4, height: 4, background: "var(--blue)" }} />
            Legal · Privacy Policy
          </div>
          <h1
            style={{
              fontFamily: "'Movement', sans-serif",
              fontSize: "clamp(3.5rem, 7vw, 6rem)",
              letterSpacing: "-0.03em",
              lineHeight: 0.9,
              margin: "0 0 1.5rem",
            }}
          >
            Privacy
            <br />
            <span style={{ color: "var(--blue)" }}>Policy.</span>
          </h1>
          <p
            style={{
              fontSize: "0.88rem",
              lineHeight: 1.7,
              color: "var(--fg-dim)",
              maxWidth: 520,
              margin: 0,
            }}
          >
            We respect your privacy. We built this because we were tired of
            products that didn't. Here's exactly what we do and don't do with
            your data. Last updated June 2026.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {privacySections.map((section) => (
            <div
              key={section.marker}
              style={{
                borderBottom: "1px solid var(--border)",
                padding: "3rem 0",
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: "2.5rem",
                alignItems: "start",
              }}
            >
              <div
                style={{
                  fontFamily: "'Movement', sans-serif",
                  fontSize: "2.8rem",
                  lineHeight: 1,
                  color: section.accentColor,
                  letterSpacing: "-0.04em",
                  paddingTop: "0.15rem",
                }}
              >
                {section.marker}
              </div>
              <div>
                <h2
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: "1.25rem",
                    color: "var(--fg)",
                  }}
                >
                  {section.title}
                </h2>
                <div
                  style={{
                    fontSize: "0.875rem",
                    lineHeight: 1.75,
                    color: "var(--fg-dim)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.875rem",
                  }}
                >
                  {section.body}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "4rem",
            paddingTop: "2rem",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: "0.58rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--fg-dim)",
              fontWeight: 600,
            }}
          >
            SayDo · Privacy Policy · Last updated June 2026
          </span>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <div style={{ width: 6, height: 6, background: "var(--blue)" }} />
            <div style={{ width: 6, height: 6, background: "var(--green)" }} />
            <div style={{ width: 6, height: 6, background: "var(--yellow)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
