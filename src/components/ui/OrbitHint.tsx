"use client";

import { motion, AnimatePresence } from "motion/react";
import { useApp } from "@/lib/store";
import { EASE } from "@/lib/motion";

/**
 * A one-line prompt for the orbit gesture.
 *
 * Hold-and-drag is not discoverable on its own — nothing on screen suggests
 * the camera can be taken off its rails — so the affordance has to be stated
 * once. It then gets out of the way permanently: the moment the reader
 * actually orbits, the hint retires and does not come back, because a tip you
 * have already acted on is just clutter.
 *
 * It also hides in the Lab, which has its own drag-to-orbit controls and says
 * so, and in the reference half, where there is no scene to orbit.
 */
export function OrbitHint() {
  const booted = useApp((s) => s.booted);
  const labActive = useApp((s) => s.labActive);
  const sceneVisible = useApp((s) => s.sceneVisible);
  // Latched in the store the moment a real orbit happens.
  const hasOrbited = useApp((s) => s.hasOrbited);

  const show = booted && sceneVisible && !labActive && !hasOrbited;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          /* The delay belongs on the entrance only. Left on the shared
             transition it also delayed the exit, so the hint hung around for
             a second and a half after the reader had already acted on it. */
          animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE, delay: 1.4 } }}
          exit={{ opacity: 0, y: 8, transition: { duration: 0.3, ease: EASE } }}
          className="glass glass-pill pointer-events-none fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2.5 py-2 pl-2.5 pr-4"
        >
          <kbd className="rounded-md border border-line bg-[var(--hover)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-2">
            Space
          </kbd>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-2">
            hold + drag to orbit
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
