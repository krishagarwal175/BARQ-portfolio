/** Camera choreography — one keyframe per narrative section. */
export interface CamKey {
  pos: [number, number, number];
  target: [number, number, number];
  fov: number;
}

/**
 * Section indices map 1:1 to the narrative sections rendered in the page.
 * The rig damps toward the active section's pose; scroll adds micro parallax.
 */
export const CAM_KEYS: CamKey[] = [
  // 0 · Hero — wide, low, front three-quarter
  { pos: [0.62, 0.34, 0.72], target: [0, 0.16, 0], fov: 38 },
  // 1 · Kinematics — profile, mid height
  { pos: [0.95, 0.22, 0.05], target: [0, 0.14, 0], fov: 34 },
  // 2 · Actuation — macro on a front leg joint
  { pos: [0.34, 0.2, 0.42], target: [0.12, 0.12, 0.06], fov: 30 },
  // 3 · Chassis / electronics — top-down-ish close
  { pos: [0.16, 0.5, 0.34], target: [0, 0.16, 0], fov: 32 },
  // 4 · Exploded teardown — pulled back, centered
  { pos: [0.05, 0.28, 1.05], target: [0, 0.14, 0], fov: 40 },
  // 5 · Performance / hardware — hero-ish wide again
  { pos: [-0.7, 0.3, 0.7], target: [0, 0.16, 0], fov: 38 },
];

export const HERO_KEY = CAM_KEYS[0];
