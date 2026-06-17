export default function NbBackdrop({
  variant = "default",
}: {
  variant?: "default" | "auth" | "sidebar";
}) {
  if (variant === "sidebar") {
    return (
      <div className="nb-geo-bg">
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          style={{
            position: "absolute",
            bottom: -30,
            left: -30,
            opacity: 0.18,
          }}
        >
          <circle
            cx="40"
            cy="80"
            r="30"
            fill="none"
            stroke="var(--green)"
            strokeWidth="2"
          />
          <rect
            x="60"
            y="50"
            width="34"
            height="34"
            fill="none"
            stroke="var(--yellow)"
            strokeWidth="2"
            transform="rotate(-12 77 67)"
          />
        </svg>
      </div>
    );
  }

  if (variant === "auth") {
    return (
      <div className="nb-page-bg">
        <svg
          width="220"
          height="220"
          viewBox="0 0 220 220"
          style={{ position: "absolute", top: -60, left: -60, opacity: 0.5 }}
        >
          <rect
            x="20"
            y="20"
            width="120"
            height="120"
            stroke="var(--blue)"
            strokeWidth="3"
            fill="none"
            transform="rotate(12 80 80)"
          />
          <circle
            cx="170"
            cy="60"
            r="40"
            fill="var(--yellow-dim)"
            stroke="var(--yellow)"
            strokeWidth="2"
          />
          <path
            d="M0 200 Q 60 150, 120 200 T 220 190"
            stroke="var(--red)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <svg
          width="260"
          height="260"
          viewBox="0 0 260 260"
          style={{
            position: "absolute",
            bottom: -80,
            right: -80,
            opacity: 0.45,
          }}
        >
          <path
            d="M30 230 L130 30 L230 230 Z"
            stroke="var(--red)"
            strokeWidth="3"
            fill="none"
            transform="rotate(-6 130 130)"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="var(--green)"
            strokeWidth="2"
            strokeDasharray="4 8"
          />
          <rect
            x="160"
            y="160"
            width="60"
            height="60"
            fill="var(--blue-dim)"
            stroke="var(--blue)"
            strokeWidth="2"
            transform="rotate(20 190 190)"
          />
        </svg>
        <svg
          width="180"
          height="180"
          viewBox="0 0 180 180"
          style={{ position: "absolute", top: "30%", right: 40, opacity: 0.3 }}
        >
          <circle cx="20" cy="20" r="5" fill="var(--yellow)" />
          <circle cx="50" cy="40" r="3" fill="var(--red)" />
          <circle cx="80" cy="15" r="4" fill="var(--blue)" />
          <circle cx="40" cy="80" r="3" fill="var(--green)" />
          <circle cx="100" cy="60" r="5" fill="var(--yellow)" />
          <circle cx="20" cy="110" r="3" fill="var(--blue)" />
          <path
            d="M10 150 Q 40 130, 70 150 T 130 145"
            stroke="var(--green)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="nb-page-bg">
      <svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
        style={{ position: "absolute", top: 60, right: 80, opacity: 0.12 }}
      >
        <rect
          x="10"
          y="10"
          width="100"
          height="100"
          stroke="var(--blue)"
          strokeWidth="2.5"
          fill="none"
          transform="rotate(-10 60 60)"
        />
      </svg>

      <svg
        width="130"
        height="130"
        viewBox="0 0 130 130"
        style={{ position: "absolute", top: "52%", right: "10%", opacity: 0.1 }}
      >
        <circle
          cx="65"
          cy="65"
          r="55"
          fill="none"
          stroke="var(--green)"
          strokeWidth="2.5"
        />
      </svg>

      <svg
        width="150"
        height="150"
        viewBox="0 0 150 150"
        style={{ position: "absolute", bottom: 70, left: 70, opacity: 0.12 }}
      >
        <path
          d="M10 130 L75 15 L140 130 Z"
          stroke="var(--red)"
          strokeWidth="2.5"
          fill="none"
          transform="rotate(5 75 75)"
        />
      </svg>

      <svg
        width="110"
        height="110"
        viewBox="0 0 110 110"
        style={{ position: "absolute", top: "14%", left: "32%", opacity: 0.1 }}
      >
        <rect
          x="5"
          y="5"
          width="100"
          height="100"
          fill="none"
          stroke="var(--yellow)"
          strokeWidth="2.5"
          strokeDasharray="8 10"
          transform="rotate(18 55 55)"
        />
      </svg>

      <svg
        width="100"
        height="100"
        viewBox="0 0 100 100"
        style={{
          position: "absolute",
          bottom: "12%",
          right: "34%",
          opacity: 0.1,
        }}
      >
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="var(--yellow)"
          strokeWidth="2.5"
          strokeDasharray="2 12"
        />
      </svg>

      <svg
        width="90"
        height="90"
        viewBox="0 0 90 90"
        style={{ position: "absolute", top: "38%", left: "14%", opacity: 0.1 }}
      >
        <path
          d="M5 80 L45 10 L85 80 Z"
          stroke="var(--green)"
          strokeWidth="2.5"
          fill="none"
          transform="rotate(-6 45 45)"
        />
      </svg>

      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        style={{
          position: "absolute",
          bottom: "32%",
          left: "46%",
          opacity: 0.11,
        }}
      >
        <rect
          x="5"
          y="5"
          width="70"
          height="70"
          fill="none"
          stroke="var(--red)"
          strokeWidth="2.5"
          transform="rotate(-15 40 40)"
        />
      </svg>

      <svg
        width="100"
        height="100"
        viewBox="0 0 100 100"
        style={{ position: "absolute", top: "10%", right: "40%", opacity: 0.1 }}
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="var(--blue)"
          strokeWidth="2.5"
          strokeDasharray="5 8"
        />
      </svg>

      <svg
        width="60"
        height="60"
        viewBox="0 0 60 60"
        style={{ position: "absolute", top: "60%", right: "26%", opacity: 0.4 }}
      >
        <circle cx="10" cy="10" r="3" fill="var(--red)" />
        <circle cx="40" cy="22" r="2.5" fill="var(--blue)" />
        <circle cx="22" cy="42" r="3" fill="var(--yellow)" />
        <circle cx="48" cy="48" r="2.5" fill="var(--green)" />
      </svg>

      <svg
        width="50"
        height="50"
        viewBox="0 0 50 50"
        style={{
          position: "absolute",
          bottom: "18%",
          left: "20%",
          opacity: 0.35,
        }}
      >
        <circle cx="8" cy="8" r="2.5" fill="var(--blue)" />
        <circle cx="28" cy="18" r="2" fill="var(--yellow)" />
        <circle cx="14" cy="36" r="3" fill="var(--red)" />
      </svg>

      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        style={{ position: "absolute", top: "78%", left: "8%", opacity: 0.1 }}
      >
        <rect
          x="10"
          y="10"
          width="90"
          height="90"
          fill="none"
          stroke="var(--green)"
          strokeWidth="2.5"
          transform="rotate(12 55 55)"
        />
      </svg>

      <svg
        width="90"
        height="90"
        viewBox="0 0 90 90"
        style={{ position: "absolute", top: "4%", left: "6%", opacity: 0.1 }}
      >
        <circle
          cx="45"
          cy="45"
          r="38"
          fill="none"
          stroke="var(--red)"
          strokeWidth="2.5"
          strokeDasharray="6 9"
        />
      </svg>

      <svg
        width="100"
        height="100"
        viewBox="0 0 100 100"
        style={{
          position: "absolute",
          bottom: "4%",
          right: "6%",
          opacity: 0.11,
        }}
      >
        <path
          d="M5 90 L50 10 L95 90 Z"
          stroke="var(--yellow)"
          strokeWidth="2.5"
          fill="none"
          transform="rotate(-4 50 50)"
        />
      </svg>

      <svg
        width="70"
        height="70"
        viewBox="0 0 70 70"
        style={{ position: "absolute", top: "30%", right: "4%", opacity: 0.11 }}
      >
        <rect
          x="5"
          y="5"
          width="60"
          height="60"
          fill="none"
          stroke="var(--blue)"
          strokeWidth="2.5"
          strokeDasharray="4 6"
          transform="rotate(22 35 35)"
        />
      </svg>

      <svg
        width="50"
        height="50"
        viewBox="0 0 50 50"
        style={{ position: "absolute", top: "72%", left: "60%", opacity: 0.4 }}
      >
        <circle cx="10" cy="10" r="2.5" fill="var(--green)" />
        <circle cx="34" cy="20" r="3" fill="var(--red)" />
        <circle cx="20" cy="40" r="2" fill="var(--blue)" />
      </svg>
    </div>
  );
}
