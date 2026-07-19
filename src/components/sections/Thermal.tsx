"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { FeatureSection } from "./FeatureSection";
import { useApp } from "@/lib/store";
import { T, VIEW } from "@/lib/motion";

/** Scale stops, hottest first — they read top-down like a real IR readout. */
const STOPS = [
  { label: "Stall", value: "68 °C", tone: "#fffac6" },
  { label: "Load", value: "54 °C", tone: "#ff9412" },
  { label: "Nominal", value: "41 °C", tone: "#db3361" },
  { label: "Idle", value: "29 °C", tone: "#6b1285" },
];

/**
 * The thermal chapter. Scrolling through it brings an IR camera up over the
 * whole scene, so the section is not describing servo heat — it is showing it.
 *
 * The camera amount is driven from scroll progress rather than a viewport
 * boolean, so the instrument fades in and back out across the section instead
 * of snapping on. It is cleared on unmount, otherwise scrolling away mid-fade
 * would leave the rest of the page in false colour.
 */
export function Thermal() {
  const trackRef = useRef<HTMLDivElement>(null);
  const setThermal = useApp((s) => s.setThermal);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start end", "end start"],
  });

  const labActive = useApp((s) => s.labActive);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    // The lab claims the screen at 60% intersection, which lands around p≈0.85
    // — so a fade that only finished at p=1 still had the robot half in false
    // colour while the lab console was fading in. The camera has to be back to
    // visible light *before* the lab arrives, not while it is arriving, so the
    // ramp down now completes with room to spare.
    const v = p < 0.33 ? p / 0.33 : p > 0.60 ? Math.max(0, (0.80 - p) / 0.20) : 1;
    setThermal(labActive ? 0 : Math.min(1, Math.max(0, v)));
  });

  // Hard guarantee, independent of the ramp above: the lab is never viewed
  // through the IR camera. Scroll events stop firing once a snap settles, so
  // without this a fast snap could leave the pass part-way up.
  useEffect(() => {
    if (labActive) setThermal(0);
  }, [labActive, setThermal]);

  useEffect(() => () => setThermal(0), [setThermal]);

  return (
    <div ref={trackRef} className="relative">
      <FeatureSection
        index={5}
        eyebrow="Handles extremes with ease"
        body="Twelve digital servos under continuous load generate real heat, and heat is what limits how long a legged robot can actually walk. Duty cycle, gait choice and rest posture are thermal decisions before they are motion decisions."
        statement={"Thermodynamic\nstability"}
        icon={
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
            <path
              d="M12 3v10.5M12 3a2 2 0 0 1 2 2v8.2a4 4 0 1 1-4 0V5a2 2 0 0 1 2-2Z"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        }
        note={{
          caption: "Servo thermal model · a visualisation, not a warranty",
          formula: (
            <span className="italic">
              T<sub className="text-base not-italic">j</sub> = T
              <sub className="text-base not-italic">a</sub> + P·R
              <sub className="text-base not-italic">θ</sub>
            </span>
          ),
        }}
      />

      {/* IR scale, mirroring the instrument the camera pass is imitating. */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={VIEW}
        transition={{ ...T.base, delay: 0.25 }}
        className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 md:block"
      >
        <div className="flex items-stretch gap-3">
          <div className="flex flex-col justify-between py-1 text-right">
            {STOPS.map((s) => (
              <div key={s.label}>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text">
                  {s.label}
                </p>
                <p className="font-mono text-[10px] tracking-[0.14em] text-text-2">{s.value}</p>
              </div>
            ))}
          </div>
          {/* The ramp itself, matching the shader's inferno stops. */}
          <span
            className="w-1.5 rounded-full"
            style={{
              background:
                "linear-gradient(180deg,#fffac6 0%,#ff9412 34%,#db3361 67%,#0d0530 100%)",
              height: "clamp(12rem,26vh,18rem)",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
