export type Accent = "cyan" | "emerald" | "pink";

export interface HardwareCard {
  id: string;
  title: string;
  spec: string;
  detail: string;
  accent: Accent;
  /** Grid span on desktop. */
  span: "sm" | "md" | "lg";
  /** Hardware present now vs wired-for-future capability. */
  status: "integrated" | "ready";
}

/**
 * Actual BARQ hardware. "integrated" = present and in use; "ready" = the part
 * is on the platform and wired, with its software use still in development.
 */
export const HARDWARE: HardwareCard[] = [
  {
    id: "compute",
    title: "Compute",
    spec: "NVIDIA Jetson Orin Nano",
    detail:
      "On-board Linux computer. Chosen so ROS, computer vision and future autonomy can all run on one edge platform instead of a tethered PC.",
    accent: "cyan",
    span: "lg",
    status: "integrated",
  },
  {
    id: "imu",
    title: "IMU",
    spec: "HW-290",
    detail:
      "Body-orientation sensing for balance and stabilization — the feedback source for future closed-loop locomotion.",
    accent: "pink",
    span: "sm",
    status: "integrated",
  },
  {
    id: "actuation",
    title: "Actuation",
    spec: "12 × DS3240MG",
    detail:
      "High-torque digital servos — three per leg. Every joint shares one calibrated control path so poses and gaits are reproducible.",
    accent: "emerald",
    span: "md",
    status: "integrated",
  },
  {
    id: "power",
    title: "Power",
    spec: "4S LiPo · 6400 mAh",
    detail:
      "A dedicated high-current buck converter feeds the servo rail so twelve simultaneous actuation loads don't brown out the compute.",
    accent: "emerald",
    span: "md",
    status: "integrated",
  },
  {
    id: "driver",
    title: "Servo Driver",
    spec: "PCA9685",
    detail:
      "16-channel, 12-bit PWM controller over I²C. It off-loads precise pulse timing so the Jetson issues joint targets, not waveforms.",
    accent: "cyan",
    span: "md",
    status: "integrated",
  },
  {
    id: "structure",
    title: "Structure",
    spec: "3D-printed · Fusion 360",
    detail:
      "Custom structural parts modelled in Fusion 360 and printed. Designed for modularity, easy maintenance and rapid iteration.",
    accent: "pink",
    span: "md",
    status: "integrated",
  },
  {
    id: "lidar",
    title: "LiDAR",
    spec: "YDLIDAR G2",
    detail:
      "360° 2D ranging on-board and wired in — targeted at mapping and environment perception as the navigation stack comes online.",
    accent: "cyan",
    span: "md",
    status: "ready",
  },
  {
    id: "vision",
    title: "Vision",
    spec: "IMX219 CSI",
    detail:
      "CSI camera input for the vision subsystem — the entry point for future object detection and visual SLAM.",
    accent: "emerald",
    span: "md",
    status: "ready",
  },
];

export interface StackNode {
  id: string;
  label: string;
  layer: number; // 0 top .. n bottom
  accent: Accent;
  /** Marks a node whose software is planned rather than implemented. */
  planned?: boolean;
}

/** The real, modular software architecture — bottom (description) to top (motion). */
export const STACK_NODES: StackNode[] = [
  { id: "ik", label: "Inverse Kinematics", layer: 0, accent: "cyan" },
  { id: "fsm", label: "FSM Gait Control", layer: 0, accent: "cyan" },
  { id: "imu", label: "IMU Stabilization", layer: 1, accent: "emerald" },
  { id: "vision", label: "OpenCV Vision", layer: 1, accent: "emerald", planned: true },
  { id: "ros", label: "ROS", layer: 2, accent: "pink" },
  { id: "py", label: "Python Services", layer: 2, accent: "pink" },
  { id: "urdf", label: "URDF Model", layer: 3, accent: "cyan" },
  { id: "sim", label: "Webots · Isaac (planned)", layer: 3, accent: "cyan" },
];

