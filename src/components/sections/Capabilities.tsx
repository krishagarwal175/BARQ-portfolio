"use client";

import { motion } from "motion/react";
import { SectionHeading } from "./SectionHeading";
import { CAPABILITIES_NOW, ROADMAP } from "@/lib/content";

/**
 * An honest split of the project's state: capabilities implemented today versus
 * the roadmap of future milestones. The two columns are visually distinct so a
 * visitor never mistakes a planned feature for a shipped one.
 */
export function Capabilities() {
  return (
    <section id="capabilities" className="relative z-10 w-full px-6 py-28 md:px-12">
      <SectionHeading
        index="11"
        eyebrow="Capabilities & Roadmap"
        accent="emerald"
        title={<>What works today. What comes next.</>}
        sub="This platform is a work in progress. Everything on the left runs on the robot now; everything on the right is planned engineering, stated as such."
      />

      <div className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-2">
        {/* Now */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass glass-sm border-[var(--accent)]/40 p-6"
        >
          <div className="mb-5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--glow)]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
              Available now
            </span>
          </div>
          <ul className="space-y-3">
            {CAPABILITIES_NOW.map((c) => (
              <li key={c} className="flex items-center gap-3 text-sm text-text">
                <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0" fill="none">
                  <path
                    d="M2 7.5 5.5 11 12 3.5"
                    stroke="var(--accent)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {c}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Planned */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="glass glass-sm border-dashed border-line-strong p-6"
        >
          <div className="mb-5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full border border-line-strong" />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-text-dim">
              On the roadmap
            </span>
          </div>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {ROADMAP.map((c) => (
              <li key={c} className="flex items-center gap-3 text-sm text-text-dim">
                <span className="h-px w-3 shrink-0 bg-line-strong" />
                {c}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
