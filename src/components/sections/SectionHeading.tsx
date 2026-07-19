"use client";

import { motion } from "motion/react";
import { SplitText } from "@/components/ui/SplitText";
import type { Accent } from "@/lib/content";
import { T, VIEW } from "@/lib/motion";
import { cn } from "@/lib/utils";

const accentDot = { cyan: "bg-cyan", emerald: "bg-emerald", pink: "bg-pink" };

/**
 * Shared eyebrow + title header used across the content sections.
 *
 * Backed by glass by default. These headings sit directly on the ambient
 * field, and the field is at its brightest — near-saturated orange — through
 * the middle of the page, so unbacked white type had almost no contrast to
 * work against. The panel gives the words a ground without boxing them in:
 * it hugs the content rather than filling the column.
 */
export function SectionHeading({
  index,
  eyebrow,
  title,
  sub,
  accent = "cyan",
  className,
  panel = true,
}: {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
  accent?: Accent;
  className?: string;
  /** Off where the heading already sits on its own backing. */
  panel?: boolean;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        panel && "glass glass-sm w-fit p-6 md:p-8",
        className,
      )}
    >
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-4 flex items-center gap-2.5 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-text-faint"
      >
        {/* Colour is carried by a mark, not the type — the ember field is the
            only saturated thing on the page. */}
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", accentDot[accent])} />
        {index} · {eyebrow}
      </motion.p>
      {/* Plain-string titles get the word-by-word reveal; the few callers that
          still pass JSX fall back to a single block move. */}
      {typeof title === "string" ? (
        <SplitText
          delay={0.05}
          className="font-display text-4xl font-medium leading-[1.08] tracking-[-0.025em] text-text md:text-[2.6rem]"
        >
          {title}
        </SplitText>
      ) : (
        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEW}
          transition={{ ...T.base, delay: 0.05 }}
          className="font-display text-4xl font-medium leading-[1.08] tracking-[-0.025em] text-text md:text-[2.6rem]"
        >
          {title}
        </motion.h2>
      )}
      {sub && (
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
          className="mt-5 max-w-xl text-balance text-[1.02rem] font-light leading-[1.55] text-text-dim"
        >
          {sub}
        </motion.p>
      )}
    </div>
  );
}
