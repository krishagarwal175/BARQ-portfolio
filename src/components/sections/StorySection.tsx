"use client";

import { motion } from "motion/react";
import { useSection } from "@/hooks/useSection";
import { cn } from "@/lib/utils";

export interface StoryStat {
  label: string;
  value: string;
}

interface StorySectionProps {
  index: number;
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  stats?: StoryStat[];
  align?: "left" | "right";
  accent?: "cyan" | "emerald" | "pink";
}

const accentColor = {
  cyan: "text-cyan",
  emerald: "text-emerald",
  pink: "text-pink",
} as const;

/**
 * A scroll chapter. The fixed 3D robot stays centred while this text panel
 * slides through; entering it repositions the storytelling camera.
 */
export function StorySection({
  index,
  eyebrow,
  title,
  body,
  stats,
  align = "left",
  accent = "cyan",
}: StorySectionProps) {
  const ref = useSection<HTMLElement>(index);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] w-full items-center px-6 md:px-12"
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-30% 0px -30% 0px" }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "max-w-lg",
          align === "right" && "ml-auto text-right",
        )}
      >
        <p
          className={cn(
            "mb-5 font-mono text-xs uppercase tracking-[0.4em]",
            accentColor[accent],
          )}
        >
          {String(index).padStart(2, "0")} · {eyebrow}
        </p>
        <h2 className="font-display text-4xl font-medium leading-[0.95] tracking-tight text-text md:text-6xl">
          {title}
        </h2>
        <p className="mt-6 text-balance text-sm leading-relaxed text-text-dim md:text-base">
          {body}
        </p>

        {stats && (
          <dl
            className={cn(
              "mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4",
            )}
          >
            {stats.map((s) => (
              <div key={s.label} className="bg-bg-secondary p-4">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-text-faint">
                  {s.label}
                </dt>
                <dd className="mt-1 font-display text-lg text-text">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </motion.div>
    </section>
  );
}
