"use client";

import { create } from "zustand";
import type { Group } from "three";
import type { URDFRobotLike } from "@/types/robot";

export type EnvId =
  | "studio"
  | "concrete"
  | "grass"
  | "warehouse"
  | "research"
  | "blueprint"
  | "night";

export type MotionMode =
  | { kind: "pose"; id: string }
  | { kind: "gait"; id: string; turn: -1 | 0 | 1 }
  | { kind: "demo"; id: "wave" | "balance" };

interface AppState {
  /* Loading */
  ready: boolean;
  progress: number;
  setProgress: (p: number) => void;
  setReady: (r: boolean) => void;

  /* The live robot instance, published once fully loaded. */
  robot: URDFRobotLike | null;
  setRobot: (r: URDFRobotLike | null) => void;
  /* The grounded/centred group wrapping the robot — the camera frames this. */
  robotGroup: Group | null;
  setRobotGroup: (g: Group | null) => void;

  /* Boot / intro */
  booted: boolean;
  setBooted: (b: boolean) => void;

  /* Scroll-driven narrative (0..1 across the whole page) */
  scroll: number;
  setScroll: (s: number) => void;
  /**
   * Signed scroll velocity, normalised to roughly -1..1. The robot banks into
   * it, so flicking the page makes the machine react rather than sit inert.
   */
  scrollVel: number;
  setScrollVel: (v: number) => void;
  /** Index of the active narrative section for the camera rig. */
  section: number;
  setSection: (i: number) => void;
  /**
   * Which way the robot should get out of the way of the active section's
   * copy. +1 pushes it to the right of frame (copy is on the left), -1 to the
   * left, 0 leaves it centred. The camera rig pans to satisfy this.
   */
  dodge: number;
  setDodge: (d: number) => void;

  /* Exploded teardown */
  exploded: number; // 0..1 spring target
  setExploded: (v: number) => void;
  hoveredPart: string | null;
  setHoveredPart: (id: string | null) => void;

  /* Robot lab */
  labActive: boolean;
  setLabActive: (v: boolean) => void;
  motion: MotionMode;
  setMotion: (m: MotionMode) => void;
  gaitSpeed: number;
  setGaitSpeed: (v: number) => void;
  env: EnvId;
  setEnv: (e: EnvId) => void;

  /**
   * Thermal-camera amount, 0..1. Driven by the thermal section as it scrolls
   * into view; the postprocessing pass cross-fades against the normal render.
   */
  thermal: number;
  setThermal: (v: number) => void;

  /* Audio */
  muted: boolean;
  toggleMuted: () => void;
}

export const useApp = create<AppState>((set) => ({
  ready: false,
  progress: 0,
  setProgress: (p) => set({ progress: p }),
  setReady: (r) => set({ ready: r }),

  robot: null,
  setRobot: (r) => set({ robot: r }),
  robotGroup: null,
  setRobotGroup: (g) => set({ robotGroup: g }),

  booted: false,
  setBooted: (b) => set({ booted: b }),

  scroll: 0,
  setScroll: (s) => set({ scroll: s }),
  scrollVel: 0,
  setScrollVel: (v) => set({ scrollVel: v }),
  section: 0,
  setSection: (i) => set({ section: i }),
  dodge: 0,
  setDodge: (d) => set({ dodge: d }),

  exploded: 0,
  setExploded: (v) => set({ exploded: v }),
  hoveredPart: null,
  setHoveredPart: (id) => set({ hoveredPart: id }),

  labActive: false,
  setLabActive: (v) => set({ labActive: v }),
  motion: { kind: "pose", id: "idle" },
  setMotion: (m) => set({ motion: m }),
  gaitSpeed: 1,
  setGaitSpeed: (v) => set({ gaitSpeed: v }),
  env: "studio",
  setEnv: (e) => set({ env: e }),

  thermal: 0,
  setThermal: (v) => set({ thermal: v }),

  muted: true,
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
}));
