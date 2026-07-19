"use client";

import { motion } from "motion/react";
import { SectionHeading } from "./SectionHeading";
import { PIPELINE } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * The engineering pipeline as an animated timeline: mechanical CAD through
 * hardware validation, ending in the clearly-marked future autonomy work. Each
 * stage draws in as it enters view.
 */
export function Pipeline() {
  return (
    <section id="pipeline" className="relative z-10 w-full px-6 py-28 md:px-12">
      <SectionHeading
        index="07"
        eyebrow="Engineering Pipeline"
        accent="cyan"
        title={<>From CAD to hardware.</>}
        sub="The path every capability takes — modelled, described, simulated, then proven on the physical robot. Autonomy is the next stage, not a current claim."
      />

      <div className="mx-auto mt-16 max-w-3xl">
        <ol className="relative border-l border-line">
          {PIPELINE.map((step, i) => (
            <motion.li
              key={step.id}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-12% 0px" }}
              transition={{ duration: 0.55, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="relative ml-6 pb-9 last:pb-0"
            >
              {/* Node */}
              <span
                className={cn(
                  "absolute -left-[31px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2",
                  step.future
                    ? "border-dashed border-line-strong bg-bg"
                    : "border-[var(--accent)] bg-bg",
                )}
              >
                {!step.future && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                )}
              </span>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-text-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3
                  className={cn(
                    "font-display text-xl font-medium tracking-tight md:text-2xl",
                    step.future ? "text-text-dim" : "text-text",
                  )}
                >
                  {step.label}
                </h3>
                {step.future && (
                  <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-text-faint">
                    Planned
                  </span>
                )}
              </div>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-text-dim">{step.note}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
