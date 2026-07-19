"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import Snap from "lenis/snap";
import { useApp } from "@/lib/store";
import { clamp } from "@/lib/utils";

/**
 * Lenis smooth scrolling. Publishes normalized scroll progress to the store so
 * the camera rig and sections can react. Respects reduced-motion.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const setScroll = useApp((s) => s.setScroll);
  const setScrollVel = useApp((s) => s.setScrollVel);

  useEffect(() => {
    // Always start at the top; never restore a previous scroll position.
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    lenis.scrollTo(0, { immediate: true });
    lenis.on(
      "scroll",
      ({ scroll, limit, velocity }: { scroll: number; limit: number; velocity: number }) => {
        setScroll(limit > 0 ? scroll / limit : 0);
        // Lenis velocity is in px/frame and routinely spikes past 100 on a
        // flick; clamp to -1..1 so downstream motion stays bounded.
        setScrollVel(clamp(velocity / 55, -1, 1));
      },
    );

    /**
     * Snapping is opt-in per section, and deliberately `proximity` rather than
     * `mandatory`.
     *
     * Several sections are *scrubbed* — the teardown explodes across a 280svh
     * track, the thermal camera ramps across its own, the lab pins a console —
     * and mandatory snapping would fight those, yanking the reader out of a
     * scrub mid-gesture. Proximity only engages once scrolling comes to rest
     * near a registered point, and only full-viewport beats register at all
     * (marked with `data-snap`). Everything tall or scrubbed is left alone.
     */
    const snap = new Snap(lenis, {
      type: "proximity",
      duration: 0.9,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      // Pull in from within ~40% of a screen. Beyond that the reader is
      // travelling somewhere else and should be left to it.
      distanceThreshold: "40%",
      debounce: 260,
    });

    document.querySelectorAll<HTMLElement>("[data-snap]").forEach((el) => {
      snap.addElement(el, { align: ["start"] });
    });

    // In debug the wheel belongs to the camera, not the page — Lenis would
    // otherwise consume it and zoom would do nothing.
    const unsubscribeDebug = useApp.subscribe((state) => {
      if (state.debug) lenis.stop();
      else lenis.start();
    });
    if (useApp.getState().debug) lenis.stop();

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      unsubscribeDebug();
      snap.destroy();
      lenis.destroy();
    };
  }, [setScroll, setScrollVel]);

  return <>{children}</>;
}
