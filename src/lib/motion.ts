import type { Transition, Variants } from "motion/react";

/**
 * The site's motion vocabulary.
 *
 * Every animated element on the page pulls its easing and timing from here.
 * That is what stops a page full of effects from reading as a pile of
 * unrelated tricks: sections differ in *what* moves, never in *how* it moves.
 * One curve, three speeds, one stagger rhythm.
 */

/** The single easing curve. Fast out, long settle — everything uses it. */
export const EASE = [0.16, 1, 0.3, 1] as const;

/** Three durations. Nothing on the page animates at any other speed. */
export const DUR = {
  /** Hovers, toggles, state flips. */
  quick: 0.32,
  /** The default: panels, cards, most reveals. */
  base: 0.85,
  /** Headline entrances and anything that should feel weighty. */
  long: 1.25,
} as const;

export const T = {
  quick: { duration: DUR.quick, ease: EASE } satisfies Transition,
  base: { duration: DUR.base, ease: EASE } satisfies Transition,
  long: { duration: DUR.long, ease: EASE } satisfies Transition,
};

/** Shared viewport trigger. once:true — reveals settle and stay settled. */
export const VIEW = { once: true, margin: "-12% 0px -12% 0px" } as const;

/**
 * Rise into place, defocusing as it goes. `from` lets a panel enter from the
 * side its content occupies, so movement always has a direction that means
 * something rather than everything sliding up.
 */
export function rise(from: "up" | "left" | "right" = "up", distance = 44): Variants {
  const offset =
    from === "left" ? { x: -distance, y: 0 } : from === "right" ? { x: distance, y: 0 } : { x: 0, y: distance };
  return {
    hidden: { opacity: 0, ...offset, filter: "blur(12px)" },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: "blur(0px)",
      transition: T.base,
    },
  };
}

/** Container that releases its children in sequence. */
export function stagger(each = 0.06, delay = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: each, delayChildren: delay } },
  };
}

/** A single word inside a split headline. */
export const WORD: Variants = {
  hidden: { opacity: 0, y: "0.72em", filter: "blur(8px)" },
  show: { opacity: 1, y: "0em", filter: "blur(0px)", transition: T.long },
};
