"use client";

import { AnimatePresence, motion } from "motion/react";
import { CountUp } from "@/components/ui/CountUp";
import { POSE_MAP } from "@/lib/robot-config";
import { useApp } from "@/lib/store";

/**
 * Live technical readout for the selected pose. Values animate into place when
 * the pose changes, reinforcing the feeling of commanding a real machine.
 */
export function PoseInfoPanel() {
  const motionMode = useApp((s) => s.motion);
  const labActive = useApp((s) => s.labActive);
  const def = labActive && motionMode.kind === "pose" ? POSE_MAP[motionMode.id] : undefined;

  return (
    <AnimatePresence mode="wait">
      {def && (
        <motion.aside
          key={def.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="glass pointer-events-none fixed left-6 top-24 z-40 hidden w-72 p-5 md:left-12 md:block"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--accent)]">
              Pose · Active
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--glow)]" />
          </div>
          <h3 className="mt-2 font-display text-xl font-medium tracking-tight text-text">
            {def.label}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-text-dim">{def.info.description}</p>

          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
            <Metric label="Joints set" value={<CountUp value={Object.keys(def.pose).length} />} />
            <Metric label="Total DOF" value={<CountUp value={12} />} />
            <Metric label="Legs" value={<CountUp value={4} />} />
            <Metric label="Settle" value={<><CountUp value={def.duration ?? 0.8} decimals={1} /> s</>} />
          </dl>

          <div className="mt-4 space-y-2 font-mono text-[10px] uppercase tracking-widest">
            <Row k="Purpose" v={def.info.purpose} />
            <Row k="C.O.G." v={def.info.cog} />
            <Row k="Control" v="Inverse kinematics" />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-[var(--surface)] p-3">
      <dt className="font-mono text-[9px] uppercase tracking-widest text-text-faint">{label}</dt>
      <dd className="mt-1 font-display text-base text-text">{value}</dd>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-faint">{k}</span>
      <span className="text-text-dim">{v}</span>
    </div>
  );
}
