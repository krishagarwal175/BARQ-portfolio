"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

type NativeButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd"
>;

interface MagneticButtonProps extends NativeButtonProps {
  active?: boolean;
  accent?: "cyan" | "emerald" | "pink";
  strength?: number;
}

const accentRing = {
  cyan: "border-cyan/60 text-cyan",
  emerald: "border-emerald/60 text-emerald",
  pink: "border-pink/60 text-pink",
} as const;

/**
 * A control that leans toward the cursor and settles back on a spring — the
 * tactile, physical feedback the brief asks for. Doubles as a toggle chip.
 */
export function MagneticButton({
  active = false,
  accent = "cyan",
  strength = 0.4,
  className,
  children,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.4 });

  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      data-cursor
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ x: sx, y: sy }}
      className={cn(
        "rounded-md border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
        active
          ? accentRing[accent] + " bg-white/[0.04]"
          : "border-line text-text-dim hover:border-line-strong hover:text-text",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
