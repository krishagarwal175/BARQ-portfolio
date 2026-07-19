import { Vector3 } from "three";

/**
 * A cinematic framing directive. The camera orbits the robot's bounding sphere
 * at (azimuth, elevation) and pulls to whatever distance frames the sphere with
 * `margin` headroom — so the robot is ALWAYS in shot regardless of pose or how
 * far the teardown has exploded.
 */
export interface CamFrame {
  /** Horizontal orbit angle (radians, 0 = front). */
  azimuth: number;
  /** Vertical orbit angle (radians above the horizon). */
  elevation: number;
  /** Field of view in degrees. */
  fov: number;
  /** Framing headroom: 1.0 tight, >1 wider. */
  margin: number;
  /** LookAt offset from the bounding-sphere centre, in world units. */
  targetOffset: [number, number, number];
}

/**
 * Where the opening shot is aimed, relative to the bottom-centre of the
 * base_link bounds. Shared because the reveal lighting has to sit against the
 * same plane the camera is pointed at — the bounds include the legs, so the
 * raw bottom is the feet, not the underside panel.
 */
export const REVEAL_SHIFT: [number, number, number] = [0.04843, 0.17994, 0.00014];

/** One frame per narrative section index (see useSection). */
export const CAM_FRAMES: CamFrame[] = [
  // Margins are tight on purpose — the robot is the subject and should fill
  // the frame. 1.0 exactly circumscribes the bounding sphere, so anything
  // near 1.0 is close framing; the teardown keeps more room because exploding
  // grows that sphere considerably.
  // 0 · Hero — wide, dramatic front three-quarter, slightly low
  { azimuth: 0.62, elevation: 0.12, fov: 34, margin: 1.14, targetOffset: [0, 0.0, 0] },
  // 1 · Kinematics — near profile
  { azimuth: 1.32, elevation: 0.08, fov: 32, margin: 1.02, targetOffset: [0, 0.0, 0] },
  // 2 · Actuation — three-quarter close-up on the hip
  { azimuth: 0.5, elevation: 0.22, fov: 30, margin: 0.9, targetOffset: [0.04, 0.02, 0] },
  // 3 · Chassis — elevated, looking down the spine
  { azimuth: 0.24, elevation: 0.62, fov: 32, margin: 0.96, targetOffset: [0, 0.01, 0] },
  // 4 · Exploded teardown — centred, subtly wider FOV, close framing
  { azimuth: 0.4, elevation: 0.16, fov: 40, margin: 1.04, targetOffset: [0, 0.02, 0] },
  // 5 · Thermal — profile, close, so the hot body fills the sensor
  { azimuth: -0.7, elevation: 0.2, fov: 36, margin: 1.0, targetOffset: [0, 0.0, 0] },
];

/** Direction (target → camera) for an orbit angle pair. */
export function orbitDir(azimuth: number, elevation: number, out = new Vector3()) {
  const ce = Math.cos(elevation);
  return out.set(ce * Math.sin(azimuth), Math.sin(elevation), ce * Math.cos(azimuth));
}
