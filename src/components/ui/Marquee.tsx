"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/lib/store";

/**
 * A technical ticker that runs between sections.
 *
 * Two purposes. It breaks the rhythm — without something horizontal between
 * them, a run of centred panels reads as one long undifferentiated column. And
 * it reacts: the strip's speed and direction follow the scroll, so the page has
 * a component that is visibly driven by the reader rather than by a timer.
 */
export function Marquee({
  items,
  className = "",
}: {
  items: string[];
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const offset = useRef(0);

  // Duplicated twice so the loop has a seamless wrap point.
  const run = [...items, ...items];

  // Plain rAF — this lives in the DOM, outside the R3F canvas, so it cannot
  // use useFrame.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const el = track.current;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (el) {
        const { scrollVel } = useApp.getState();
        // Constant drift, plus a push from the scroll — flick the page and the
        // ticker surges, then settles back to its idle crawl.
        offset.current -= (28 + scrollVel * 420) * dt;

        // Wrap at half the track, which is exactly one full copy of `items`.
        const half = el.scrollWidth / 2;
        if (half > 0) {
          if (offset.current <= -half) offset.current += half;
          if (offset.current > 0) offset.current -= half;
        }
        el.style.transform = `translate3d(${offset.current}px,0,0)`;
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`pointer-events-none relative w-full overflow-hidden border-y border-line py-3 ${className}`}
      aria-hidden="true"
    >
      <div ref={track} className="flex w-max gap-10 will-change-transform">
        {run.map((item, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center gap-10 font-mono text-[11px] uppercase tracking-[0.24em] text-text-faint"
          >
            {item}
            <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
          </span>
        ))}
      </div>
    </div>
  );
}
