"use client";

import { useEffect, useRef } from "react";

type TrailPoint = {
  x: number;
  y: number;
  age: number;
};

type ShapeParticle = {
  x: number;
  y: number;
  type: "square" | "circle" | "triangle";
  color: string;
  rotation: number;
  rotationSpeed: number;
  size: number;
  age: number;
  maxAge: number;
};

const TRAIL_LENGTH = 28;
const TRAIL_MAX_AGE = 18;
const SHAPE_SPAWN_INTERVAL = 7;
const SHAPE_MAX_AGE = 52;
const SHAPE_SIZE = 7;

const BAUHAUS_COLORS = ["var(--red)", "var(--blue)", "var(--yellow)"];

const SHAPE_TYPES: ShapeParticle["type"][] = ["square", "circle", "triangle"];

function drawTriangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const h = size * 0.866;
  ctx.beginPath();
  ctx.moveTo(x, y - h * 0.667);
  ctx.lineTo(x + size * 0.5, y + h * 0.333);
  ctx.lineTo(x - size * 0.5, y + h * 0.333);
  ctx.closePath();
}

export default function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: -9999, y: -9999 });
  const trailPoints = useRef<TrailPoint[]>([]);
  const shapes = useRef<ShapeParticle[]>([]);
  const frameCount = useRef(0);
  const animFrameId = useRef<number>(0);
  const lastMousePos = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove);

    const loop = () => {
      frameCount.current++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { x, y } = mousePos.current;
      const moved =
        Math.abs(x - lastMousePos.current.x) > 0.5 ||
        Math.abs(y - lastMousePos.current.y) > 0.5;

      if (moved && x > 0) {
        trailPoints.current.unshift({ x, y, age: 0 });
        if (trailPoints.current.length > TRAIL_LENGTH) {
          trailPoints.current.length = TRAIL_LENGTH;
        }
        lastMousePos.current = { x, y };

        if (frameCount.current % SHAPE_SPAWN_INTERVAL === 0) {
          shapes.current.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 10,
            type: SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)],
            color:
              BAUHAUS_COLORS[Math.floor(Math.random() * BAUHAUS_COLORS.length)],
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.08,
            size: SHAPE_SIZE + Math.random() * 4,
            age: 0,
            maxAge: SHAPE_MAX_AGE + Math.floor(Math.random() * 20),
          });
        }
      }

      trailPoints.current.forEach((p) => {
        p.age++;
      });
      trailPoints.current = trailPoints.current.filter(
        (p) => p.age < TRAIL_MAX_AGE,
      );

      if (trailPoints.current.length > 1) {
        for (let i = 0; i < trailPoints.current.length - 1; i++) {
          const point = trailPoints.current[i];
          const next = trailPoints.current[i + 1];
          const progress = i / (trailPoints.current.length - 1);
          const opacity =
            (1 - progress) * 0.55 * (1 - point.age / TRAIL_MAX_AGE);

          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(next.x, next.y);
          ctx.strokeStyle = `rgba(242, 240, 236, ${opacity})`;
          ctx.lineWidth = 0.8;
          ctx.lineCap = "round";
          ctx.stroke();
        }
      }

      shapes.current.forEach((shape) => {
        shape.age++;
        shape.rotation += shape.rotationSpeed;

        const lifeRatio = shape.age / shape.maxAge;
        const opacity =
          lifeRatio < 0.15 ? (lifeRatio / 0.15) * 0.7 : (1 - lifeRatio) * 0.7;

        ctx.save();
        ctx.translate(shape.x, shape.y);
        ctx.rotate(shape.rotation);
        ctx.globalAlpha = opacity;

        const colorValue = getComputedStyle(document.documentElement)
          .getPropertyValue(shape.color.replace("var(", "").replace(")", ""))
          .trim();

        ctx.strokeStyle = colorValue || "#e63329";
        ctx.lineWidth = 1.2;

        if (shape.type === "square") {
          const half = shape.size / 2;
          ctx.strokeRect(-half, -half, shape.size, shape.size);
        } else if (shape.type === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          drawTriangle(ctx, 0, 0, shape.size);
          ctx.stroke();
        }

        ctx.restore();
      });

      shapes.current = shapes.current.filter((s) => s.age < s.maxAge);

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameId.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}
