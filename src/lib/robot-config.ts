import type { GaitDef, JointPose, LegId, PartSpec, PoseDef } from "@/types/robot";

/** Public paths for the robot assets. */
export const ROBOT_URDF = "/robot/barq.urdf";
export const ROBOT_MESH_DIR = "/robot/meshes";

export const LEGS: LegId[] = ["FL", "FR", "RL", "RR"];
export const LEG_LABEL: Record<LegId, string> = {
  FL: "Front Left",
  FR: "Front Right",
  RL: "Rear Left",
  RR: "Rear Right",
};

/** Neutral standing joint angles (radians) — ported from the reference viewer. */
export const STAND_KNEE = 0.6;
export const STAND_ANKLE = -1.1;

const jointName = (leg: LegId, role: "hip" | "knee" | "ankle") =>
  `${leg}_${role}_joint`;

/** Build a stance from per-role angles, with optional lateral hip splay. */
function stance(
  knee: number,
  ankle: number,
  opts: { hip?: number; splay?: number } = {},
): JointPose {
  const pose: JointPose = {};
  for (const leg of LEGS) {
    const side = leg.endsWith("L") ? 1 : -1;
    pose[jointName(leg, "hip")] = (opts.hip ?? 0) + (opts.splay ?? 0) * side;
    pose[jointName(leg, "knee")] = knee;
    pose[jointName(leg, "ankle")] = ankle;
  }
  return pose;
}

const frontLower = (base: JointPose, knee: number, ankle: number): JointPose => ({
  ...base,
  FL_knee_joint: knee,
  FR_knee_joint: knee,
  FL_ankle_joint: ankle,
  FR_ankle_joint: ankle,
});

