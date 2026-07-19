"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/lib/store";

/**
 * The reference half of the page.
 *
 * Everything up to the lab is a 3D narrative: the robot is the subject and the
 * panels float over it. Everything after it is documentation — hardware,
 * software, capabilities — and documentation wants a floor. Left over the live
 * scene those sections read as cards hanging in mid-air with nothing holding
 * them, because there genuinely is nothing behind them.
 *
 * So this block lays down a solid ground and scrolls over the fixed canvas.
 * The transition is deliberate rather than abrupt: a tall gradient at the top
 * edge fades the scene out, so the page reads as *arriving somewhere* instead
 * of the render being switched off.
 *
 * A sentinel at the very top reports when the block has covered the viewport,
 * which lets the canvas stop rendering entirely — the scene is occluded, so
 * every frame it draws from here down is wasted work.
 */
export function Reference({ children }: { children: React.ReactNode }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const setSceneVisible = useApp((s) => s.setSceneVisible);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([e]) => {
        // Once the sentinel has left through the top, the solid ground fills
        // the viewport and nothing of the canvas can be seen.
        const covered = !e.isIntersecting && e.boundingClientRect.top < 0;
        setSceneVisible(!covered);
      },
      { threshold: 0 },
    );

    io.observe(el);
    return () => {
      io.disconnect();
      setSceneVisible(true);
    };
  }, [setSceneVisible]);

  return (
    <div className="relative z-10">
      {/* The dissolve is its own strip, carrying the *same* fixed background
          as the ground below it and masking only its own alpha in. Two things
          this gets right that the previous attempts did not: because both
          share background-attachment: fixed the gradient is continuous across
          the join, so there is no seam; and because the mask is on an empty
          strip rather than on the ground itself, it cannot fade the content —
          masking the ground dissolved the heading and the list along with it,
          which is what let the robot ghost through the copy. */}
      <div aria-hidden="true" className="reference-ground reference-ground--intro" />
      <div ref={sentinel} className="h-px w-full" />
      <div className="reference-ground">{children}</div>
    </div>
  );
}
