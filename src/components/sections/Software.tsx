"use client";

import { motion } from "motion/react";
import { SectionHeading } from "./SectionHeading";
import { ACCENT } from "@/lib/accent";
import { STACK_LAYERS, STACK_NODES } from "@/lib/content";
import { cn } from "@/lib/utils";

// Node centres in a 0..100 viewBox: 2 columns (x 30/70), 4 rows.
const COL = [30, 70];
const ROW = [12, 37, 62, 87];

function nodePoints() {
  return STACK_NODES.map((n, i) => ({ ...n, x: COL[i % 2], y: ROW[n.layer] }));
}

export function Software() {
  const nodes = nodePoints();
  // Fully connect each layer to the next.
  const edges: { x1: number; y1: number; x2: number; y2: number; i: number }[] = [];
  for (let layer = 0; layer < 3; layer++) {
    const from = nodes.filter((n) => n.layer === layer);
    const to = nodes.filter((n) => n.layer === layer + 1);
    from.forEach((f) =>
      to.forEach((t) =>
        edges.push({ x1: f.x, y1: f.y + 4, x2: t.x, y2: t.y - 4, i: edges.length }),
      ),
    );
  }

  return (
    <section
      id="software"
      className="relative z-10 w-full px-6 py-28 md:px-12"
    >
      <SectionHeading
        index="10"
        eyebrow="Software Stack"
        accent="pink"
        title={<>A modular stack.</>}
        sub="Python services on ROS drive the control layer; a URDF describes the robot for both simulation and visualization. Each layer is independent, so kinematics, sensing and perception can evolve on their own."
      />

      <div className="relative mx-auto mt-16 grid max-w-3xl grid-cols-[auto_1fr] gap-x-6">
        {/* Layer labels */}
        <div className="grid" style={{ gridTemplateRows: "repeat(4, 1fr)" }}>
          {STACK_LAYERS.map((l) => (
            <div key={l} className="flex items-center">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-2">
                {l}
              </span>
            </div>
          ))}
        </div>

        {/* Graph */}
        <div className="relative aspect-[4/5] w-full">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            {edges.map((e) => (
              <line
                key={e.i}
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                stroke="url(#edge)"
                strokeWidth={0.4}
                vectorEffect="non-scaling-stroke"
                style={{
                  animation: `pulse-line 2.4s ease-in-out ${e.i * 0.18}s infinite`,
                }}
              />
            ))}
            <defs>
              <linearGradient id="edge" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffa53d" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#f0400c" stopOpacity="0.5" />
              </linearGradient>
            </defs>
          </svg>

          {nodes.map((n, i) => {
            const a = ACCENT[n.accent];
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${n.x}%`, top: `${n.y}%` }}
              >
                <div
                  className={cn(
                    "glass flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:border-line-strong",
                    n.planned ? "border-dashed border-line-strong" : "border-line",
                  )}
                >
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", a.bg)}
                    style={n.planned ? { opacity: 0.5 } : undefined}
                  />
                  <span
                    className={cn(
                      "whitespace-nowrap font-mono text-[11px]",
                      n.planned ? "text-text-dim" : "text-text",
                    )}
                  >
                    {n.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