/* ------------------------------------------------------------------ */
/*  Pose library — each genuinely repositions the whole body           */
/* ------------------------------------------------------------------ */
export const POSES: PoseDef[] = [
  {
    id: "idle",
    label: "Idle",
    pose: stance(STAND_KNEE, STAND_ANKLE),
    duration: 0.8,
    info: { purpose: "Passive standby", stability: 92, energy: 18, terrain: "Flat", cog: "Centred", description: "Balanced quiet stance with live idle micro-corrections." },
  },
  {
    id: "neutral",
    label: "Neutral",
    pose: stance(0.5, -0.9),
    duration: 0.7,
    info: { purpose: "Home reference", stability: 88, energy: 20, terrain: "Flat", cog: "Centred", description: "Mid-range reference posture between calibration and stand." },
  },
  {
    id: "stand",
    label: "Stand",
    pose: stance(STAND_KNEE, STAND_ANKLE),
    duration: 0.7,
    info: { purpose: "Load-bearing stance", stability: 94, energy: 22, terrain: "Flat / mixed", cog: "Centred", description: "Nominal standing posture with feet under the hips." },
  },
  {
    id: "high-stand",
    label: "High Stand",
    pose: stance(0.35, -0.72),
    bodyY: 0.03,
    duration: 0.9,
    info: { purpose: "Extended reach / clearance", stability: 78, energy: 30, terrain: "Obstacles", cog: "Raised", description: "Legs extended to maximise ground clearance and sensor height." },
  },
  {
    id: "low-crawl",
    label: "Low Crawl",
    pose: stance(1.2, -1.45, { splay: 0.28 }),
    bodyY: -0.06,
    duration: 1.0,
    info: { purpose: "Low-profile traverse", stability: 90, energy: 34, terrain: "Confined", cog: "Lowered / wide", description: "Wide splayed stance dropping the chassis for low clearance." },
  },
  {
    id: "sit",
    label: "Sit",
    pose: {
      ...stance(0.35, STAND_ANKLE),
      RL_knee_joint: 1.35,
      RR_knee_joint: 1.35,
      RL_ankle_joint: -1.5,
      RR_ankle_joint: -1.5,
    },
    bodyY: -0.03,
    bodyPitch: -0.14,
    duration: 1.1,
    info: { purpose: "Rest / observe", stability: 96, energy: 12, terrain: "Flat", cog: "Rear-biased", description: "Rear legs folded, chassis pitched back onto the haunches." },
  },
  {
    id: "rest",
    label: "Rest",
    pose: stance(1.1, -1.4),
    bodyY: -0.05,
    duration: 1.2,
    info: { purpose: "Low-power hold", stability: 97, energy: 8, terrain: "Flat", cog: "Lowered", description: "Chassis lowered near the ground to shed actuator load." },
  },
  {
    id: "lie",
    label: "Lie Down",
    pose: stance(1.45, -1.55, { splay: 0.1 }),
    bodyY: -0.07,
    duration: 1.3,
    info: { purpose: "Full rest", stability: 99, energy: 5, terrain: "Flat", cog: "Ground", description: "Belly-down rest with all legs folded beneath the frame." },
  },
  {
    id: "power-off",
    label: "Power Off",
    pose: stance(1.5, -1.55, { splay: 0.16 }),
    bodyY: -0.085,
    duration: 1.6,
    info: { purpose: "Shutdown", stability: 100, energy: 0, terrain: "Flat", cog: "Ground", description: "Actuators relax to a safe collapsed rest before power-down." },
  },
  {
    id: "wake-up",
    label: "Wake Up",
    pose: stance(0.55, -1.05),
    duration: 1.4,
    info: { purpose: "Boot to stance", stability: 84, energy: 26, terrain: "Flat", cog: "Rising", description: "Staged rise from rest to a light standing posture." },
  },
  {
    id: "calibration",
    label: "Calibration",
    pose: stance(0, 0),
    duration: 1.2,
    info: { purpose: "Joint zeroing", stability: 70, energy: 24, terrain: "Rig", cog: "Raised", description: "All joints driven to zero for encoder zeroing and self-check." },
  },
  {
    id: "stretch",
    label: "Stretch",
    pose: {
      FL_knee_joint: 1.2,
      FR_knee_joint: 1.2,
      FL_ankle_joint: -0.4,
      FR_ankle_joint: -0.4,
      FL_hip_joint: 0.1,
      FR_hip_joint: -0.1,
      RL_knee_joint: 0.2,
      RR_knee_joint: 0.2,
      RL_ankle_joint: -1.2,
      RR_ankle_joint: -1.2,
    },
    bodyY: -0.02,
    bodyPitch: 0.12,
    duration: 1.3,
    info: { purpose: "Actuator conditioning", stability: 80, energy: 28, terrain: "Flat", cog: "Forward", description: "Front reach with rear compression to exercise the full range." },
  },
  {
    id: "play-bow",
    label: "Play Bow",
    pose: frontLower(stance(STAND_KNEE, STAND_ANKLE), 1.35, -1.4),
    bodyY: -0.02,
    bodyPitch: 0.2,
    duration: 1.0,
    info: { purpose: "Expressive greeting", stability: 82, energy: 24, terrain: "Flat", cog: "Forward-low", description: "Front dropped, rear high — a playful bow gesture." },
  },
  {
    id: "greeting",
    label: "Greeting",
    pose: frontLower(stance(STAND_KNEE, STAND_ANKLE), 1.1, -1.25),
    bodyPitch: 0.12,
    duration: 0.9,
    info: { purpose: "Acknowledge operator", stability: 86, energy: 22, terrain: "Flat", cog: "Forward", description: "Gentle nose-down nod toward the operator." },
  },
  {
    id: "ready",
    label: "Ready",
    pose: stance(0.72, -1.15),
    bodyY: -0.008,
    duration: 0.6,
    info: { purpose: "Pre-motion crouch", stability: 90, energy: 26, terrain: "Mixed", cog: "Loaded", description: "Lightly crouched, springs loaded for immediate motion." },
  },
  {
    id: "alert",
    label: "Alert",
    pose: {
      ...stance(STAND_KNEE, STAND_ANKLE),
      RL_knee_joint: 0.72,
      RR_knee_joint: 0.72,
    },
    bodyPitch: -0.08,
    duration: 0.6,
    info: { purpose: "Heightened readiness", stability: 88, energy: 27, terrain: "Mixed", cog: "Rear-biased", description: "Weight shifted back, nose up, scanning posture." },
  },
  {
    id: "inspection",
    label: "Inspection",
    pose: {
      ...stance(0.7, -1.15),
      FL_knee_joint: 0.95,
      FL_ankle_joint: -1.25,
    },
    bodyRoll: 0.1,
    bodyPitch: 0.1,
    duration: 1.1,
    info: { purpose: "Close visual survey", stability: 83, energy: 25, terrain: "Flat", cog: "Offset", description: "Chassis tips toward a point of interest for a close look." },
  },
  {
    id: "recovery",
    label: "Recovery",
    pose: stance(0.8, -1.2, { splay: 0.18 }),
    bodyY: -0.02,
    duration: 1.2,
    info: { purpose: "Self-right", stability: 76, energy: 40, terrain: "Any", cog: "Wide", description: "Wide brace used to push back up to a stable stance." },
  },
  {
    id: "balance-test",
    label: "Balance Test",
    pose: stance(STAND_KNEE, STAND_ANKLE, { splay: 0.14 }),
    bodyRoll: 0.08,
    duration: 0.9,
    info: { purpose: "Stability demo", stability: 74, energy: 32, terrain: "Uneven", cog: "Dynamic", description: "Braced wide stance holding a rolled chassis against tilt." },
  },
  {
    id: "walk-ready",
    label: "Walking Ready",
    pose: stance(0.78, -1.2),
    bodyY: -0.012,
    duration: 0.6,
    info: { purpose: "Gait entry — walk", stability: 89, energy: 30, terrain: "Flat", cog: "Loaded", description: "Neutral crouch tuned for the low-speed walking gait." },
  },
  {
    id: "trot-ready",
    label: "Trotting Ready",
    pose: stance(0.85, -1.28),
    bodyY: -0.02,
    duration: 0.6,
    info: { purpose: "Gait entry — trot", stability: 85, energy: 36, terrain: "Flat", cog: "Loaded", description: "Deeper crouch loading the diagonal pairs for trotting." },
  },
  {
    id: "run-ready",
    label: "Running Ready",
    pose: stance(0.95, -1.38),
    bodyY: -0.03,
    duration: 0.6,
    info: { purpose: "Gait entry — run", stability: 80, energy: 44, terrain: "Flat", cog: "Loaded-low", description: "Aggressive low crouch primed for the running gait." },
  },
];

