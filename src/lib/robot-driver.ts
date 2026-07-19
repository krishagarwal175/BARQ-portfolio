import { GAIT_MAP, LEGS, POSE_MAP, STAND_ANKLE, STAND_KNEE } from "@/lib/robot-config";
import { clamp, damp, lerp, smoothstep } from "@/lib/utils";
import type { EnvId, MotionMode } from "@/lib/store";
import type { JointPose, URDFRobotLike } from "@/types/robot";

const TWO_PI = Math.PI * 2;

/** easeOutBack — settles with a small overshoot, like a servo arriving. */
function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

/** Stable per-joint hash in [0,1) for deterministic stagger/vibration phase. */
function hash(name: string): number {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

/**
 * Drives BARQ every frame. Poses transition with genuine servo character —
 * staggered joint start times, an arrival overshoot, a decaying settle
 * vibration and continuous idle micro-motion — so movement reads as a real
 * mechanism with mass, never a skeletal snap. Gaits and demos keep the phase
 * models ported from the reference viewer.
 */
export class RobotDriver {
  private robot: URDFRobotLike;
  private target: JointPose = {};
  private current: JointPose = {};

  private baseBodyY = 0;
  private bodyY = 0;
  private targetBodyY = 0;
  private bodyPitch = 0;
  private bodyRoll = 0;
  private targetPitch = 0;
  private targetRoll = 0;
  private gaitClock = 0;

  // Pose transition state.
  private activePose: string | null = null;
  private poseFrom: JointPose = {};
  private poseTo: JointPose = {};
  private poseDelay: Record<string, number> = {};
  private poseDur = 0.8;
  private poseT0 = 0;

  constructor(robot: URDFRobotLike, baseBodyY: number) {
    this.robot = robot;
    this.baseBodyY = baseBodyY;
    for (const name of Object.keys(robot.joints)) {
      this.current[name] = 0;
      this.target[name] = 0;
    }
  }

  get currentBodyY() {
    return this.bodyY;
  }
  get currentBodyPitch() {
    return this.bodyPitch;
  }
  get currentBodyRoll() {
    return this.bodyRoll;
  }

  update(dt: number, mode: MotionMode, speed: number, elapsed: number, env: EnvId = "studio") {
    if (mode.kind === "pose") {
      this.drivePose(mode.id, elapsed, dt, env);
      return;
    }

    // Gait / demo path: set targets then damp toward them.
    this.activePose = null;
    if (mode.kind === "demo") {
      this.baseTargets("stand");
      if (mode.id === "wave") this.driveWave(elapsed);
      else this.driveBalance(elapsed);
    } else {
      this.driveGait(dt, mode, speed);
    }

    for (const name of Object.keys(this.target)) {
      this.current[name] = damp(this.current[name], this.target[name], 10, dt);
      this.robot.setJointValue(name, this.current[name]);
    }
    this.bodyY = damp(this.bodyY, this.baseBodyY + this.targetBodyY, 8, dt);
    this.bodyPitch = damp(this.bodyPitch, this.targetPitch, 8, dt);
    this.bodyRoll = damp(this.bodyRoll, this.targetRoll, 8, dt);
  }

  private baseTargets(id: string) {
    const def = POSE_MAP[id];
    for (const name of Object.keys(this.target)) this.target[name] = 0;
    if (def) for (const [n, v] of Object.entries(def.pose)) this.target[n] = v;
    this.targetBodyY = def?.bodyY ?? 0;
    this.targetPitch = def?.bodyPitch ?? 0;
    this.targetRoll = def?.bodyRoll ?? 0;
  }

  /** Begin a staggered, overshooting transition into a new pose. */
  private startPose(id: string, elapsed: number) {
    const def = POSE_MAP[id];
    if (!def) return;
    this.activePose = id;
    this.poseT0 = elapsed;
    this.poseDur = def.duration ?? 0.8;
    this.poseFrom = {};
    this.poseTo = {};
    this.poseDelay = {};
    for (const name of Object.keys(this.current)) {
      this.poseFrom[name] = this.current[name];
      this.poseTo[name] = def.pose[name] ?? 0;
      // Proximal joints (hip) lead, distal (ankle) trail; add per-joint jitter.
      const rank = name.includes("hip") ? 0 : name.includes("knee") ? 1 : 2;
      this.poseDelay[name] = rank * 0.05 + hash(name) * 0.06;
    }
    this.targetBodyY = def.bodyY ?? 0;
    this.targetPitch = def.bodyPitch ?? 0;
    this.targetRoll = def.bodyRoll ?? 0;
  }

  private drivePose(id: string, elapsed: number, dt: number, env: EnvId) {
    if (id !== this.activePose) this.startPose(id, elapsed);

    for (const name of Object.keys(this.current)) {
      const delay = this.poseDelay[name] ?? 0;
      const lt = clamp((elapsed - this.poseT0 - delay) / this.poseDur, 0, 1);
      let v = lerp(this.poseFrom[name], this.poseTo[name], easeOutBack(lt));

      // Decaying settle vibration as the servo arrives.
      if (lt > 0.5 && lt < 1) {
        v += Math.sin(elapsed * 32 + hash(name) * TWO_PI) * 0.006 * (1 - lt);
      }
      // Continuous idle life once settled, plus environment stance modifier.
      const settled = smoothstep(0.82, 1, lt);
      v += this.idleFor(name, elapsed) * settled;
      v += this.envMod(name, elapsed, env) * settled;

      this.current[name] = v;
      this.robot.setJointValue(name, v);
    }

    // Body follows with a gentle damp for weight.
    const breathe = Math.sin(elapsed * 1.1) * 0.006;
    this.bodyY = damp(this.bodyY, this.baseBodyY + this.targetBodyY + breathe, 6, dt);
    this.bodyPitch = damp(this.bodyPitch, this.targetPitch, 6, dt);
    this.bodyRoll = damp(this.bodyRoll, this.targetRoll, 6, dt);
  }

  /** Restrained idle micro-motion keyed by joint role. */
  private idleFor(name: string, t: number): number {
    const h = hash(name) * TWO_PI;
    if (name.includes("knee")) return Math.sin(t * 1.1 + h) * 0.01 + Math.sin(t * 6.7 + h) * 0.002;
    if (name.includes("ankle")) return -Math.sin(t * 1.05 + h) * 0.007;
    return Math.sin(t * 0.42 + h) * 0.008; // hip sway
  }

  /** Environment-aware pose adjustments — real operating-mode behaviour. */
  private envMod(name: string, t: number, env: EnvId): number {
    if (!name.includes("hip")) return 0;
    const side = name.includes("L") ? 1 : -1;
    if (env === "grass") return 0.06 * side; // wider stance outdoors
    if (env === "night") return Math.sin(t * 0.5) * 0.05 * side; // slow scan
    if (env === "concrete") return 0.03 * side; // planted inspection stance
    return 0;
  }

  private driveWave(t: number) {
    this.target.RL_knee_joint = 0.95;
    this.target.RR_knee_joint = 0.95;
    this.target.RL_ankle_joint = -1.35;
    this.target.RR_ankle_joint = -1.35;
    this.target.FR_knee_joint = 0.85;
    this.target.FR_ankle_joint = -1.2;
    this.target.FL_knee_joint = -0.4 + Math.sin(t * 6) * 0.15;
    this.target.FL_ankle_joint = 0.4 + Math.sin(t * 6 + 0.6) * 0.5;
    this.target.FL_hip_joint = 0.25 + Math.sin(t * 3) * 0.12;
    this.targetBodyY = -0.02;
    this.targetPitch = 0;
    this.targetRoll = 0;
  }

  private driveBalance(t: number) {
    const roll = Math.sin(t * 1.4) * 0.22;
    const pitch = Math.sin(t * 1.1 + 1) * 0.12;
    LEGS.forEach((leg) => {
      const side = leg.endsWith("L") ? 1 : -1;
      const front = leg.startsWith("F") ? 1 : -1;
      this.target[`${leg}_hip_joint`] = roll * side;
      this.target[`${leg}_knee_joint`] = STAND_KNEE + pitch * front + roll * side * 0.1;
      this.target[`${leg}_ankle_joint`] = STAND_ANKLE - pitch * front * 0.8;
    });
    this.targetBodyY = Math.sin(t * 1.4) * 0.008;
    this.targetRoll = roll * 0.4;
    this.targetPitch = pitch * 0.4;
  }

  private driveGait(dt: number, mode: { id: string; turn: -1 | 0 | 1 }, speed: number) {
    const gait = GAIT_MAP[mode.id] ?? GAIT_MAP.trot;
    this.gaitClock += dt * gait.freq * speed;
    const liftGain = gait.lift;
    const pushGain = gait.push;

    LEGS.forEach((leg) => {
      const phase = TWO_PI * ((this.gaitClock + gait.offsets[leg]) % 1);
      const s = Math.sin(phase);
      const c = Math.cos(phase);
      const lift = Math.max(0, s);
      this.target[`${leg}_knee_joint`] = STAND_KNEE - liftGain * lift + pushGain * c;
      this.target[`${leg}_ankle_joint`] = STAND_ANKLE + liftGain * 1.3 * lift - pushGain * c;
      const side = leg.endsWith("L") ? 1 : -1;
      this.target[`${leg}_hip_joint`] = mode.turn * 0.28 * side;
    });

    this.targetBodyY = Math.sin(TWO_PI * this.gaitClock * 2) * 0.006 * speed;
    this.targetPitch = 0;
    this.targetRoll = 0;
  }
}
