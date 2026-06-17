"use client";

import { useRouter } from "next/navigation";

type TosSection = {
  marker: string;
  title: string;
  body: React.ReactNode;
  accentColor: string;
};

const tosSections: TosSection[] = [
  {
    marker: "01",
    title: "The Basics (Or: Please Don't Sue Us)",
    accentColor: "var(--red)",
    body: (
      <>
        <p>
          Welcome to SayDo. This is a real product built out of genuine
          frustration with existing tools. By continuing to exist on this
          website, you agree to the following terms. Congrats — you've already
          agreed just by reading this sentence.
        </p>
        <p>
          This platform is provided strictly <strong>"AS IS"</strong> and{" "}
          <strong>"AS AVAILABLE"</strong> — which is a fancy way of saying we
          make no promises about uptime, continuity, or whether your inbox will
          look right on a Tuesday. To the maximum extent permitted by law, you
          expressly agree that Paramveer and any contributors shall not be held
          liable for any direct, indirect, incidental, consequential, or special
          damages — including but not limited to: data loss, server crashes,
          service interruptions, existential dread, or the discovery that your
          inbox is actually worse than you thought.
        </p>
      </>
    ),
  },
  {
    marker: "02",
    title: "Paid Plans Are Not a Guarantee of Anything",
    accentColor: "var(--yellow)",
    body: (
      <>
        <p>
          If you purchase a Bronze, Silver, or Gold plan — thank you, sincerely.
          Your money goes toward keeping the servers alive and Paramveer
          caffeinated.
        </p>
        <p>
          However, purchasing a plan <strong>does not guarantee</strong> that
          SayDo will continue operating for the duration of your plan period. It
          does not guarantee any specific feature will exist tomorrow. It does
          not guarantee the AI will respond with something useful. Life is
          uncertain. Software is more uncertain. We will make every reasonable
          effort to honor your subscription, but if the service goes down, gets
          rebuilt, or we pivot to selling handmade sourdough — your plan does
          not entitle you to compensation or a refund beyond what's legally
          required in your jurisdiction.
        </p>
        <p>
          In plain English: buy a plan because you believe in what we're
          building, not because you think you're purchasing a contract with the
          universe.
        </p>
      </>
    ),
  },
  {
    marker: "03",
    title: "What We Actually Store",
    accentColor: "var(--blue)",
    body: (
      <>
        <p>
          We use Google OAuth to authenticate you and create your session. We
          store your name, email, and a reference to your Google account so the
          application doesn't forget who you are every time you refresh the
          page.
        </p>
        <p>
          Your email content and calendar events are accessed in real-time
          through the Google API. We do not permanently store your Gmail
          messages or calendar events on our servers — they live in Google's
          infrastructure where they belong.
        </p>
        <p>
          Your data is never sold. Never. Not to advertisers, not to data
          brokers, not to that guy who keeps DMing on LinkedIn. We have
          absolutely zero interest in your personal correspondence beyond making
          SayDo actually work for you.
        </p>
      </>
    ),
  },
  {
    marker: "04",
    title: "You Own Your Data",
    accentColor: "var(--green)",
    body: (
      <>
        <p>
          Anything you input into SayDo is yours. If you want it deleted, email
          us (address in the footer) and we'll handle it promptly. We won't
          make you fill out a 12-step form to exercise a right you already have.
        </p>
        <p>
          That said — don't sue us if a server crashes and something disappears.
          We recommend keeping backups of anything mission-critical. SayDo is
          your co-pilot, not your single point of failure.
        </p>
      </>
    ),
  },
  {
    marker: "05",
    title: "Copyright & What You Put In Here",
    accentColor: "var(--red)",
    body: (
      <>
        <p>
          SayDo is built to help you manage your Gmail and Google Calendar. Do
          not use it to store, distribute, or upload copyrighted material you
          have no right to use. If you believe any content on this platform
          infringes your copyright, reach out and we'll handle it promptly.
        </p>
        <p>
          Since this is a private dashboard, you are solely responsible for the
          data you bring in. We're just the vessel. A very efficient,
          AI-powered vessel.
        </p>
      </>
    ),
  },
  {
    marker: "06",
    title: "Age Restriction",
    accentColor: "var(--yellow)",
    body: (
      <>
        <p>
          SayDo is not intended for children under 13. By authenticating via
          Google OAuth and using this service, you confirm you are at least 13
          years old. If you are under 13, please go outside and touch some
          grass — the inbox will still be there when you're older, and it'll be
          worse.
        </p>
      </>
    ),
  },
  {
    marker: "07",
    title: "These Terms Will Change",
    accentColor: "var(--blue)",
    body: (
      <>
        <p>
          We reserve the right to modify, update, or completely rewrite these
          terms at any time without prior notice. Continued use of SayDo after
          changes means you've accepted them. Since this is an actively
          developed product, we probably won't send a newsletter when we fix a
          typo in paragraph four — but we might if something important changes.
        </p>
        <p>
          The "last updated" date at the bottom of this page is your friend.
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

export default function TermsPage() {
  const router = useRouter();

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
          }}
        >
          SayDo
        </button>
        <div style={{ display: "flex", gap: "2rem" }}>
          {[
            { label: "Privacy", href: "/privacy" },
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
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--fg)")
              }
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
          paddingTop: 56,
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
            <div
              style={{
                width: 4,
                height: 4,
                background: "var(--red)",
              }}
            />
            Legal · Terms of Service
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
            Terms of
            <br />
            <span style={{ color: "var(--red)" }}>Service.</span>
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
            The legally necessary document we're required to have, written like
            actual humans wrote it. Read it — or at least skim it. Last updated
            June 2025.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {tosSections.map((section, index) => (
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
            SayDo · Terms of Service · Last updated June 2025
          </span>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <div style={{ width: 6, height: 6, background: "var(--red)" }} />
            <div
              style={{ width: 6, height: 6, background: "var(--yellow)" }}
            />
            <div style={{ width: 6, height: 6, background: "var(--blue)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
