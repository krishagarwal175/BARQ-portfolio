"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "motion/react";
import { SectionHeading } from "./SectionHeading";
import { useSection } from "@/hooks/useSection";
import { ACCENT } from "@/lib/accent";
import { PARTS } from "@/lib/robot-config";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * The technical teardown. As the pinned section scrolls, the robot explodes
 * apart and reassembles (reversible). Each part row highlights its component
 * and reveals an engineering spec sheet on hover.
 */
export function Exploded() {
  const secRef = useSection<HTMLElement>(4);
  const trackRef = useRef<HTMLDivElement>(null);
  const setExploded = useApp((s) => s.setExploded);
  const hovered = useApp((s) => s.hoveredPart);
  const setHovered = useApp((s) => s.setHoveredPart);
  const labActive = useApp((s) => s.labActive);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  // Explode in over the first third, hold, reassemble over the last third.
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const e = p < 0.4 ? p / 0.4 : p > 0.75 ? Math.max(0, (1 - p) / 0.25) : 1;
    setExploded(Math.min(1, e));
  });

  useEffect(() => () => setExploded(0), [setExploded]);

  return (
    /* Snaps to the top of the pinned track — the start of the explode,
       which is the only meaningful resting point on a scrubbed section. */
    <section id="teardown" ref={secRef} data-snap>
      <div ref={trackRef} className="relative h-[280svh] w-full">
        {/* Pinned viewport. The track runs 280svh, so the tail of this sticky
            panel is still on screen when the Lab's IntersectionObserver fires
            and mounts the pose readout in the same top-left corner. Clearing
            it on labActive is what stops the two card stacks overlapping. */}
        <div
          className={cn(
            "sticky top-0 flex h-[100svh] w-full items-center overflow-hidden transition-opacity duration-500",
            labActive && "pointer-events-none opacity-0",
          )}
        >
          <div className="pointer-events-none w-full px-6 md:px-12">
            <SectionHeading
              index="04"
              eyebrow="Teardown"
              accent="pink"
              title={<>Exploded.</>}
              sub="Scroll to pull BARQ apart, component by component. Hover any part for its engineering spec."
              className="pointer-events-none max-w-sm"
            />

            {/* Part list */}
            <div className="pointer-events-auto mt-10 max-w-sm space-y-px">
              {PARTS.map((part) => {
                const a = ACCENT[part.accent];
                const active = hovered === part.id;
                return (
                  <div
                    key={part.id}
                    data-cursor
                    onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(part.id)}
                    onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(null)}
                    onClick={() => setHovered(active ? null : part.id)}
                    className={cn(
                      "group relative flex items-center justify-between rounded-lg border px-4 py-3.5 transition-colors",
                      active ? cn(a.border, "bg-white/[0.03]") : "border-transparent hover:border-line",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn("h-1.5 w-1.5 rounded-full", a.bg)} />
                      <div>
                        <p className="text-sm text-text">{part.name}</p>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-text-faint">
                          {part.category}
                        </p>
                      </div>
                    </div>
                    <span className={cn("font-mono text-[10px] uppercase tracking-widest", a.text)}>
                      {String(PARTS.indexOf(part) + 1).padStart(2, "0")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Floating spec card for the hovered part */}
          <SpecCard />
        </div>
      </div>
    </section>
  );
}

function SpecCard() {
  const hovered = useApp((s) => s.hoveredPart);
  const part = PARTS.find((p) => p.id === hovered);

  return (
    <AnimatePresence>
      {part && (
        <motion.aside
          key={part.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="glass pointer-events-none fixed inset-x-3 bottom-3 z-30 p-5 md:absolute md:inset-x-auto md:bottom-auto md:right-12 md:top-1/2 md:w-72 md:-translate-y-1/2 md:p-6"
        >
          <p
            className={cn(
              "font-mono text-[10px] uppercase tracking-[0.3em]",
              ACCENT[part.accent].text,
            )}
          >
            {part.category}
          </p>
          <h3 className="mt-2 font-display text-xl font-medium tracking-tight text-text">
            {part.name}
          </h3>
          <p className="mt-3 text-xs leading-relaxed text-text-dim">{part.description}</p>
          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
            {part.specs.map((s) => (
              <div key={s.label} className="bg-[var(--surface)] p-3">
                <dt className="font-mono text-[9px] uppercase tracking-widest text-text-faint">
                  {s.label}
                </dt>
                <dd className="mt-1 font-mono text-xs text-text">{s.value}</dd>
              </div>
            ))}
          </dl>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
