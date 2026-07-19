"use client";

import { SectionHeading } from "./SectionHeading";
import { SpecCard } from "@/components/ui/SpecCard";
import { ACCENT } from "@/lib/accent";
import { HIGHLIGHTS } from "@/lib/content";

/**
 * The platform's defining traits — each card names a capability and, more
 * importantly, why it exists. No specs, no claims: engineering rationale.
 */
export function Highlights() {
  return (
    <section
      id="highlights"
      data-snap
      className="relative z-10 w-full px-6 py-28 md:px-12"
    >
      <SectionHeading
        index="08"
        eyebrow="Technical Highlights"
        accent="pink"
        title={<>Why it’s built the way it is.</>}
        sub="Twelve deliberate decisions — from the URDF single-source-of-truth to real hardware validation."
      />

      <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {HIGHLIGHTS.map((h, i) => (
          <SpecCard
            key={h.id}
            index={String(i + 1).padStart(2, "0")}
            title={h.title}
            body={h.why}
            accentClass={ACCENT[h.accent].bg}
            // Diagonal cascade: row and column both push the delay, so the
            // grid resolves from the top-left corner outward instead of
            // twelve cards arriving at once.
            delay={((i % 3) + Math.floor(i / 3)) * 0.06}
          />
        ))}
      </div>
    </section>
  );
}
