"use client";

import { motion } from "motion/react";
import { useApp } from "@/lib/store";
import { useSection } from "@/hooks/useSection";

const reveal = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.09, duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

/**
 * The opening screen. The headline itself is not here — it is the BARQ
 * wordmark rendered behind the canvas by {@link HeroWordmark}, so the robot
 * can float in front of it. What remains is the framing: corner labels, the
 * standfirst, and the scroll cue.
 */
export function Hero() {
  const ref = useSection<HTMLElement>(0);
  const booted = useApp((s) => s.booted);
  const anim = booted ? "show" : "hidden";

  return (
    <section
      ref={ref}
      data-snap
      /* pt clears the fixed nav pill, which overlaps the top of the viewport. */
      className="pointer-events-none relative flex h-[100svh] w-full flex-col justify-between px-6 pb-7 pt-24 md:px-12 md:pb-9 md:pt-28"
    >
      {/* The visible headline is painted in the canvas, which is invisible to
          assistive tech and crawlers — so the real <h1> lives here. */}
      <h1 className="sr-only">BARQ — Quadruped Robotics</h1>

      {/* Corner labels — the drafting-sheet framing around the subject. */}
      <div className="flex items-start justify-between font-mono text-[10px] uppercase tracking-[0.28em] text-text-faint">
        <motion.span variants={reveal} custom={0} initial="hidden" animate={anim}>
          01 — Quadruped Platform
        </motion.span>
        <motion.span
          variants={reveal}
          custom={1}
          initial="hidden"
          animate={anim}
          className="hidden text-right md:block"
        >
          12 DOF · 4 legs
          <br />
          Custom-built platform
        </motion.span>
      </div>

      <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
        {/* Standfirst, kept small so the wordmark stays the loudest thing. */}
        <motion.div
          variants={reveal}
          custom={2}
          initial="hidden"
          animate={anim}
          className="glass glass-sm pointer-events-auto max-w-sm p-5 md:p-6"
        >
          <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-text-faint">
            Unit 01 · in development
          </p>
          <p className="text-[0.98rem] font-light leading-[1.6] text-text-2">
            A custom quadruped, engineered from scratch — mechanical design,
            electronics, kinematics and software. Not a kit, not a commercial
            robot.
          </p>
        </motion.div>

        {/* Scroll cue. */}
        <motion.a
          href="#teardown"
          data-cursor
          variants={reveal}
          custom={3}
          initial="hidden"
          animate={anim}
          className="glass glass-pill pointer-events-auto flex w-fit items-center gap-3 py-2 pl-2 pr-5 transition-colors hover:border-line-strong md:self-end"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-text-2">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
              <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-text-2">
            Scroll to continue
          </span>
        </motion.a>
      </div>
    </section>
  );
}
