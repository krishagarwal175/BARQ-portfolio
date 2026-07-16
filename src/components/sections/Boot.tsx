"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useApp } from "@/lib/store";

const BOOT_LINES = [
  "SYSTEM INITIALIZING",
  "servo calibration",
  "imu ready",
  "vision online",
  "kinematics loaded",
  "motor controllers connected",
  "power distribution online",
];

/**
 * The landing-into-darkness sequence. A monospace boot log types out over the
 * loading meshes; when both the log and the assets are ready it dissolves to
 * reveal the living robot and hero.
 */
export function Boot() {
  const booted = useApp((s) => s.booted);
  const setBooted = useApp((s) => s.setBooted);
  const ready = useApp((s) => s.ready);
  const progress = useApp((s) => s.progress);

  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines >= BOOT_LINES.length) return;
    const t = setTimeout(() => setVisibleLines((n) => n + 1), visibleLines === 0 ? 500 : 340);
    return () => clearTimeout(t);
  }, [visibleLines]);

  const logDone = visibleLines >= BOOT_LINES.length;

  useEffect(() => {
    if (logDone && ready && !booted) {
      const t = setTimeout(() => setBooted(true), 650);
      return () => clearTimeout(t);
    }
  }, [logDone, ready, booted, setBooted]);

  return (
    <AnimatePresence>
      {!booted && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#050505]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 1, ease: [0.83, 0, 0.17, 1] }}
        >
          <div className="w-full max-w-md px-8">
            <div className="mb-8 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-text-faint">
              <span>BARQ · boot</span>
              <span>{Math.round(Math.min(progress, ready ? 1 : 0.98) * 100)}%</span>
            </div>

            <ul className="space-y-2 font-mono text-xs">
              {BOOT_LINES.map((line, i) => (
                <li
                  key={line}
                  className="flex items-center justify-between"
                  style={{
                    opacity: i < visibleLines ? 1 : 0,
                    transform: i < visibleLines ? "none" : "translateY(6px)",
                    transition: "opacity .4s, transform .4s",
                  }}
                >
                  <span className={i === 0 ? "text-text" : "text-text-dim"}>
                    <span className="text-cyan">›</span> {line}
                  </span>
                  <span className="text-emerald">
                    {i < visibleLines ? (i === 0 ? "" : "OK") : ""}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 h-px w-full overflow-hidden bg-line">
              <motion.div
                className="h-full bg-cyan"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: Math.min(progress, ready ? 1 : 0.98) }}
                style={{ transformOrigin: "left" }}
                transition={{ ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
