"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Box3, PerspectiveCamera, Sphere, Vector3 } from "three";
import { CAM_FRAMES, orbitDir } from "@/lib/camera-keyframes";
import { SpringScalar, SpringVec3 } from "@/lib/spring";
import { useApp } from "@/lib/store";
import { clamp, damp } from "@/lib/utils";

const DEG2RAD = Math.PI / 180;

/**
 * Cinematic framing rig. Rather than driving fixed coordinates, it frames the
 * robot's live bounding sphere: each section picks an orbit angle and FOV, and
 * the distance is solved so the robot always fills the shot with headroom — it
 * can never crop, clip or drift, even as the teardown explodes. Position,
 * target and FOV are critically-damped springs for Apple-grade transitions.
 */
export function CameraRig() {
  const { camera, pointer } = useThree();

  const box = useRef(new Box3());
  const sphere = useRef(new Sphere());
  const dir = useRef(new Vector3());
  const target = useRef(new Vector3());
  const desired = useRef(new Vector3());

  // Lateral pan, for sliding the robot clear of the active section's copy.
  const lateral = useRef(new Vector3());
  const dodgeEased = useRef(0);

  /** Accumulated idle orbit, and how strongly it is currently applied. */
  const orbit = useRef(0);
  const idle = useRef(0);

  const posSpring = useRef<SpringVec3 | null>(null);
  const tgtSpring = useRef<SpringVec3 | null>(null);
  const fovSpring = useRef<SpringScalar | null>(null);

  useFrame((state, delta) => {
    if (useApp.getState().labActive) return;
    const { section, robotGroup, dodge, scrollVel, orbitAz, orbitEl } = useApp.getState();
    if (!robotGroup) return;

    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    // Live bounds → bounding sphere. Grows automatically during the teardown.
    box.current.setFromObject(robotGroup);
    if (box.current.isEmpty()) return;
    box.current.getBoundingSphere(sphere.current);

    const frame = CAM_FRAMES[Math.min(section, CAM_FRAMES.length - 1)];

    // Idle turntable. When the reader stops scrolling the camera keeps
    // travelling slowly around the robot, so a page left alone is never a
    // still image — but the drift is faded out the moment scrolling resumes,
    // otherwise it fights the section-to-section framing and reads as drift
    // rather than intent. The angle keeps accumulating while faded out, so
    // resuming never snaps back to where it paused.
    const moving = Math.min(1, Math.abs(scrollVel) * 6);
    idle.current = damp(idle.current, 1 - moving, moving > 0.5 ? 6 : 0.8, dt);
    orbit.current += dt * 0.075 * idle.current;

    // Pointer + breathe as orbit offsets so the subject stays centred.
    // Manual orbit is added to the keyframe rather than replacing it, so the
    // scripted framing still drives the shot and the drag is an offset from it.
    const az =
      frame.azimuth + orbit.current + orbitAz + pointer.x * 0.16 + Math.sin(t * 0.3) * 0.02;
    const el = clamp(
      frame.elevation + orbitEl + pointer.y * 0.1 + Math.cos(t * 0.24) * 0.015,
      0.02,
      1.45,
    );
    orbitDir(az, el, dir.current);

    const fovRad = frame.fov * DEG2RAD;
    const dist = (sphere.current.radius * frame.margin) / Math.sin(fovRad / 2);

    target.current.copy(sphere.current.center);
    target.current.x += frame.targetOffset[0];
    target.current.y += frame.targetOffset[1];
    target.current.z += frame.targetOffset[2];

    // Slide the subject clear of the copy. Panning camera AND target by the
    // same vector moves the robot the opposite way on screen, so a +1 dodge
    // (copy on the left) pans left and the robot reads right of centre.
    // Scaled by the bounding radius, so the shift is proportionate at every
    // framing — a close-up slides less in world units than a wide shot.
    dodgeEased.current = damp(dodgeEased.current, dodge, 1.8, dt);
    lateral.current
      .set(dir.current.z, 0, -dir.current.x) // camera-right, flattened to the ground plane
      .normalize()
      .multiplyScalar(-dodgeEased.current * sphere.current.radius * 0.62);
    target.current.add(lateral.current);

    desired.current.copy(target.current).addScaledVector(dir.current, dist);

    // Lazily seed the springs at the framed pose so the hero opens composed.
    if (!posSpring.current) {
      posSpring.current = new SpringVec3(desired.current);
      tgtSpring.current = new SpringVec3(target.current);
      fovSpring.current = new SpringScalar(frame.fov);
      camera.position.copy(desired.current);
    }

    const omega = 7;
    posSpring.current.step(desired.current, omega, dt);
    tgtSpring.current!.step(target.current, omega, dt);
    const fov = fovSpring.current!.step(frame.fov, 6, dt);

    camera.position.copy(posSpring.current.value);
    const cam = camera as PerspectiveCamera;
    cam.fov = fov;
    cam.near = Math.max(0.01, dist - sphere.current.radius * 2.5);
    cam.far = dist + sphere.current.radius * 8;
    cam.updateProjectionMatrix();
    camera.lookAt(tgtSpring.current!.value);
  });

  return null;
}