export const STACK_LAYERS = ["Motion & Kinematics", "Sensing", "Runtime", "Description & Sim"];

/** The engineering pipeline, mechanical CAD through to future autonomy. */
export interface PipelineStep {
  id: string;
  label: string;
  note: string;
  future?: boolean;
}

export const PIPELINE: PipelineStep[] = [
  { id: "cad", label: "Mechanical CAD", note: "Full robot modelled in Fusion 360." },
  { id: "urdf", label: "URDF Generation", note: "CAD exported to a URDF — the single source of truth." },
  { id: "sim", label: "Simulation", note: "Kinematics validated in Webots and the web viewer." },
  { id: "viz", label: "Visualization", note: "Live 3D visualization and debugging tools." },
  { id: "electronics", label: "Electronics", note: "Jetson, PCA9685, power and sensors integrated." },
  { id: "cal", label: "Calibration", note: "Per-servo zeroing and joint-level abstraction." },
  { id: "motion", label: "Motion Development", note: "Forward / inverse kinematics and pose control." },
  { id: "validation", label: "Hardware Validation", note: "Poses and stances verified on the real robot." },
  { id: "autonomy", label: "Autonomous Behaviours", note: "Navigation and perception — planned.", future: true },
];

/** Capabilities that exist today on the platform. */
export const CAPABILITIES_NOW: string[] = [
  "Stable standing",
  "Inverse kinematics",
  "Body pose control",
  "Servo calibration",
  "Real-time visualization",
  "Modular software architecture",
  "Sensor integration",
  "Simulation compatibility",
];

/** Clearly-future milestones on the roadmap. */
export const ROADMAP: string[] = [
  "Dynamic walking",
  "Improved gait generation",
  "Closed-loop balance",
  "Terrain adaptation",
  "Autonomous navigation",
  "SLAM",
  "Computer vision",
  "Obstacle avoidance",
  "Mission planning",
  "AI-assisted locomotion",
  "Sim-to-real workflow",
  "Edge AI perception",
];

/** Technical highlights — each explains why the feature exists. */
export interface Highlight {
  id: string;
  title: string;
  why: string;
  accent: Accent;
}

export const HIGHLIGHTS: Highlight[] = [
  { id: "dof", title: "12 DOF Architecture", why: "Three joints per leg give each foot full 3D placement for legged locomotion.", accent: "cyan" },
  { id: "urdf", title: "Custom URDF", why: "One description drives simulation, visualization and control — no drift between them.", accent: "emerald" },
  { id: "jetson", title: "Jetson Compute", why: "Edge GPU headroom so perception and control live on the robot, not a laptop.", accent: "pink" },
  { id: "imu", title: "Integrated IMU", why: "Orientation feedback is the foundation for balance and closed-loop motion.", accent: "cyan" },
  { id: "lidar", title: "LiDAR Ready", why: "360° ranging is on-board so mapping can be developed without new hardware.", accent: "emerald" },
  { id: "vision", title: "Vision Ready", why: "CSI cameras are wired in for future detection and visual SLAM.", accent: "pink" },
  { id: "chassis", title: "3D-Printed Chassis", why: "Printed parts make every link cheap to iterate and easy to repair.", accent: "cyan" },
  { id: "fusion", title: "Fusion 360 Design", why: "Parametric CAD keeps the mechanical design modular and revisable.", accent: "emerald" },
  { id: "ros", title: "ROS Compatible", why: "Standard middleware so the stack can grow into the wider robotics ecosystem.", accent: "pink" },
  { id: "sim", title: "Simulation Pipeline", why: "Motion is proven in simulation before it ever touches a servo.", accent: "cyan" },
  { id: "electronics", title: "Modular Electronics", why: "PCA9685 + isolated power let subsystems be swapped independently.", accent: "emerald" },
  { id: "validation", title: "Real Hardware Validation", why: "Every capability is tested on the physical robot, not just on screen.", accent: "pink" },
];
