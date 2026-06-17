"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import RazorpayCheckoutButton from "../../components/RazorpayCheckoutButton";

type PricingFeature = {
  label: string;
  included: boolean;
};

type PaidRole = "bronze_subscriber" | "silver_subscriber" | "gold_subscriber";

type PricingTier = {
  name: string;
  price: string;
  amountInPaise: number | null;
  period: string;
  tagline: string;
  accentColor: string;
  features: PricingFeature[];
  ctaLabel: string;
  ctaHref?: string;
  targetRole?: PaidRole;
  inverted?: boolean;
  clipStyle?: string;
};

const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    price: "₹0",
    amountInPaise: null,
    period: "forever",
    tagline: "Kick the tires. No credit card, no tricks.",
    accentColor: "var(--border-strong)",
    ctaLabel: "Get started",
    ctaHref: "/auth",
    clipStyle: "polygon(0 20px, 20px 0, 100% 0, 100% 100%, 0 100%)",
    features: [
      { label: "Gmail access", included: true },
      { label: "Google Calendar access", included: true },
      { label: "5 AI prompts / day", included: true },
      { label: "Inbox triage", included: true },
      { label: "Draft replies", included: true },
      { label: "Weekly digest", included: false },
      { label: "Daily digest", included: false },
      { label: "Unsubscribe suggestions", included: false },
      { label: "Calendar workflows", included: false },
      { label: "BYO Gemini API key", included: true },
    ],
  },
  {
    name: "Bronze",
    price: "₹399",
    amountInPaise: 39900,
    period: "per month",
    tagline: "For the person whose inbox is their second full-time job.",
    accentColor: "#cd7f32",
    ctaLabel: "Get Bronze",
    targetRole: "bronze_subscriber",
    clipStyle: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)",
    features: [
      { label: "Gmail access", included: true },
      { label: "Google Calendar access", included: true },
      { label: "25 AI prompts / day", included: true },
      { label: "Inbox triage", included: true },
      { label: "Draft replies", included: true },
      { label: "Weekly digest", included: true },
      { label: "Daily digest", included: false },
      { label: "Unsubscribe suggestions", included: false },
      { label: "Calendar workflows", included: false },
      { label: "BYO Gemini API key", included: true },
    ],
  },
  {
    name: "Silver",
    price: "₹999",
    amountInPaise: 99900,
    period: "per month",
    tagline: "You're serious about this. So are we.",
    accentColor: "#b0b8c1",
    ctaLabel: "Get Silver",
    targetRole: "silver_subscriber",
    inverted: true,
    features: [
      { label: "Gmail access", included: true },
      { label: "Google Calendar access", included: true },
      { label: "100 AI prompts / day", included: true },
      { label: "Inbox triage", included: true },
      { label: "Draft replies", included: true },
      { label: "Weekly digest", included: true },
      { label: "Daily digest", included: true },
      { label: "Unsubscribe suggestions", included: true },
      { label: "Calendar workflows", included: true },
      { label: "BYO Gemini API key", included: true },
    ],
  },
  {
    name: "Gold",
    price: "₹1,999",
    amountInPaise: 199900,
    period: "per month",
    tagline: "Everything, plus bring your own Gemini key.",
    accentColor: "var(--yellow)",
    ctaLabel: "Get Gold",
    targetRole: "gold_subscriber",
    clipStyle: "polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px)",
    features: [
      { label: "Gmail access", included: true },
      { label: "Google Calendar access", included: true },
      { label: "500 AI prompts / day", included: true },
      { label: "Inbox triage", included: true },
      { label: "Draft replies", included: true },
      { label: "Weekly digest", included: true },
      { label: "Daily digest", included: true },
      { label: "Unsubscribe suggestions", included: true },
      { label: "Calendar workflows", included: true },
      { label: "BYO Gemini API key", included: true },
    ],
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

function CheckMark({ color }: { color: string }) {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
      <polyline
        points="1,5 4.5,8.5 11,1"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossMark() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <line x1="1" y1="1" x2="9" y2="9" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="1" x2="1" y2="9" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const roleDisplayName: Record<string, string> = {
  bronze_subscriber: "Bronze",
  silver_subscriber: "Silver",
  gold_subscriber: "Gold",
};

export default function PricingPage() {
  const router = useRouter();
  const auth = useAuth();

  const currentRole = auth.status === "authenticated" ? auth.user.role : null;
  const isAuthenticated = auth.status === "authenticated";

  async function handlePaymentSuccess(newRole: string) {
    if (auth.status === "authenticated") {
      await auth.refreshUser();
    }
    router.push("/dashboard");
  }

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
            { label: "Terms", href: "/tos" },
            { label: "Privacy", href: "/privacy" },
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
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-dim)")}
            >
              {link.label}
            </button>
          ))}
        </div>
      </nav>

      <div style={{ position: "relative", zIndex: 1, paddingTop: 56 }}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "4rem 2.5rem 2rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: "1.5rem",
            }}
          >
            <h1
              style={{
                fontFamily: "'Movement', sans-serif",
                fontSize: "clamp(3rem, 6vw, 5.5rem)",
                letterSpacing: "-0.03em",
                lineHeight: 0.9,
                margin: 0,
              }}
            >
              Simple
              <br />
              <span style={{ color: "var(--yellow)" }}>pricing.</span>
            </h1>
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--fg-dim)",
                alignSelf: "flex-end",
              }}
            >
              Four tiers · No surprises
            </span>
          </div>
          <p
            style={{
              fontSize: "0.88rem",
              lineHeight: 1.7,
              color: "var(--fg-dim)",
              maxWidth: 520,
              margin: 0,
            }}
          >
            Start free. Upgrade when the limits start hurting. We run on the free tier of everything,
            so prompt limits are real — but if you bring your own Gemini API key, those limits don't apply.
          </p>
        </div>

        {isAuthenticated && currentRole && currentRole !== "user" && (
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              padding: "1.5rem 2.5rem 0",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                background: "var(--green-dim)",
                border: "1px solid var(--green)",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--green)",
              }}
            >
              <span>✓</span>
              <span>Active plan: {roleDisplayName[currentRole] ?? currentRole}</span>
            </div>
          </div>
        )}

        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "3rem 2.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1.25rem",
            alignItems: "start",
          }}
        >
          {pricingTiers.map((tier) => {
            const cardBackground = tier.inverted ? "var(--fg)" : "var(--surface)";
            const cardFg = tier.inverted ? "var(--bg)" : "var(--fg)";
            const cardFgDim = tier.inverted ? "rgba(15,15,15,0.55)" : "var(--fg-dim)";
            const isCurrentPlan = currentRole === tier.targetRole;
            const isFreeAndOnFree = tier.amountInPaise === null && currentRole === "user";

            return (
              <div
                key={tier.name}
                style={{
                  background: cardBackground,
                  border: tier.inverted
                    ? "none"
                    : isCurrentPlan || isFreeAndOnFree
                    ? `1px solid ${tier.accentColor === "var(--border-strong)" ? "var(--border-strong)" : tier.accentColor}`
                    : "1px solid var(--border)",
                  padding: "2rem 1.75rem 1.75rem",
                  display: "flex",
                  flexDirection: "column",
                  clipPath: tier.clipStyle ?? undefined,
                  position: "relative",
                }}
              >
                {(isCurrentPlan || isFreeAndOnFree) && (
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      fontSize: "0.5rem",
                      fontWeight: 800,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: tier.inverted ? "var(--bg)" : tier.accentColor === "var(--border-strong)" ? "var(--fg-dim)" : tier.accentColor,
                      background: tier.inverted ? "rgba(15,15,15,0.1)" : "var(--bg)",
                      padding: "2px 6px",
                      border: `1px solid ${tier.accentColor === "var(--border-strong)" ? "var(--border)" : tier.accentColor}`,
                    }}
                  >
                    Current
                  </div>
                )}

                <div
                  style={{
                    fontSize: "0.58rem",
                    fontWeight: 800,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: tier.accentColor,
                    marginBottom: "0.75rem",
                  }}
                >
                  {tier.name}
                </div>

                <div
                  style={{
                    fontFamily: "'Movement', sans-serif",
                    fontSize: "3.5rem",
                    lineHeight: 0.9,
                    letterSpacing: "-0.04em",
                    color: cardFg,
                    marginBottom: "0.25rem",
                  }}
                >
                  {tier.price}
                </div>
                <div
                  style={{
                    fontSize: "0.58rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: cardFgDim,
                    marginBottom: "1.25rem",
                  }}
                >
                  {tier.period}
                </div>

                <div
                  style={{
                    height: 1,
                    background: tier.inverted ? "rgba(15,15,15,0.15)" : "var(--border)",
                    marginBottom: "1.25rem",
                  }}
                />

                <p
                  style={{
                    fontSize: "0.75rem",
                    lineHeight: 1.6,
                    color: cardFgDim,
                    margin: "0 0 1.5rem",
                    fontStyle: "italic",
                  }}
                >
                  {tier.tagline}
                </p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                    marginBottom: "2rem",
                    flex: 1,
                  }}
                >
                  {tier.features.map((feature) => (
                    <div
                      key={feature.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.65rem",
                        fontSize: "0.72rem",
                        fontWeight: feature.included ? 600 : 400,
                        color: feature.included ? cardFg : cardFgDim,
                        opacity: feature.included ? 1 : 0.45,
                      }}
                    >
                      <div style={{ flexShrink: 0, width: 12 }}>
                        {feature.included ? (
                          <CheckMark
                            color={
                              tier.inverted
                                ? "var(--bg)"
                                : tier.accentColor === "var(--border-strong)"
                                ? "var(--fg)"
                                : tier.accentColor
                            }
                          />
                        ) : (
                          <CrossMark />
                        )}
                      </div>
                      {feature.label}
                    </div>
                  ))}
                </div>

                {tier.amountInPaise === null ? (
                  <button
                    onClick={() => router.push(tier.ctaHref!)}
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      padding: "0.8rem 1.5rem",
                      background: "transparent",
                      color: cardFg,
                      border: `1px solid ${tier.accentColor === "var(--border-strong)" ? "var(--border-strong)" : tier.accentColor}`,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      width: "100%",
                      transition: "opacity 0.15s",
                      clipPath: "polygon(0 0, 100% 0, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    {tier.ctaLabel}
                  </button>
                ) : isAuthenticated ? (
                  isCurrentPlan ? (
                    <div
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        padding: "0.8rem 1.5rem",
                        background: "var(--green-dim)",
                        color: "var(--green)",
                        border: "1px solid var(--green)",
                        textAlign: "center",
                        clipPath: "polygon(0 0, 100% 0, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                      }}
                    >
                      ✓ Current plan
                    </div>
                  ) : (
                    <RazorpayCheckoutButton
                      amountInPaise={tier.amountInPaise}
                      label={tier.ctaLabel}
                      productName={`SayDo ${tier.name}`}
                      productDescription={tier.tagline}
                      targetRole={tier.targetRole!}
                      inverted={tier.inverted}
                      accentColor={tier.accentColor}
                      onSuccess={handlePaymentSuccess}
                    />
                  )
                ) : (
                  <button
                    onClick={() => router.push("/auth?redirect=/pricing")}
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      padding: "0.8rem 1.5rem",
                      background: tier.inverted ? "var(--bg)" : "transparent",
                      color: tier.inverted ? "var(--fg)" : cardFg,
                      border: tier.inverted
                        ? "none"
                        : `1px solid ${tier.accentColor === "var(--border-strong)" ? "var(--border-strong)" : tier.accentColor}`,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      width: "100%",
                      transition: "opacity 0.15s",
                      clipPath: "polygon(0 0, 100% 0, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    Sign in to upgrade
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2.5rem" }}>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              padding: "2rem 2.5rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "1rem",
            }}
          >
            <div
              style={{
                width: 4,
                height: 4,
                background: "var(--yellow)",
                flexShrink: 0,
                marginTop: "0.35rem",
              }}
            />
            <p
              style={{
                fontSize: "0.72rem",
                lineHeight: 1.7,
                color: "var(--fg-dim)",
                margin: 0,
              }}
            >
              You can add your own Gemini API key in settings. When active, your key is used directly
              for all AI requests — prompt limits don't apply. You're billed by Google at their standard
              rates; we don't touch that.
            </p>
          </div>

          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              padding: "2.5rem 3rem",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "3rem",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.58rem",
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--green)",
                  marginBottom: "0.75rem",
                }}
              >
                Need more?
              </div>
              <h2
                style={{
                  fontFamily: "'Movement', sans-serif",
                  fontSize: "2rem",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  margin: "0 0 0.875rem",
                }}
              >
                Want more?
              </h2>
              <p
                style={{
                  fontSize: "0.82rem",
                  lineHeight: 1.7,
                  color: "var(--fg-dim)",
                  margin: 0,
                  maxWidth: 480,
                }}
              >
                Higher limits, custom workflows, or something that doesn't fit a tier — reach out.
                No sales deck, just a conversation.
              </p>
            </div>
            <a
              href="mailto:hello@saydo.app"
              style={{
                fontSize: "0.7rem",
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "0.9rem 2.25rem",
                background: "var(--fg)",
                color: "var(--bg)",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                clipPath: "polygon(0 0, 100% 0, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Contact us
            </a>
          </div>

          <div style={{ padding: "1.5rem 0 6rem", borderTop: "1px solid var(--border)" }}>
            <p
              style={{
                fontSize: "0.65rem",
                lineHeight: 1.65,
                color: "var(--fg-dim)",
                margin: 0,
                maxWidth: 680,
              }}
            >
              Plans give you access to features, not a guarantee of uptime. We run lean and do our best — see the{" "}
              <a href="/tos" style={{ color: "var(--fg-dim)", textDecoration: "underline" }}>
                terms
              </a>{" "}
              for the full picture.
            </p>
          </div>
        </div>

        <footer
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.5rem 2.5rem",
            borderTop: "1px solid var(--border)",
          }}
        >
          <span
            style={{
              fontWeight: 900,
              fontSize: "0.82rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            SayDo
          </span>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {[
              { label: "Terms", href: "/tos" },
              { label: "Privacy", href: "/privacy" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  fontSize: "0.58rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--fg-dim)",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <div style={{ width: 6, height: 6, background: "var(--red)" }} />
            <div style={{ width: 6, height: 6, background: "var(--yellow)" }} />
            <div style={{ width: 6, height: 6, background: "var(--blue)" }} />
          </div>
        </footer>
      </div>
    </div>
  );
}
