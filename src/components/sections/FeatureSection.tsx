"use client";

import { motion } from "motion/react";
import { SplitText } from "@/components/ui/SplitText";
import { useSection } from "@/hooks/useSection";
import { T, VIEW } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A feature chapter laid out as a frosted side column against the live scene.
 *
 * The column is deliberately *not* a card. A card floating in the middle of the
 * frame competes with the robot for the same space; a full-height column claims
 * one edge, leaves the rest of the frame to the machine, and can never overlap
 * anything. Its inner edge is dissolved with a mask so it bleeds into the scene
 * instead of ending on a hard border.
 *
 * Reading order runs top to bottom: what this is, why it matters, then the
 * claim — set large and anchored to the floor of the column so every chapter
 * lands on a statement in the same place.
 */
export interface FeatureSectionProps {
  index: number;
  /** Small uppercase label above the body copy. */
  eyebrow: string;
  body: string;
  /** The large claim at the foot of the column. "\n" forces a line break. */
  statement: string;
  /** Inline SVG glyph for the icon disc. */
  icon: React.ReactNode;
  /** Technical annotation, bottom right of the frame. */
  note?: { caption: string; formula: React.ReactNode };
  side?: "left" | "right";
  /** Off for chapters that live inside a scrubbed track (see Thermal). */
  snap?: boolean;
}

export function FeatureSection({
  index,
  eyebrow,
  body,
  statement,
  icon,
  note,
  side = "left",
  snap = true,
}: FeatureSectionProps) {
  // Column on the left pushes the robot right, and vice versa.
  const ref = useSection<HTMLElement>(index, side === "left" ? 1 : -1);

  return (
    <section
      ref={ref}
      {...(snap ? { "data-snap": "" } : {})}
      className="pointer-events-none relative flex h-[100svh] w-full items-stretch"
    >
      <motion.div
        initial={{ opacity: 0, x: side === "left" ? -40 : 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={VIEW}
        transition={T.base}
        className={cn(
          "feature-col pointer-events-auto relative flex h-full w-[min(34rem,42vw)] flex-col justify-between px-8 py-24 md:px-14 md:py-28",
          side === "right" && "ml-auto feature-col--right",
        )}
      >
        <div>
          {/* Icon disc — the only round object in the column. */}
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={VIEW}
            transition={T.base}
            className="mb-10 flex h-12 w-12 items-center justify-center rounded-full border border-line bg-[var(--hover)] text-text-2 backdrop-blur-md"
          >
            {icon}
          </motion.span>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEW}
            transition={{ ...T.base, delay: 0.08 }}
            className="mb-5 text-[0.82rem] font-bold uppercase tracking-[0.1em] text-text"
          >
            {eyebrow}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEW}
            transition={{ ...T.base, delay: 0.14 }}
            className="max-w-[34ch] text-[1.02rem] font-medium leading-[1.62] text-text-2"
          >
            {body}
          </motion.p>
        </div>

        <div>
          {/* Dotted rule — the drafting language, carried through. */}
          <motion.span
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={VIEW}
            transition={{ ...T.long, delay: 0.1 }}
            className="mb-10 block h-px w-full origin-left border-t border-dashed border-line-strong"
          />
          <SplitText
            as="h2"
            delay={0.18}
            className="font-display text-[clamp(1.9rem,3.2vw,2.7rem)] font-extrabold uppercase leading-[1.06] tracking-[-0.01em] text-text"
          >
            {statement}
          </SplitText>
        </div>
      </motion.div>

      {/* Technical annotation, bottom right. */}
      {note && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEW}
          transition={{ ...T.base, delay: 0.3 }}
          className="pointer-events-none absolute bottom-10 right-8 flex items-center gap-6 md:right-14"
        >
          <span className="max-w-[22rem] text-right font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-text-2">
            {note.caption}
          </span>
          <span className="font-display text-2xl text-text md:text-3xl">{note.formula}</span>
        </motion.div>
      )}
    </section>
  );
}
