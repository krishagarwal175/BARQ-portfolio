"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import { EASE, T, VIEW } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A spec card built like a drawing rather than a box.
 *
 * Three things carry it. Registration marks sit at the corners instead of a
 * continuous border, so the card reads as a plate on a technical sheet — the
 * same drafting language as the guides behind the hero. A spotlight tracks the
 * pointer across the surface, which makes a static grid feel responsive
 * without any per-card state. And the top hairline wipes in on reveal, so the
 * card draws itself instead of fading up.
 *
 * The pointer position is written straight to CSS custom properties on the
 * element. Routing it through React state would re-render the whole grid on
 * every mousemove.
 */
export function SpecCard({
  index,
  label,
  title,
  body,
  accentClass = "bg-[var(--accent)]",
  delay = 0,
  className,
}: {
  index?: string;
  label?: string;
  title: string;
  body: string;
  accentClass?: string;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const track = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={track}
      initial={{ opacity: 0, y: 26, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={VIEW}
      transition={{ ...T.base, delay }}
      className={cn("spec-card glass glass-sm group relative overflow-hidden p-5", className)}
    >
      {/* Pointer spotlight. */}
      <span aria-hidden="true" className="spec-card__glow" />

      {/* Corner registration marks. */}
      <span aria-hidden="true" className="spec-card__mark spec-card__mark--tl" />
      <span aria-hidden="true" className="spec-card__mark spec-card__mark--br" />

      {/* Hairline that wipes in along the top edge. */}
      <motion.span
        aria-hidden="true"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={VIEW}
        transition={{ duration: 0.9, delay: delay + 0.12, ease: EASE }}
        className="absolute inset-x-0 top-0 h-px origin-left bg-gradient-to-r from-[var(--accent)] via-[var(--border-strong)] to-transparent"
      />

      <div className="relative flex items-center gap-2">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", accentClass)} />
        {label && (
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-faint">
            {label}
          </span>
        )}
        {index && (
          <span className="ml-auto font-mono text-[10px] tracking-[0.2em] text-text-faint">
            {index}
          </span>
        )}
      </div>

      <h3 className="relative mt-2.5 font-display text-base font-semibold tracking-[-0.01em] text-text">
        {title}
      </h3>
      <p className="relative mt-2 text-sm font-light leading-relaxed text-text-dim">{body}</p>
    </motion.div>
  );
}
