"use client";

import { useApp } from "@/lib/store";

/** A hairline progress bar pinned to the top edge of the viewport. */
export function ScrollProgress() {
  const scroll = useApp((s) => s.scroll);
  const booted = useApp((s) => s.booted);
  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-px bg-transparent"
      style={{ opacity: booted ? 1 : 0, transition: "opacity .6s" }}
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-cyan via-emerald to-pink"
        style={{ transform: `scaleX(${scroll})` }}
      />
    </div>
  );
}
