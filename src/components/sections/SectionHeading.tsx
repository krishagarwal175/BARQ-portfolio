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
 * Centred and unboxed by default. The glass panel existed only to give the
 * type contrast against the live ember field, which is at its brightest
 * through the middle of the page. In the reference half that ground is now
 * solid, so the box has nothing left to do — and a box drawn around a centred
 * heading reads as a stray card rather than a section title.
 *
 * `panel` is kept for the few headings that still sit over the live scene.
 */
export function SectionHeading({
  index,
  eyebrow,
  title,
  sub,
  accent = "cyan",
  className,
  panel = false,
  align = "center",
}: {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
  accent?: Accent;
  className?: string;
  /** On only where the heading sits over the live scene and needs contrast. */
  panel?: boolean;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "max-w-[clamp(30rem,44vw,52rem)]",
        align === "center" && "mx-auto text-center",
        panel && "glass glass-sm p-6 md:p-8 lg:p-10",
        className,
      )}
    >
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "mb-4 flex items-center gap-2.5 text-[clamp(0.78rem,0.62vw,0.95rem)] font-semibold uppercase tracking-[0.14em] text-text-faint",
          align === "center" && "justify-center",
        )}
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
          className="font-display text-[clamp(2rem,2.7vw,3.3rem)] font-medium leading-[1.08] tracking-[-0.025em] text-text"
        >
          {title}
        </SplitText>
      ) : (
        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEW}
          transition={{ ...T.base, delay: 0.05 }}
          className="font-display text-[clamp(2rem,2.7vw,3.3rem)] font-medium leading-[1.08] tracking-[-0.025em] text-text"
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
          className={cn(
            "mt-5 max-w-[46ch] text-balance text-[clamp(1rem,0.95vw,1.28rem)] font-light leading-[1.6] text-text-dim",
            align === "center" && "mx-auto",
          )}
        >
          {sub}
        </motion.p>
      )}
    </div>
  );
}
