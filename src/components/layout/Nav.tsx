"use client";

import { motion } from "motion/react";
import { useApp } from "@/lib/store";

export function Nav() {
  const booted = useApp((s) => s.booted);
  const muted = useApp((s) => s.muted);
  const toggleMuted = useApp((s) => s.toggleMuted);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : -12 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="glass glass-pill fixed inset-x-3 top-3 z-50 mx-auto flex w-[min(1120px,calc(100%-1.5rem))] items-center justify-between py-2 pl-5 pr-3 md:top-4"
    >
      <a href="#top" data-cursor className="flex items-center gap-2">
        <span className="font-display text-base font-bold tracking-tight text-text">
          BARQ
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--glow)]" />
      </a>

      <nav className="hidden gap-1 md:flex">
        {[
          { href: "#teardown", label: "Teardown" },
          { href: "#lab", label: "Lab" },
          { href: "#hardware", label: "Hardware" },
        ].map((l) => (
          <a
            key={l.href}
            href={l.href}
            data-cursor
            className="rounded-full px-3.5 py-2 text-sm uppercase tracking-[0.1em] text-text-dim transition-colors hover:bg-[var(--hover)] hover:text-text"
          >
            {l.label}
          </a>
        ))}
      </nav>

      <button
        onClick={toggleMuted}
        data-cursor
        aria-label={muted ? "Unmute ambience" : "Mute ambience"}
        className="flex items-baseline gap-2 rounded-full px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim transition-colors hover:bg-[var(--hover)] hover:text-text"
      >
        {/* items-baseline puts this box's bottom edge on the text baseline (a
            flex item with no text baselines falls back to its bottom margin
            edge), so the bars stand ON the baseline and grow upward. Centring
            it instead left them sitting ~1.6px low. */}
        <span className="flex h-3 items-end gap-[2px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-[2px] bg-current"
              style={{
                height: muted ? 3 : [8, 12, 6][i],
                transition: "height .3s",
              }}
            />
          ))}
        </span>
        {muted ? "Sound off" : "Sound on"}
      </button>
    </motion.header>
  );
}
