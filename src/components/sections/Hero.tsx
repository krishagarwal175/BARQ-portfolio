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

export function Hero() {
  const ref = useSection<HTMLElement>(0);
  const booted = useApp((s) => s.booted);
  const anim = booted ? "show" : "hidden";

  return (
    <section
      ref={ref}
      className="relative flex h-[100svh] w-full flex-col justify-between px-6 py-8 md:px-12 md:py-10"
    >
      {/* Top meta row */}
      <div className="flex items-start justify-between font-mono text-[10px] uppercase tracking-[0.28em] text-text-dim">
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
          12 DOF · 3.6 kg
          <br />
          BLDC direct-drive
        </motion.span>
      </div>

      {/* Hero title block */}
      <div className="max-w-5xl">
        <motion.p
          variants={reveal}
          custom={1}
          initial="hidden"
          animate={anim}
          className="mb-4 font-mono text-xs uppercase tracking-[0.4em] text-cyan"
        >
          Krish Agarwal
        </motion.p>
        <motion.h1
          variants={reveal}
          custom={2}
          initial="hidden"
          animate={anim}
          className="font-display text-[15vw] font-semibold leading-[0.85] tracking-tight text-text md:text-[11vw]"
        >
          QUADRUPED
          <br />
          <span className="text-text-dim">ROBOTICS</span>
        </motion.h1>
        <motion.p
          variants={reveal}
          custom={3}
          initial="hidden"
          animate={anim}
          className="mt-6 max-w-md text-balance text-sm leading-relaxed text-text-dim md:text-base"
        >
          BARQ is a custom-built legged robot — an interactive teardown of its
          kinematics, actuation and control stack. Engineering motion, from
          servo to gait.
        </motion.p>
      </div>

      {/* Scroll hint */}
      <motion.div
        variants={reveal}
        custom={4}
        initial="hidden"
        animate={anim}
        className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.28em] text-text-faint"
      >
        <span className="flex items-center gap-3">
          <span className="inline-block h-8 w-px animate-[pulse-line_2s_ease-in-out_infinite] bg-line-strong" />
          Scroll to explore
        </span>
        <span className="hidden md:block">BARQ / v2.1</span>
      </motion.div>
    </section>
  );
}
