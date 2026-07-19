"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";

/**
 * Hold a key and drag anywhere on the page to orbit the robot.
 *
 * The Lab already has OrbitControls, but that is one section out of twelve —
 * everywhere else the camera is on rails and the reader cannot look at the
 * machine from anywhere except the angle the keyframe chose. This adds a
 * manual offset on top of that framing, so the scripted shot is still the
 * default but the subject can be inspected at any point in the page.
 *
 * It is gated behind a held key rather than plain drag for two reasons: a bare
 * drag on a long scrolling page is how people select text or fling the scroll,
 * and an accidental orbit that never resets would quietly break every
 * subsequent shot.
 *
 * Shift or Space arms it. Space is the convention in 3D tooling; Shift is
 * reachable one-handed while the other hand is on the mouse.
 */

/** Radians of orbit per pixel dragged. Tuned so a full sweep is ~1.5 screens. */
const AZ_PER_PX = 0.0042;
const EL_PER_PX = 0.0028;

export function OrbitDrag() {
  const nudgeOrbit = useApp((s) => s.nudgeOrbit);

  useEffect(() => {
    const root = document.documentElement;
    let armed = false;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const setState = () => {
      root.dataset.orbit = dragging ? "dragging" : armed ? "armed" : "";
    };

    const isArmKey = (e: KeyboardEvent) => e.key === "Shift" || e.code === "Space";

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore while typing, so the lab's controls stay usable.
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (!isArmKey(e)) return;
      // Space would otherwise page-scroll out from under the drag.
      if (e.code === "Space") e.preventDefault();
      armed = true;
      setState();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (!isArmKey(e)) return;
      armed = false;
      dragging = false;
      setState();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!armed || e.button !== 0) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      setState();
      e.preventDefault();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      // Drag right turns the robot toward you, which is what "grabbing" the
      // subject rather than the camera feels like.
      nudgeOrbit(-dx * AZ_PER_PX, dy * EL_PER_PX);
      e.preventDefault();
    };

    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      setState();
    };

    // Losing focus mid-drag would otherwise leave the page stuck in "armed".
    const onBlur = () => {
      armed = false;
      dragging = false;
      setState();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("blur", onBlur);
      delete root.dataset.orbit;
    };
  }, [nudgeOrbit]);

  return null;
}
