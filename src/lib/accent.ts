import type { Accent } from "@/lib/content";

/** Tailwind class fragments keyed by accent, for consistent theming. */
export const ACCENT = {
  cyan: {
    text: "text-cyan",
    border: "border-cyan/50",
    bg: "bg-cyan",
    glow: "shadow-[0_0_40px_-8px_var(--color-cyan)]",
    hex: "#ffa53d",
  },
  emerald: {
    text: "text-emerald",
    border: "border-emerald/50",
    bg: "bg-emerald",
    glow: "shadow-[0_0_40px_-8px_var(--color-emerald)]",
    hex: "#ff8a20",
  },
  pink: {
    text: "text-pink",
    border: "border-pink/50",
    bg: "bg-pink",
    glow: "shadow-[0_0_40px_-8px_var(--color-pink)]",
    hex: "#f0400c",
  },
} as const satisfies Record<Accent, unknown>;
