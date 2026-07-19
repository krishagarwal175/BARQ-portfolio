"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Bespoke cursor: a precise ring that trails a soft glow and swells over
 * interactive elements. Hidden on touch devices (body falls back to auto).
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(true);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const ringPos = { ...pos };
    let raf = 0;

    const move = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      setHidden(false);
      const el = e.target as HTMLElement;
      setActive(!!el.closest("a,button,[data-cursor]"));
    };

    const loop = () => {
      ringPos.x += (pos.x - ringPos.x) * 0.18;
      ringPos.y += (pos.y - ringPos.y) * 0.18;
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px,${pos.y}px,0)`;
      if (ring.current)
        ring.current.style.transform = `translate3d(${ringPos.x}px,${ringPos.y}px,0)`;
      if (glow.current)
        glow.current.style.transform = `translate3d(${ringPos.x}px,${ringPos.y}px,0)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", () => setActive(true));
    window.addEventListener("pointerup", () => setActive(false));
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]" style={{ opacity: hidden ? 0 : 1 }}>
      {/* Soft environment-tinted glow trailing the cursor. */}
      <div
        ref={glow}
        className="absolute -left-16 -top-16 h-32 w-32 rounded-full opacity-40 blur-2xl"
        style={{ background: "radial-gradient(circle, var(--glow), transparent 70%)" }}
      />
      <div
        ref={ring}
        className="absolute -left-4 -top-4 h-8 w-8 rounded-full border transition-[width,height,border-color] duration-300"
        style={{
          borderColor: active ? "var(--accent)" : "var(--border-strong)",
          width: active ? 44 : 32,
          height: active ? 44 : 32,
          marginLeft: active ? -6 : 0,
          marginTop: active ? -6 : 0,
        }}
      />
      <div
        ref={dot}
        className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 rounded-full"
        style={{ background: active ? "var(--accent)" : "var(--text)" }}
      />
    </div>
  );
}
