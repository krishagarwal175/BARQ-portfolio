"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Box3, PerspectiveCamera, Vector3 } from "three";
import type { ComponentRef } from "react";
import { camReadout } from "@/lib/debug";
import { useApp } from "@/lib/store";

/**
 * Free camera for finding shots.
 *
 * With `?debug` on the URL the scripted rig stands down and the robot becomes
 * fully orbitable, zoomable and pannable. Every frame the resulting pose is
 * written out as the same quantities the keyframes are authored in — orbit
 * angles about the target, plus the target expressed relative to the
 * bottom-centre of base_link — so a shot found by hand can be pasted straight
 * back into the rig rather than translated by eye.
 */
export function DebugControls() {
  const { camera } = useThree();
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);

  const scratch = useMemo(
    () => ({ box: new Box3(), mark: new Vector3(), dir: new Vector3(), size: new Vector3() }),
    [],
  );

  // Start from a sensible distance rather than wherever the rig left the camera.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.target.set(0, 0.18, 0);
    c.update();
  }, []);

  /**
   * Precision modifiers. At default speed a single pixel of drag moves the
   * camera further than the tolerance these shots need, which makes an exact
   * position impossible to land on. Alt drops every rate to a tenth,
   * Alt+Shift to a hundredth.
   */
  useEffect(() => {
    const apply = (e: KeyboardEvent) => {
      const c = controls.current;
      if (!c) return;
      const factor = e.altKey ? (e.shiftKey ? 0.01 : 0.1) : 1;
      c.rotateSpeed = factor;
      c.zoomSpeed = factor;
      c.panSpeed = factor;
    };
    window.addEventListener("keydown", apply);
    window.addEventListener("keyup", apply);
    return () => {
      window.removeEventListener("keydown", apply);
      window.removeEventListener("keyup", apply);
    };
  }, []);

  useFrame(() => {
    const c = controls.current;
    if (!c) return;
    const cam = camera as PerspectiveCamera;

    scratch.dir.copy(cam.position).sub(c.target);
    const distance = scratch.dir.length();
    if (distance > 1e-6) scratch.dir.divideScalar(distance);

    camReadout.px = cam.position.x;
    camReadout.py = cam.position.y;
    camReadout.pz = cam.position.z;
    camReadout.tx = c.target.x;
    camReadout.ty = c.target.y;
    camReadout.tz = c.target.z;

    // Inverse of orbitDir(): dir = (cosE*sinA, sinE, cosE*cosA).
    camReadout.azimuth = Math.atan2(scratch.dir.x, scratch.dir.z);
    camReadout.elevation = Math.asin(Math.max(-1, Math.min(1, scratch.dir.y)));
    camReadout.distance = distance;
    camReadout.fov = cam.fov;

    // Express the target against the underside panel, which is the anchor the
    // opening shot is authored from.
    const base = useApp.getState().robot?.links?.["base_link"];
    if (base) {
      scratch.box.setFromObject(base);
      if (!scratch.box.isEmpty()) {
        scratch.box.getCenter(scratch.mark);
        scratch.mark.y = scratch.box.min.y;
        camReadout.shiftX = c.target.x - scratch.mark.x;
        camReadout.shiftY = c.target.y - scratch.mark.y;
        camReadout.shiftZ = c.target.z - scratch.mark.z;

        scratch.box.getSize(scratch.size);
        const halfPanel = Math.max(scratch.size.x, scratch.size.z) * 0.5;
        const framedHalf = distance * Math.tan(((cam.fov * Math.PI) / 180) / 2);
        camReadout.fill = framedHalf > 1e-6 ? halfPanel / framedHalf : 0;
      }
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan
      enableZoom
      enableRotate
      minDistance={0.02}
      maxDistance={12}
      enableDamping
      dampingFactor={0.08}
    />
  );
}
