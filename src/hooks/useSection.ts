"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/lib/store";

/**
 * Marks a scroll section. When it crosses the viewport midline it becomes the
 * active narrative section, which the camera rig reads to reposition.
 */
export function useSection<T extends HTMLElement>(index: number, dodge = 0) {
  const ref = useRef<T>(null);
  const setSection = useApp((s) => s.setSection);
  const setDodge = useApp((s) => s.setDodge);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setSection(index);
            // Publish which way the robot should slide so it never sits under
            // this section's copy.
            setDodge(dodge);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [index, dodge, setSection, setDodge]);

  return ref;
}
