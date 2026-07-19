"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Box3, PerspectiveCamera, Sphere, Vector3 } from "three";
import { CAM_FRAMES, REVEAL_SHIFT, orbitDir } from "@/lib/camera-keyframes";
import { SpringScalar, SpringVec3 } from "@/lib/spring";
import { useApp } from "@/lib/store";
import { clamp, damp } from "@/lib/utils";

const DEG2RAD = Math.PI / 180;

/**
 * The opening shot, framed on the BARQ engraved into the underside of the
 * chassis. These are the dials for that shot.
 *
 * Elevation is the one that matters. The first attempt sat at -0.34 rad, only
 * about 19 degrees below the horizon, which skims *along* the underside at a
 * grazing angle — the mark was never in frame. Reading text on a bottom face
 * means getting almost directly beneath it, hence -1.15 rad (~66 degrees),
 * kept off vertical so the camera's up vector stays well defined.
 */
const REVEAL_AZIMUTH = -3.14153;
/**
 * Used exactly as measured. At 1.3 degrees off vertical this sits far enough
 * from the pole that `lookAt` keeps a well-defined basis, so unlike the
 * earlier -1.56951 reading it needs no clamping — and clamping was what
 * displaced the shot to one side last time.
 */
const REVEAL_ELEVATION = -1.54833;
/**
 * How much of the underside panel fills the frame. 1.0 fits the panel's long
 * axis exactly; below that crops into it. Solving the distance from the link's
 * real bounds beats a hardcoded metre value — the mark is baked into the mesh
 * and its exact position cannot be queried, so the reliable move is to frame
 * the whole panel and guarantee the engraving is somewhere in shot.
 */
const REVEAL_FILL = 6.29806;
/** The framing was found at the canvas default, not the hero keyframe's 34. */
const REVEAL_FOV = 38;
/** Nudge along the panel once you can see where the mark actually sits. */


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

  /**
   * The opening reveal. The page boots buried in the BARQ engraved on the
   * underside of the chassis — the mark fills the frame and the overlay
   * wordmark sits right on it — then pulls back as the reader scrolls until
   * the machine resolves into its full stance. Scroll-driven rather than
   * timed, so the reveal is something the reader performs instead of watches.
   */
  const revealBox = useRef(new Box3());
  const markPos = useRef(new Vector3());
  const revealDir = useRef(new Vector3());
  const revealPos = useRef(new Vector3());
  const revealSize = useRef(new Vector3());
  const reveal = useRef(0);
  const revealFov = useRef<number | null>(null);

  const posSpring = useRef<SpringVec3 | null>(null);
  const tgtSpring = useRef<SpringVec3 | null>(null);
  const fovSpring = useRef<SpringScalar | null>(null);

  useFrame((state, delta) => {
    const app = useApp.getState();
    if (app.labActive || app.debug) return;
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
    // The idle turntable stays parked until the reveal has finished; drifting
    // while the shot is inside the mark is the "moving on the first page".
    orbit.current += reveal.current > 0.999 ? dt * 0.075 * idle.current : 0;

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

    // ---- opening reveal --------------------------------------------------
    // Only the hero. Progress is the first screen of scroll, eased, so the
    // pull-back tracks the reader's own movement.
    const scrolled =
      typeof window === "undefined" ? 1 : window.scrollY / Math.max(1, window.innerHeight * 0.85);
    const wantReveal = section === 0 ? Math.min(1, Math.max(0, scrolled)) : 1;
    // Damped so a flick of the wheel does not snap the camera out of the mark.
    reveal.current = damp(reveal.current, wantReveal, 6, dt);
    // Published so the lighting can raise a lamp under the panel while the
    // shot is inside it, and drop it as the camera pulls out.
    if (Math.abs(useApp.getState().reveal - reveal.current) > 0.004) {
      useApp.getState().setReveal(reveal.current);
    }

    revealFov.current = null;
    if (reveal.current < 0.999) {
      const base = useApp.getState().robot?.links?.["base_link"];
      if (base) {
        revealBox.current.setFromObject(base);
        if (!revealBox.current.isEmpty()) {
          // The engraving is baked into the chassis mesh rather than being its
          // own node, so it is located geometrically: the bottom face of the
          // base link's bounds. Derived live, it stays locked to the body as
          // the robot breathes and shifts.
          // Note this is the bounds of the whole base_link subtree — in a URDF
          // the legs hang off the chassis, so min.y is the feet, not the
          // underside. That is fine and deliberate: the debug readout measured
          // against this same definition, so the values below land exactly
          // where they were found. Changing the anchor would invalidate them.
          revealBox.current.getCenter(markPos.current);
          markPos.current.y = revealBox.current.min.y;

          markPos.current.x += REVEAL_SHIFT[0];
          markPos.current.y += REVEAL_SHIFT[1];
          markPos.current.z += REVEAL_SHIFT[2];

          // Distance solved from the panel's own footprint so the shot frames
          // the underside whatever size the chassis is.
          revealBox.current.getSize(revealSize.current);
          const halfPanel =
            (Math.max(revealSize.current.x, revealSize.current.z) * 0.5) / REVEAL_FILL;
          const revealDist = halfPanel / Math.tan((REVEAL_FOV * DEG2RAD) / 2);

          // Almost directly beneath the panel, looking up into it.
          orbitDir(REVEAL_AZIMUTH, REVEAL_ELEVATION, revealDir.current);
          revealPos.current
            .copy(markPos.current)
            .addScaledVector(revealDir.current, revealDist);

          // Smoothstep so the pull-back accelerates out of the mark rather
          // than starting at full speed.
          const e = reveal.current * reveal.current * (3 - 2 * reveal.current);
          target.current.lerpVectors(markPos.current, target.current, e);
          desired.current.lerpVectors(revealPos.current, desired.current, e);
          revealFov.current = REVEAL_FOV + (frame.fov - REVEAL_FOV) * e;
        }
      }
    }

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
    const fov = fovSpring.current!.step(revealFov.current ?? frame.fov, 6, dt);

    camera.position.copy(posSpring.current.value);
    const cam = camera as PerspectiveCamera;
    cam.fov = fov;
    // Clip planes from the distance the camera ACTUALLY ends up at, not the
    // distance the keyframe would have used. During the opening reveal the
    // camera sits ~0.08 m from the chassis while the keyframe distance is
    // nearly half a metre — deriving `near` from the latter put the near plane
    // in front of the subject and culled the entire robot, which is why the
    // engraving never appeared.
    const actualDist = posSpring.current.value.distanceTo(tgtSpring.current!.value);
    cam.near = Math.max(0.005, actualDist - sphere.current.radius * 2.5);
    cam.far = actualDist + sphere.current.radius * 8;
    cam.updateProjectionMatrix();
    camera.lookAt(tgtSpring.current!.value);
  });

  return null;
}
