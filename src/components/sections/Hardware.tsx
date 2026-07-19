"use client";

import { motion } from "motion/react";
import { SectionHeading } from "./SectionHeading";
import { ACCENT } from "@/lib/accent";
import { HARDWARE } from "@/lib/content";
import { EASE, VIEW } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The hardware datasheet.
 *
 * This was a masonry of cards with per-item column spans (1, 2 and 3 wide) in
 * a four-column grid with auto rows — so every card was a different width and
 * height and nothing shared an edge. Read as a list of parts it was noise.
 *
 * A specification is tabular data, so it is set as a table: one row per
 * subsystem, four columns that align down the whole block — category, part,
 * what it does, and whether its software is live. Alternating row fills give
 * the eye a rail to travel along, which is the entire job of a datasheet.
 */
export function Hardware() {
  return (
    <section
      id="hardware"
      data-snap
      className="relative z-10 w-full px-6 py-28 md:px-12"
    >
      <SectionHeading
        index="09"
        eyebrow="Hardware"
        accent="cyan"
        title="Every subsystem, integrated."
        sub="Compute, actuation, power and sensing — real components wired together on a custom platform. 'Integrated' runs today; 'Ready' is on-board with its software still in development."
      />

      <div className="mx-auto mt-14 max-w-[86rem]">
        {/* Column headers, so the alignment reads as deliberate structure. */}
        <div className="hidden grid-cols-[minmax(8rem,0.9fr)_minmax(13rem,1.3fr)_minmax(0,2.8fr)_7rem] gap-x-8 px-6 pb-4 md:grid">
          {["Subsystem", "Part", "Why it is there", "Status"].map((h) => (
            <span
              key={h}
              className={cn(
                "font-mono text-[10px] uppercase tracking-[0.24em] text-text-faint",
                h === "Status" && "text-right",
              )}
            >
              {h}
            </span>
          ))}
        </div>

        <div className="border-t border-line">
          {HARDWARE.map((row, i) => {
            const a = ACCENT[row.accent];
            return (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEW}
                transition={{ duration: 0.6, delay: i * 0.05, ease: EASE }}
                className={cn(
                  "grid grid-cols-1 items-baseline gap-x-8 gap-y-2 border-b border-line px-6 py-6 transition-colors",
                  "md:grid-cols-[minmax(8rem,0.9fr)_minmax(13rem,1.3fr)_minmax(0,2.8fr)_7rem]",
                  // Alternating fill — the rail the eye follows down the table.
                  i % 2 === 0 && "bg-[var(--hover)]",
                  "hover:bg-[var(--active)]",
                )}
              >
                <span className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-text-2">
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", a.bg)} />
                  {row.title}
                </span>

                <span className="font-display text-[clamp(1.05rem,1.05vw,1.35rem)] font-semibold tracking-[-0.01em] text-text">
                  {row.spec}
                </span>

                <p className="max-w-[62ch] text-[clamp(0.9rem,0.82vw,1.05rem)] font-light leading-[1.6] text-text-dim">
                  {row.detail}
                </p>

                <span
                  className={cn(
                    "justify-self-start rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] md:justify-self-end",
                    row.status === "integrated"
                      ? "border-[color-mix(in_srgb,var(--success)_45%,transparent)] text-[var(--success)]"
                      : "border-dashed border-line-strong text-text-faint",
                  )}
                >
                  {row.status}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
