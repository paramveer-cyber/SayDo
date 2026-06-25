"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Image from "next/image";

type ShapeDefinition = {
  id: string;
  color: string;
  opacity: number;
  xOffset: number;
  renderSvg: (color: string) => React.ReactNode;
};

const COLORS = {
  red: "var(--red)",
  yellow: "var(--yellow)",
  blue: "var(--blue)",
  green: "var(--green)",
  dim: "var(--border-strong)",
};

const allShapeRenderers: Array<{
  id: string;
  render: (color: string) => React.ReactNode;
}> = [
  {
    id: "square-filled",
    render: (c) => (
      <svg width="18" height="18">
        <rect width="18" height="18" fill={c} />
      </svg>
    ),
  },
  {
    id: "circle-outline",
    render: (c) => (
      <svg width="14" height="14">
        <circle cx="7" cy="7" r="6" fill="none" stroke={c} strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: "triangle-up",
    render: (c) => (
      <svg width="20" height="18">
        <polygon points="10,1 19,17 1,17" fill={c} />
      </svg>
    ),
  },
  {
    id: "triangle-down",
    render: (c) => (
      <svg width="20" height="18">
        <polygon
          points="10,17 1,1 19,1"
          fill="none"
          stroke={c}
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    id: "diamond",
    render: (c) => (
      <svg width="16" height="20">
        <polygon
          points="8,1 15,10 8,19 1,10"
          fill="none"
          stroke={c}
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    id: "cross",
    render: (c) => (
      <svg width="18" height="18">
        <line x1="9" y1="0" x2="9" y2="18" stroke={c} strokeWidth="1.5" />
        <line x1="0" y1="9" x2="18" y2="9" stroke={c} strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: "x-mark",
    render: (c) => (
      <svg width="16" height="16">
        <line x1="0" y1="0" x2="16" y2="16" stroke={c} strokeWidth="1.5" />
        <line x1="16" y1="0" x2="0" y2="16" stroke={c} strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: "hexagon",
    render: (c) => (
      <svg width="22" height="20">
        <polygon
          points="11,1 20,5.5 20,14.5 11,19 2,14.5 2,5.5"
          fill="none"
          stroke={c}
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    id: "hexagon-filled",
    render: (c) => (
      <svg width="18" height="16">
        <polygon points="9,0 17,4 17,12 9,16 1,12 1,4" fill={c} opacity="0.7" />
      </svg>
    ),
  },
  {
    id: "star",
    render: (c) => (
      <svg width="20" height="20">
        <polygon
          points="10,1 12.5,7.5 19,7.5 13.5,11.5 15.5,18 10,14 4.5,18 6.5,11.5 1,7.5 7.5,7.5"
          fill={c}
        />
      </svg>
    ),
  },
  {
    id: "star-outline",
    render: (c) => (
      <svg width="20" height="20">
        <polygon
          points="10,1 12.5,7.5 19,7.5 13.5,11.5 15.5,18 10,14 4.5,18 6.5,11.5 1,7.5 7.5,7.5"
          fill="none"
          stroke={c}
          strokeWidth="1.2"
        />
      </svg>
    ),
  },
  {
    id: "arrow-down",
    render: (c) => (
      <svg width="14" height="20">
        <line x1="7" y1="0" x2="7" y2="16" stroke={c} strokeWidth="1.5" />
        <polyline
          points="2,11 7,17 12,11"
          fill="none"
          stroke={c}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "semicircle",
    render: (c) => (
      <svg width="20" height="10">
        <path d="M0,10 A10,10 0 0,1 20,10" fill={c} />
      </svg>
    ),
  },
  {
    id: "arc",
    render: (c) => (
      <svg width="22" height="12">
        <path
          d="M2,11 A9,9 0 0,1 20,11"
          fill="none"
          stroke={c}
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    id: "infinity-loop",
    render: (c) => (
      <svg width="32" height="16" viewBox="0 0 32 16">
        <path
          d="M16,8 C16,4 12,1 8,1 C4,1 1,4 1,8 C1,12 4,15 8,15 C12,15 16,12 16,8 C16,4 20,1 24,1 C28,1 31,4 31,8 C31,12 28,15 24,15 C20,15 16,12 16,8 Z"
          fill="none"
          stroke={c}
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    id: "spiral",
    render: (c) => (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path
          d="M12,12 C12,9 10,7 8,8 C6,9 6,12 8,13 C11,14 14,11 13,8 C12,5 8,4 6,6 C3,8 4,14 8,16 C13,18 18,14 17,9 C16,3 9,1 5,4"
          fill="none"
          stroke={c}
          strokeWidth="1.2"
        />
      </svg>
    ),
  },
  {
    id: "nested-squares",
    render: (c) => (
      <svg width="22" height="22">
        <rect
          x="1"
          y="1"
          width="20"
          height="20"
          fill="none"
          stroke={c}
          strokeWidth="1"
        />
        <rect
          x="5"
          y="5"
          width="12"
          height="12"
          fill="none"
          stroke={c}
          strokeWidth="1"
        />
        <rect x="9" y="9" width="4" height="4" fill={c} opacity="0.6" />
      </svg>
    ),
  },
  {
    id: "optical-rings",
    render: (c) => (
      <svg width="24" height="24">
        <circle cx="12" cy="12" r="10" fill="none" stroke={c} strokeWidth="1" />
        <circle
          cx="12"
          cy="12"
          r="6"
          fill="none"
          stroke={c}
          strokeWidth="1.5"
        />
        <circle cx="12" cy="12" r="2" fill={c} />
      </svg>
    ),
  },
  {
    id: "penrose-triangle-hint",
    render: (c) => (
      <svg width="24" height="22" viewBox="0 0 24 22">
        <polygon
          points="12,2 22,20 2,20"
          fill="none"
          stroke={c}
          strokeWidth="1.5"
        />
        <polygon points="12,6 18,17 6,17" fill={c} opacity="0.15" />
      </svg>
    ),
  },
  {
    id: "wave",
    render: (c) => (
      <svg width="36" height="12" viewBox="0 0 36 12">
        <path
          d="M0,6 C4,0 8,12 12,6 C16,0 20,12 24,6 C28,0 32,12 36,6"
          fill="none"
          stroke={c}
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    id: "dotted-line",
    render: (c) => (
      <svg width="2" height="32">
        <line
          x1="1"
          y1="0"
          x2="1"
          y2="32"
          stroke={c}
          strokeWidth="1.5"
          strokeDasharray="3 4"
        />
      </svg>
    ),
  },
  {
    id: "dashed-h",
    render: (c) => (
      <svg width="32" height="2">
        <line
          x1="0"
          y1="1"
          x2="32"
          y2="1"
          stroke={c}
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      </svg>
    ),
  },
  {
    id: "pi-doodle",
    render: (c) => (
      <svg width="22" height="18" viewBox="0 0 22 18">
        <line x1="2" y1="4" x2="20" y2="4" stroke={c} strokeWidth="1.5" />
        <path d="M7,4 L7,16" stroke={c} strokeWidth="1.5" />
        <path
          d="M15,4 C15,10 17,14 19,16"
          stroke={c}
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    ),
  },
  {
    id: "corner-bracket",
    render: (c) => (
      <svg width="16" height="16">
        <path
          d="M1,15 L1,1 L15,1"
          fill="none"
          stroke={c}
          strokeWidth="1.5"
          strokeLinecap="square"
        />
      </svg>
    ),
  },
  {
    id: "zigzag",
    render: (c) => (
      <svg width="28" height="14">
        <polyline
          points="0,12 7,2 14,12 21,2 28,12"
          fill="none"
          stroke={c}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "eye-shape",
    render: (c) => (
      <svg width="28" height="14">
        <path
          d="M2,7 C7,1 21,1 26,7 C21,13 7,13 2,7 Z"
          fill="none"
          stroke={c}
          strokeWidth="1.2"
        />
        <circle cx="14" cy="7" r="3" fill={c} opacity="0.7" />
      </svg>
    ),
  },
  {
    id: "heart-geometric",
    render: (c) => (
      <svg width="18" height="16" viewBox="0 0 18 16">
        <path
          d="M9,14 L2,7 C2,4 5,2 7,4 L9,6 L11,4 C13,2 16,4 16,7 Z"
          fill="none"
          stroke={c}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "grid-2x2",
    render: (c) => (
      <svg width="16" height="16">
        <rect x="1" y="1" width="6" height="6" fill={c} opacity="0.5" />
        <rect
          x="9"
          y="1"
          width="6"
          height="6"
          fill="none"
          stroke={c}
          strokeWidth="1"
        />
        <rect
          x="1"
          y="9"
          width="6"
          height="6"
          fill="none"
          stroke={c}
          strokeWidth="1"
        />
        <rect x="9" y="9" width="6" height="6" fill={c} opacity="0.5" />
      </svg>
    ),
  },
  {
    id: "ghost",
    render: (c) => (
      <svg width="18" height="22" viewBox="0 0 18 22">
        <path
          d="M1,22 L1,10 C1,5 4,1 9,1 C14,1 17,5 17,10 L17,22 L14,19 L11,22 L9,19 L7,22 L4,19 Z"
          fill="none"
          stroke={c}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="6" cy="10" r="2" fill={c} opacity="0.6" />
        <circle cx="12" cy="10" r="2" fill={c} opacity="0.6" />
      </svg>
    ),
  },
  {
    id: "speech-bubble",
    render: (c) => (
      <svg width="22" height="18" viewBox="0 0 22 18">
        <path
          d="M2,1 L20,1 C21,1 21,2 21,3 L21,12 C21,13 21,14 20,14 L8,14 L4,17 L4,14 L2,14 C1,14 1,13 1,12 L1,3 C1,2 1,1 2,1 Z"
          fill="none"
          stroke={c}
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "lightning",
    render: (c) => (
      <svg width="14" height="22" viewBox="0 0 14 22">
        <polygon
          points="8,1 2,12 7,12 6,21 12,10 7,10"
          fill={c}
          opacity="0.8"
        />
      </svg>
    ),
  },
];

const colorList = [
  COLORS.red,
  COLORS.yellow,
  COLORS.blue,
  COLORS.green,
  COLORS.dim,
];

function buildShapeList(
  indices: number[],
  xOffsets: number[],
  opacities: number[],
): ShapeDefinition[] {
  return indices.map((shapeIdx, i) => {
    const renderer = allShapeRenderers[shapeIdx % allShapeRenderers.length];
    const color = colorList[i % colorList.length];
    return {
      id: `${renderer.id}-${i}`,
      color,
      opacity: opacities[i % opacities.length],
      xOffset: xOffsets[i % xOffsets.length],
      renderSvg: renderer.render,
    };
  });
}

const leftShapeDefinitions = buildShapeList(
  [
    0, 1, 2, 4, 7, 8, 14, 16, 17, 18, 19, 22, 24, 26, 27, 28, 3, 6, 9, 11, 13,
    15, 20, 25, 29, 30, 5, 10,
  ],
  [
    8, 30, 55, 80, 20, 65, 40, 12, 72, 48, 88, 35, 60, 18, 52, 70, 42, 68, 25,
    90, 15, 58, 76, 33, 62, 44, 82, 28,
  ],
  [
    0.75, 0.6, 0.8, 0.5, 0.7, 0.65, 0.55, 0.85, 0.6, 0.7, 0.5, 0.8, 0.65, 0.7,
    0.6, 0.75, 0.55, 0.7, 0.8, 0.6, 0.65, 0.5, 0.75, 0.7, 0.6, 0.8, 0.55, 0.7,
  ],
);

const rightShapeDefinitions = buildShapeList(
  [
    3, 5, 6, 9, 10, 11, 12, 13, 15, 20, 21, 23, 25, 29, 30, 31, 0, 2, 7, 8, 14,
    17, 19, 22, 24, 26, 1, 4,
  ],
  [
    10, 50, 28, 75, 15, 60, 38, 88, 22, 65, 44, 80, 12, 55, 32, 70, 48, 20, 72,
    36, 84, 18, 58, 40, 92, 26, 66, 46,
  ],
  [
    0.7, 0.55, 0.8, 0.65, 0.75, 0.5, 0.7, 0.6, 0.85, 0.55, 0.65, 0.7, 0.8, 0.6,
    0.7, 0.55, 0.75, 0.65, 0.5, 0.8, 0.6, 0.7, 0.55, 0.75, 0.65, 0.8, 0.6, 0.7,
  ],
);

function FlowingShapeColumn({
  side,
  shapes,
  heroHeight,
}: {
  side: "left" | "right";
  shapes: ShapeDefinition[];
  heroHeight: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || heroHeight === 0) return;
    const shapeElements = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(".flowing-shape"),
    );

    const totalShapes = shapeElements.length;

    const primes = [
      11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79,
      83, 89, 97, 101, 103, 107, 109, 113, 127, 131,
    ];

    shapeElements.forEach((el, index) => {
      const baseDuration = 14 + (primes[index % primes.length] % 14);
      const initialY = (index / totalShapes) * heroHeight;
      const remainingDuration = baseDuration * (1 - index / totalShapes);

      gsap.set(el, {
        y: initialY,
        opacity: shapes[index % shapes.length].opacity,
      });

      const loopEl = () => {
        const jitteredDuration = baseDuration + (Math.random() * 4 - 2);
        gsap.fromTo(
          el,
          { y: -60 },
          {
            y: heroHeight + 60,
            duration: jitteredDuration,
            ease: "none",
            onComplete: loopEl,
          },
        );
      };

      gsap.to(el, {
        y: heroHeight + 60,
        duration: Math.max(1, remainingDuration),
        ease: "none",
        onComplete: loopEl,
      });

      gsap.to(el, {
        opacity: shapes[index % shapes.length].opacity * 0.25,
        duration: 2.5 + (index % 4) * 0.7,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: index * 0.22,
      });
    });

    return () => {
      gsap.killTweensOf(shapeElements);
    };
  }, [heroHeight, shapes]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        [side]: 0,
        width: 140,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      {shapes.map((shape, index) => {
        const positionStyle: React.CSSProperties =
          side === "left" ? { left: shape.xOffset } : { right: shape.xOffset };

        return (
          <div
            key={shape.id}
            className="flowing-shape"
            style={{
              position: "absolute",
              top: 0,
              ...positionStyle,
              opacity: shape.opacity,
              lineHeight: 0,
            }}
          >
            {shape.renderSvg(shape.color)}
          </div>
        );
      })}
    </div>
  );
}

function FlowingShapes({
  heroRef,
}: {
  heroRef: React.RefObject<HTMLElement | null>;
}) {
  const [measuredHeight, setMeasuredHeight] = React.useState(0);

  useEffect(() => {
    if (!heroRef.current) return;
    const updateHeight = () => {
      if (heroRef.current) setMeasuredHeight(heroRef.current.offsetHeight);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [heroRef]);

  if (measuredHeight === 0) return null;

  return (
    <>
      <FlowingShapeColumn
        side="left"
        shapes={leftShapeDefinitions}
        heroHeight={measuredHeight}
      />
      <FlowingShapeColumn
        side="right"
        shapes={rightShapeDefinitions}
        heroHeight={measuredHeight}
      />
    </>
  );
}

gsap.registerPlugin(ScrollTrigger);

function DotGridBackground() {
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

function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      if (barRef.current)
        barRef.current.style.transform = `scaleX(${progress})`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 200,
        background: "var(--border)",
      }}
    >
      <div
        ref={barRef}
        style={{
          height: "100%",
          background: "var(--yellow)",
          transformOrigin: "left center",
          transform: "scaleX(0)",
        }}
      />
    </div>
  );
}

const FIGHTING_TABS = [
  { label: "Inbox triage", color: "var(--red)" },
  { label: "Draft replies", color: "var(--border-strong)" },
  { label: "Book meetings", color: "var(--yellow)" },
  { label: "Summarize email", color: "var(--border-strong)" },
  { label: "Find action items", color: "var(--blue)" },
  { label: "Check availability", color: "var(--green)" },
];

const SULK_PHRASES = [
  "pick me!!!",
  "i'm right here",
  "hello?? 👋",
  "rude.",
  "i do it better",
  "seriously?",
  "over here bro",
  "not cool",
  "i'm literally so useful",
  "fine. whatever.",
  "this is embarrassing",
  "my turn next ok?",
];

function FightingTabs() {
  const [activeId, setActiveId] = React.useState<number | null>(null);
  const [shoveDir, setShoveDir] = React.useState<
    Record<number, "left" | "right" | null>
  >({});
  const [sulking, setSulking] = React.useState<Record<number, boolean>>({});
  const [sulkPhrases, setSulkPhrases] = React.useState<Record<number, string>>(
    {},
  );
  const [rotations] = React.useState<number[]>(() =>
    FIGHTING_TABS.map(() => (Math.random() - 0.5) * 8),
  );
  const [floatOffsets, setFloatOffsets] = React.useState<
    { x: number; y: number }[]
  >(() => FIGHTING_TABS.map(() => ({ x: 0, y: 0 })));

  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = [];
    FIGHTING_TABS.forEach((_, i) => {
      const drift = () => {
        setFloatOffsets((prev) => {
          const next = [...prev];
          next[i] = {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10,
          };
          return next;
        });
      };
      intervals.push(setInterval(drift, 1800 + i * 370));
    });
    return () => intervals.forEach(clearInterval);
  }, []);

  const handleActivate = (id: number) => {
    if (id === activeId) return;
    setActiveId(id);

    const newShove: Record<number, "left" | "right"> = {};
    const newSulk: Record<number, boolean> = {};
    const newPhrases: Record<number, string> = {};
    FIGHTING_TABS.forEach((_, i) => {
      if (i === id) return;
      newShove[i] = i < id ? "left" : "right";
      newSulk[i] = Math.random() > 0.3;
      newPhrases[i] =
        SULK_PHRASES[Math.floor(Math.random() * SULK_PHRASES.length)];
    });
    setShoveDir(newShove);
    setSulking(newSulk);
    setSulkPhrases(newPhrases);

    setTimeout(() => {
      setShoveDir({});
      setTimeout(() => setSulking({}), 1400);
    }, 350);
  };

  return (
    <div
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--bg)",
        padding: "2.2rem 2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.25rem",
        position: "relative",
        overflow: "visible",
      }}
    >
      <span
        style={{
          fontSize: "0.52rem",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--fg-dim)",
        }}
      >
        What can I do for you
      </span>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "1rem",
          paddingTop: "0.5rem",
          paddingBottom: "0.75rem",
        }}
      >
        {FIGHTING_TABS.map((tab, i) => {
          const isActive = activeId === i;
          const rot = isActive ? 0 : rotations[i];
          const shove = shoveDir[i];
          const isSulking = sulking[i];
          const float = floatOffsets[i];

          const translateX = isActive
            ? 0
            : shove === "left"
              ? -12
              : shove === "right"
                ? 12
                : float.x;
          const translateY = isActive ? 0 : float.y;
          const scale = isActive ? 1.08 : 1;

          return (
            <div
              key={tab.label}
              onClick={() => handleActivate(i)}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.65rem 1.1rem",
                border: `1px solid ${isActive ? "var(--fg)" : "var(--border-strong)"}`,
                background: isActive ? "var(--fg)" : "var(--bg)",
                cursor: "pointer",
                userSelect: "none",
                transform: `rotate(${rot}deg) translate(${translateX}px, ${translateY}px) scale(${scale})`,
                transition:
                  "transform 0.35s cubic-bezier(.34,1.56,.64,1), background 0.15s, border-color 0.15s",
                zIndex: isActive ? 10 : 1,
              }}
            >
              {isSulking && !isActive && (
                <span
                  key={sulkPhrases[i]}
                  style={{
                    position: "absolute",
                    top: -24,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "0.48rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "lowercase",
                    color: "var(--fg-dim)",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    fontStyle: "italic",
                    animation: "sulkFadeIn 0.2s ease forwards",
                  }}
                >
                  {sulkPhrases[i]}
                </span>
              )}
              <div
                style={{
                  width: 4,
                  height: 4,
                  background: isActive ? "var(--bg)" : tab.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: isActive
                    ? "var(--bg)"
                    : tab.color === "var(--border-strong)"
                      ? "var(--fg-dim)"
                      : "var(--fg)",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes sulkFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(5px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function LandingPage() {
  const auth = useAuth();
  const router = useRouter();

  const navRef = useRef<HTMLElement>(null);
  const heroWordYouRef = useRef<HTMLSpanElement>(null);
  const heroWordSayRef = useRef<HTMLSpanElement>(null);
  const heroWordWeRef = useRef<HTMLSpanElement>(null);
  const heroWordDoRef = useRef<HTMLSpanElement>(null);
  const heroSubRef = useRef<HTMLDivElement>(null);
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const heroMetaRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);
  const howRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);

  const primaryHref = auth.status === "authenticated" ? "/dashboard" : "/auth";
  const primaryLabel =
    auth.status === "authenticated" ? "Open dashboard" : "Get started";

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.075, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.fromTo(
      navRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5 },
    )
      .fromTo(
        heroWordYouRef.current,
        { y: 120, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9 },
        "-=0.1",
      )
      .fromTo(
        heroWordSayRef.current,
        { y: 120, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9 },
        "-=0.72",
      )
      .fromTo(
        heroWordWeRef.current,
        { y: -120, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9 },
        "-=0.72",
      )
      .fromTo(
        heroWordDoRef.current,
        { y: -120, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9 },
        "-=0.72",
      )
      .fromTo(
        heroSubRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6 },
        "-=0.4",
      )
      .fromTo(
        heroCtaRef.current,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        "-=0.4",
      )
      .fromTo(
        heroMetaRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5 },
        "-=0.3",
      );

    [card1Ref, card2Ref, card3Ref].forEach((ref, i) => {
      gsap.fromTo(
        ref.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          ease: "power3.out",
          delay: i * 0.1,
          scrollTrigger: { trigger: ref.current, start: "top 82%" },
        },
      );
    });

    gsap.fromTo(
      howRef.current,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.6,
        scrollTrigger: { trigger: howRef.current, start: "top 78%" },
      },
    );
    gsap.fromTo(
      ctaRef.current,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: ctaRef.current, start: "top 80%" },
      },
    );

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div
      style={{
        background: "var(--bg)",
        color: "var(--fg)",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <DotGridBackground />
      <ScrollProgressBar />

      {/* ── NAV ── */}
      <nav
        ref={navRef}
        style={{
          position: "fixed",
          top: 2,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 2.5rem",
          height: 58,
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Image src={"/icon.png"} alt="Icon" height={48} width={48} />
          {/* <div
            style={{
              width: 26,
              height: 26,
              background: "var(--red)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              clipPath: "polygon(0 0, 100% 0, 100% 72%, 72% 100%, 0 100%)",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 13L8 3L13 13"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5 9.5H11"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div> */}
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
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
          <span
            style={{
              fontSize: "0.62rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--fg-dim)",
              fontWeight: 600,
            }}
          >
            Gmail · Calendar · AI
          </span>
          <a
            href="/pricing"
            style={{
              fontSize: "0.62rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--fg-dim)",
              fontWeight: 600,
              textDecoration: "none",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--fg-dim)")
            }
          >
            Pricing
          </a>
          <button
            onClick={() => router.push(primaryHref)}
            style={{
              fontSize: "0.65rem",
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "0.5rem 1.2rem",
              background: "transparent",
              color: "var(--fg)",
              border: "1px solid var(--border-strong)",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--fg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-strong)";
            }}
          >
            {primaryLabel}
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        ref={heroSectionRef}
        style={{
          minHeight: "100vh",
          paddingTop: 60,
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          borderBottom: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        <FlowingShapes heroRef={heroSectionRef} />
        {/* Main type block */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "3rem 2rem 2rem",
            position: "relative",
          }}
        >
          {/* Eyebrow */}
          <div
            ref={heroMetaRef}
            style={{
              fontSize: "0.58rem",
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--fg-dim)",
              marginBottom: "2.5rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div
              style={{
                width: 24,
                height: 1,
                background: "var(--border-strong)",
              }}
            />
            AI for Gmail + Google Calendar
            <div
              style={{
                width: 24,
                height: 1,
                background: "var(--border-strong)",
              }}
            />
          </div>

          {/* The four words — each a different color, stacked 2×2 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto auto",
              columnGap: "0.05em",
              rowGap: "0",
              lineHeight: 0.88,
              letterSpacing: "-0.04em",
              marginBottom: "3rem",
            }}
          >
            {/* "You" — red */}
            <span
              ref={heroWordYouRef}
              style={{
                fontFamily: "'Movement', sans-serif",
                fontSize: "clamp(5rem, 12.5vw, 11.5rem)",
                color: "var(--red)",
                display: "block",
                textAlign: "right",
                paddingRight: "0.03em",
              }}
            >
              You
            </span>
            {/* "Say," — yellow */}
            <span
              ref={heroWordSayRef}
              style={{
                fontFamily: "'Movement', sans-serif",
                fontSize: "clamp(5rem, 12.5vw, 11.5rem)",
                color: "var(--yellow)",
                display: "block",
                textAlign: "left",
                paddingLeft: "0.03em",
              }}
            >
              Say,
            </span>
            {/* "We" — blue */}
            <span
              ref={heroWordWeRef}
              style={{
                fontFamily: "'Movement', sans-serif",
                fontSize: "clamp(5rem, 12.5vw, 11.5rem)",
                color: "var(--blue)",
                display: "block",
                textAlign: "right",
                paddingRight: "0.03em",
              }}
            >
              We
            </span>
            {/* "Do." — green */}
            <span
              ref={heroWordDoRef}
              style={{
                fontFamily: "'Movement', sans-serif",
                fontSize: "clamp(5rem, 12.5vw, 11.5rem)",
                color: "var(--green)",
                display: "block",
                textAlign: "left",
                paddingLeft: "0.03em",
              }}
            >
              Do.
            </span>
          </div>

          {/* Subtext + CTA */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0",
              width: "100%",
              maxWidth: 800,
              borderTop: "1px solid var(--border)",
              paddingTop: "2rem",
            }}
          >
            <div
              ref={heroSubRef}
              style={{
                paddingRight: "3rem",
                borderRight: "1px solid var(--border)",
              }}
            >
              <p
                style={{
                  fontSize: "clamp(0.88rem, 1.2vw, 1.05rem)",
                  lineHeight: 1.65,
                  color: "var(--fg-dim)",
                  margin: 0,
                  fontWeight: 400,
                  letterSpacing: "-0.01em",
                }}
              >
                Your email and calendar, handled by an AI that reads them — and
                actually acts.
              </p>
            </div>

            <div
              ref={heroCtaRef}
              style={{
                paddingLeft: "3rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "1rem",
              }}
            >
              <button
                onClick={() => router.push(primaryHref)}
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "0.9rem 2rem",
                  background: "var(--fg)",
                  color: "var(--bg)",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  alignSelf: "flex-start",
                  clipPath:
                    "polygon(0 0, 100% 0, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {primaryLabel}
              </button>
              <span
                style={{
                  fontSize: "0.58rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--fg-dim)",
                  fontWeight: 600,
                }}
              >
                One Google login · Free to start
              </span>
            </div>
          </div>
        </div>

        {/* Bottom capability strip — fighting tabs */}
        <FightingTabs />
      </section>

      {/* ── FEATURES ── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          padding: "6rem 2.5rem",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: "4rem",
          }}
        >
          <h2
            style={{
              fontFamily: "'Movement', sans-serif",
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              margin: 0,
            }}
          >
            Three tools.
          </h2>
          <span
            style={{
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--fg-dim)",
            }}
          >
            01 / What it does
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          {/* Card 1 — Gmail, large, top-left cut corner */}
          <div
            ref={card1Ref}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              padding: "2.5rem",
              clipPath: "polygon(0 24px, 24px 0, 100% 0, 100% 100%, 0 100%)",
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: "0.58rem",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--blue)",
                marginBottom: "1.5rem",
              }}
            >
              Gmail
            </div>
            <h3
              style={{
                fontFamily: "'Movement', sans-serif",
                fontSize: "2.4rem",
                lineHeight: 0.95,
                letterSpacing: "-0.02em",
                margin: "0 0 1.5rem",
              }}
            >
              Inbox,
              <br />
              finally
              <br />
              quiet.
            </h3>
            <p
              style={{
                fontSize: "0.82rem",
                lineHeight: 1.7,
                color: "var(--fg-dim)",
                margin: "0 0 2rem",
              }}
            >
              Read threads, search years of mail, draft replies in seconds, send
              — without switching tabs.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {[
                "Threaded view",
                "Smart search",
                "AI drafts",
                "Batch actions",
              ].map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "0.3rem 0.65rem",
                    border: "1px solid var(--border-strong)",
                    color: "var(--fg-dim)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 3,
                height: "40%",
                background: "var(--blue)",
              }}
            />
          </div>

          {/* Column 2 — Calendar card + quote block */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            <div
              ref={card2Ref}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                padding: "2rem",
                clipPath:
                  "polygon(0 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%)",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: "0.58rem",
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--yellow)",
                  marginBottom: "1rem",
                }}
              >
                Calendar
              </div>
              <h3
                style={{
                  fontFamily: "'Movement', sans-serif",
                  fontSize: "1.8rem",
                  lineHeight: 0.95,
                  letterSpacing: "-0.02em",
                  margin: "0 0 1rem",
                }}
              >
                Schedule,
                <br />
                handled.
              </h3>
              <p
                style={{
                  fontSize: "0.78rem",
                  lineHeight: 1.65,
                  color: "var(--fg-dim)",
                  margin: 0,
                }}
              >
                Block time, create events from email, check availability
                instantly.
              </p>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "60%",
                  height: 2,
                  background: "var(--yellow)",
                }}
              />
            </div>

            <div
              style={{
                background: "var(--yellow)",
                padding: "1.5rem",
                clipPath: "polygon(16px 0, 100% 0, 100% 100%, 0 100%, 0 16px)",
              }}
            >
              <p
                style={{
                  fontSize: "0.82rem",
                  lineHeight: 1.6,
                  color: "var(--bg)",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                "What's free Thursday?" — get an actual answer.
              </p>
            </div>
          </div>

          {/* Card 3 — AI, inverted, bottom-right rounded */}
          <div
            ref={card3Ref}
            style={{
              background: "var(--fg)",
              color: "var(--bg)",
              padding: "2.5rem",
              borderBottomRightRadius: 20,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontSize: "0.58rem",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--red)",
                marginBottom: "1.5rem",
              }}
            >
              AI Chat
            </div>
            <h3
              style={{
                fontFamily: "'Movement', sans-serif",
                fontSize: "1.8rem",
                lineHeight: 0.95,
                letterSpacing: "-0.02em",
                margin: "0 0 1.25rem",
                color: "var(--bg)",
              }}
            >
              An assistant
              <br />
              that acts.
            </h3>
            <p
              style={{
                fontSize: "0.78rem",
                lineHeight: 1.65,
                color: "var(--fg-dim)",
                margin: "0 0 1.75rem",
              }}
            >
              Not a chatbot. SayDo reads your real inbox, your real calendar,
              and takes action.
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              {[
                "Inbox triage",
                "Bulk reply drafts",
                "Summarize anything",
                "Find action items",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--bg)",
                  }}
                >
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      background: "var(--red)",
                      flexShrink: 0,
                    }}
                  />
                  {item}
                </div>
              ))}
            </div>
            <div
              style={{
                position: "absolute",
                bottom: -30,
                right: -30,
                width: 90,
                height: 90,
                border: "2px solid var(--border)",
                borderRadius: "50%",
              }}
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        ref={howRef}
        style={{
          position: "relative",
          zIndex: 1,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            padding: "3.5rem 2.5rem 0",
            marginBottom: "3rem",
          }}
        >
          <h2
            style={{
              fontFamily: "'Movement', sans-serif",
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              margin: 0,
            }}
          >
            Three steps.
          </h2>
          <span
            style={{
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--fg-dim)",
            }}
          >
            02 / How it works
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            borderTop: "1px solid var(--border)",
          }}
        >
          {[
            {
              number: "01",
              title: "Connect",
              body: "Link your Google account. That's the whole setup.",
              accentColor: "var(--blue)",
            },
            {
              number: "02",
              title: "Say it",
              body: 'Type naturally. "Summarize unread email." "What\'s free Thursday?" "Draft a reply to Maya."',
              accentColor: "var(--yellow)",
            },
            {
              number: "03",
              title: "Done",
              body: "Replies drafted. Events created. Inbox triaged. Confirm, move on.",
              accentColor: "var(--red)",
            },
          ].map((step, i) => (
            <div
              key={step.number}
              style={{
                padding: "3rem 2.5rem",
                borderRight: i < 2 ? "1px solid var(--border)" : "none",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: step.accentColor,
                }}
              />
              <div
                style={{
                  fontFamily: "'Movement', sans-serif",
                  fontSize: "5rem",
                  lineHeight: 1,
                  color: step.accentColor,
                  marginBottom: "1.5rem",
                  letterSpacing: "-0.04em",
                }}
              >
                {step.number}
              </div>
              <h3
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: "0.875rem",
                  color: "var(--fg)",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: "0.82rem",
                  lineHeight: 1.7,
                  color: "var(--fg-dim)",
                  margin: 0,
                }}
              >
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        ref={ctaRef}
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "5fr 4fr",
          minHeight: "45vh",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            borderRight: "1px solid var(--border)",
            padding: "5rem 3.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h2
            style={{
              fontFamily: "'Movement', sans-serif",
              fontSize: "clamp(3rem, 6vw, 5.5rem)",
              letterSpacing: "-0.03em",
              lineHeight: 0.92,
              margin: "0 0 2.5rem",
            }}
          >
            Your inbox
            <br />
            won't manage
            <br />
            <span style={{ color: "var(--yellow)" }}>itself.</span>
          </h2>
          <div
            style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}
          >
            <button
              onClick={() => router.push(primaryHref)}
              style={{
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "0.9rem 2.25rem",
                background: "var(--fg)",
                color: "var(--bg)",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                clipPath:
                  "polygon(0 0, 100% 0, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {primaryLabel}
            </button>
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--fg-dim)",
              }}
            >
              Free · No setup
            </span>
          </div>
        </div>

        <div
          style={{
            padding: "5rem 3rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--fg-dim)",
                marginBottom: "1rem",
              }}
            >
              Just Google OAuth
            </div>
            <p
              style={{
                fontSize: "0.85rem",
                lineHeight: 1.7,
                color: "var(--fg-dim)",
                maxWidth: 280,
                margin: 0,
              }}
            >
              Connect Gmail and Google Calendar once. SayDo handles triage,
              drafts, scheduling, and summaries.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1px",
              background: "var(--border)",
              border: "1px solid var(--border)",
            }}
          >
            {[
              { value: "2s", label: "Draft a reply" },
              { value: "1×", label: "Google connect" },
              { value: "∞", label: "Emails handled" },
              { value: "0", label: "Tab switching" },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: "var(--bg)",
                  padding: "1rem",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Movement', sans-serif",
                    fontSize: "1.8rem",
                    lineHeight: 1,
                    color: "var(--fg)",
                    marginBottom: "0.3rem",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--fg-dim)",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid var(--border)",
        }}
      >
        {/* Footer top row — links grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Brand col */}
          <div
            style={{
              padding: "2.5rem 2.5rem",
              borderRight: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
            >
              <img
                src="/icon.png"
                alt="Corsair"
                style={{ width: 28, height: 28, objectFit: "cover" }}
              />
              <span
                style={{
                  fontWeight: 900,
                  fontSize: "0.78rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                SayDo
              </span>
            </div>
            <p
              style={{
                fontSize: "0.72rem",
                lineHeight: 1.65,
                color: "var(--fg-dim)",
                margin: 0,
                maxWidth: 220,
              }}
            >
              AI assistant for Gmail and Google Calendar. You say it, we do it.
            </p>
          </div>

          {/* Product links */}
          <div
            style={{
              padding: "2.5rem 2.5rem",
              borderRight: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: "0.52rem",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--fg-dim)",
                marginBottom: "1.25rem",
              }}
            >
              Product
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <a
                href={primaryHref}
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--fg)",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--yellow)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--fg)")
                }
              >
                <div
                  style={{
                    width: 4,
                    height: 4,
                    background: "var(--yellow)",
                    flexShrink: 0,
                  }}
                />
                {primaryLabel}
              </a>
              <a
                href="/pricing"
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--fg)",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--blue)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--fg)")
                }
              >
                <div
                  style={{
                    width: 4,
                    height: 4,
                    background: "var(--blue)",
                    flexShrink: 0,
                  }}
                />
                Pricing
              </a>
            </div>
          </div>

          {/* Legal links */}
          <div style={{ padding: "2.5rem 2.5rem" }}>
            <div
              style={{
                fontSize: "0.52rem",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--fg-dim)",
                marginBottom: "1.25rem",
              }}
            >
              Legal
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {[
                {
                  label: "Terms of Service",
                  href: "/tos",
                  color: "var(--red)",
                },
                {
                  label: "Privacy Policy",
                  href: "/privacy",
                  color: "var(--green)",
                },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--fg)",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = link.color)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--fg)")
                  }
                >
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      background: link.color,
                      flexShrink: 0,
                    }}
                  />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 2.5rem",
          }}
        >
          <span
            style={{
              fontSize: "0.52rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--fg-dim)",
              fontWeight: 600,
            }}
          >
            AI assistant · Gmail + Google Calendar
          </span>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <div style={{ width: 7, height: 7, background: "var(--red)" }} />
            <div style={{ width: 7, height: 7, background: "var(--yellow)" }} />
            <div style={{ width: 7, height: 7, background: "var(--blue)" }} />
          </div>
        </div>
      </footer>
    </div>
  );
}