export const POSE_MAP = Object.fromEntries(POSES.map((p) => [p.id, p]));

/* ------------------------------------------------------------------ */
/*  Gaits — per-leg phase offsets (fraction of a cycle)               */
/* ------------------------------------------------------------------ */
export const GAITS: GaitDef[] = [
  {
    id: "trot",
    label: "Trot",
    offsets: { FL: 0.0, FR: 0.5, RL: 0.5, RR: 0.0 },
    freq: 1.15,
    lift: 0.55,
    push: 0.3,
  },
  {
    id: "walk",
    label: "Walk",
    offsets: { FL: 0.0, RL: 0.25, RR: 0.5, FR: 0.75 },
    freq: 0.85,
    lift: 0.5,
    push: 0.26,
  },
  {
    id: "run",
    label: "Run",
    offsets: { FL: 0.0, FR: 0.5, RL: 0.5, RR: 0.0 },
    freq: 2.1,
    lift: 0.7,
    push: 0.42,
  },
  {
    id: "pace",
    label: "Pace",
    offsets: { FL: 0.0, RL: 0.0, FR: 0.5, RR: 0.5 },
    freq: 1.2,
    lift: 0.5,
    push: 0.32,
  },
  {
    id: "bound",
    label: "Bound",
    offsets: { FL: 0.0, FR: 0.0, RL: 0.5, RR: 0.5 },
    freq: 1.6,
    lift: 0.65,
    push: 0.4,
  },
];

export const GAIT_MAP = Object.fromEntries(GAITS.map((g) => [g.id, g]));

/* ------------------------------------------------------------------ */
/*  Teardown / hardware component specs                               */
/* ------------------------------------------------------------------ */
export const PARTS: PartSpec[] = [
  {
    id: "chassis",
    link: "base_link",
    name: "Chassis",
    category: "Structure",
    accent: "cyan",
    explode: [0, 0.16, 0],
    description:
      "Central 3D-printed body that houses the Jetson Orin Nano, the HW-290 IMU and power distribution. Modelled in Fusion 360 and printed for modularity and easy maintenance.",
    specs: [
      { label: "CAD", value: "Fusion 360" },
      { label: "Process", value: "3D printed" },
      { label: "Houses", value: "Jetson · IMU · Power" },
      { label: "Source", value: "URDF" },
    ],
  },
  {
    id: "coxa",
    link: "FL_coxa_link",
    name: "Coxa · Hip",
    category: "Actuation",
    accent: "emerald",
    explode: [0.22, 0.06, 0.16],
    description:
      "Provides the primary hip rotation. Carries a DS3240MG digital servo and transfers its motion into the femur assembly.",
    specs: [
      { label: "Joint", value: "Hip" },
      { label: "DOF", value: "1" },
      { label: "Range", value: "±45°" },
      { label: "Servo", value: "DS3240MG" },
    ],
  },
  {
    id: "femur",
    link: "FL_femur_link",
    name: "Femur",
    category: "Kinematics",
    accent: "cyan",
    explode: [0.34, -0.02, 0.24],
    description:
      "The primary lifting link. It carries the knee actuator and is responsible for supporting the body through the leg.",
    specs: [
      { label: "Joint", value: "Knee" },
      { label: "DOF", value: "1" },
      { label: "Range", value: "±90°" },
      { label: "Role", value: "Body support" },
    ],
  },
  {
    id: "tibia",
    link: "FL_tibia_link",
    name: "Tibia + Foot",
    category: "Contact",
    accent: "pink",
    explode: [0.46, -0.12, 0.32],
    description:
      "Provides leg extension — determining reach and body height — and terminates in the foot, the ground-contact interface and a mounting point for future terrain sensing.",
    specs: [
      { label: "Joint", value: "Ankle" },
      { label: "DOF", value: "1" },
      { label: "Range", value: "±90°" },
      { label: "Contact", value: "Foot" },
    ],
  },
];

/** 12 controllable revolute joints. */
export const JOINT_COUNT = LEGS.length * 3;
