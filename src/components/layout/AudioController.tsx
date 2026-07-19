"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/lib/store";

/**
 * Ambient bed for the experience.
 *
 * The track is fetched lazily on the first unmute rather than on page load.
 * That matters here: the page already pulls a URDF and six Collada meshes
 * before it can show anything, and a couple of megabytes of audio competing
 * for that bandwidth would push the boot screen out further — for a sound most
 * visitors never turn on.
 *
 * Playback only ever starts from the mute toggle, which is a genuine user
 * gesture, so autoplay policy is satisfied by construction. Volume is ramped
 * by hand rather than snapped: a drone appearing at full level is jarring, and
 * pausing before the fade completes leaves an audible click.
 *
 * Credit: "Drone Dark and Moody Atmospheric Ambient Background"
 * by fronbondi_skegs — free / no copyright.
 */

/** Target level when unmuted. The bed should sit under everything, not lead. */
const LEVEL = 0.38;
/** Seconds for a full fade in either direction. */
const FADE = 1.1;

export function AudioController() {
  const muted = useApp((s) => s.muted);
  const elRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    // Build the element on first unmute, never before — this is what defers
    // the download.
    if (!elRef.current) {
      if (muted) return;
      const el = new Audio("/audio/barq-ambient.mp3");
      el.loop = true;
      el.preload = "auto";
      el.volume = 0;
      elRef.current = el;
    }

    const el = elRef.current;
    if (!el) return;

    const target = muted ? 0 : LEVEL;
    const from = el.volume;
    const start = performance.now();

    if (!muted) {
      // play() rejects if the gesture is not recognised. Failing quietly is
      // correct — the toggle simply appears not to take, rather than throwing.
      void el.play().catch(() => {});
    }

    cancelAnimationFrame(rafRef.current);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / (FADE * 1000));
      // Smoothstep, so the fade does not arrive linear-loud.
      const eased = t * t * (3 - 2 * t);
      el.volume = Math.max(0, Math.min(1, from + (target - from) * eased));

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else if (muted) {
        // Pause only once silent, otherwise the cut is audible.
        el.pause();
      }
    };
    rafRef.current = requestAnimationFrame(step);

    return () => cancelAnimationFrame(rafRef.current);
  }, [muted]);

  // Tear down on unmount so a route change cannot leave audio playing.
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      const el = elRef.current;
      if (el) {
        el.pause();
        el.src = "";
      }
      elRef.current = null;
    };
  }, []);

  return null;
}
