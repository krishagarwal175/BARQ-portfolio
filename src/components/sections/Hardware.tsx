"use client";

import { motion } from "motion/react";
import { SectionHeading } from "./SectionHeading";
import { TiltCard } from "@/components/ui/TiltCard";
import { ACCENT } from "@/lib/accent";
import { HARDWARE } from "@/lib/content";
import { cn } from "@/lib/utils";

const spanClass = {
  sm: "md:col-span-1",
  md: "md:col-span-2",
  lg: "md:col-span-3",
} as const;

export function Hardware() {
  return (
    <section
      id="hardware"
      className="relative z-10 min-h-screen w-full px-6 py-28 md:px-12"
    >
      <SectionHeading
        index="09"
        eyebrow="Hardware"
        accent="cyan"
        title={<>Every subsystem, integrated.</>}
        sub="Compute, actuation, power and sensing — real components wired together on a custom platform. 'Integrated' runs today; 'Ready' is on-board with its software still in development."
      />

      <div className="mx-auto mt-14 grid max-w-6xl auto-rows-[minmax(140px,auto)] grid-cols-1 gap-4 md:grid-cols-4">
        {HARDWARE.map((card, i) => {
          const a = ACCENT[card.accent];
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.7, delay: (i % 4) * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className={cn(spanClass[card.span], card.span === "lg" && "md:row-span-1")}
            >
              <TiltCard glow={a.hex} className="h-full">
                <div className="flex h-full flex-col justify-between gap-6">
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        "font-mono text-[10px] uppercase tracking-[0.3em]",
                        a.text,
                      )}
                    >
                      {card.title}
                    </span>
                    <span
                      className={cn(
                        "rounded border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest",
                        card.status === "integrated"
                          ? "border-line-strong text-text-dim"
                          : "border-dashed border-line-strong text-text-faint",
                      )}
                    >
                      {card.status === "integrated" ? "Integrated" : "Ready"}
                    </span>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-medium tracking-tight text-text md:text-3xl">
                      {card.spec}
                    </p>
                    <p className="mt-2 max-w-xs text-sm leading-relaxed text-text-dim">
                      {card.detail}
                    </p>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
