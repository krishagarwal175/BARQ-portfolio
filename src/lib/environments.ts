import type { EnvId } from "@/lib/store";

export type MaterialMode = "normal" | "wireframe" | "blueprint";

export interface EnvDef {
  id: EnvId;
  label: string;
  /** Scene background colour. */
  bg: string;
  /** Lab ground colour. */
  ground: string;
  /** Grid line colour. */
  grid: string;
  /** How the robot's meshes are rendered. */
  material: MaterialMode;
  /** Exponential fog density; 0 disables. */
  fog: number;
  /** Global lighting exposure multiplier for this environment. */
  exposure?: number;
  /** Floor treatment. */
  floor: "reflector" | "solid" | "grid";
  /** Roughness of a reflective/solid floor. */
  floorRoughness?: number;
}

/**
 * Ground and grid colours are tinted into the ember family. The canvas now
 * clears transparent over the ambient field, so a cold grey floor reads as a
 * slab sitting on top of the warm ground rather than part of it. Only the
 * colours moved — floor treatment, fog density and exposure are untouched.
 */
export const ENVIRONMENTS: EnvDef[] = [
  { id: "studio", label: "Dark Studio", bg: "#160604", ground: "#1a0a06", grid: "#3a1c10", material: "normal", fog: 0.12, exposure: 1, floor: "reflector", floorRoughness: 0.6 },
  { id: "concrete", label: "Industrial Lab", bg: "#1a0805", ground: "#3a2118", grid: "#5a3324", material: "normal", fog: 0.08, exposure: 1.08, floor: "solid", floorRoughness: 0.9 },
  { id: "grass", label: "Outdoor Grass", bg: "#1a0c04", ground: "#3a2410", grid: "#573618", material: "normal", fog: 0.09, exposure: 1.3, floor: "solid", floorRoughness: 1 },
  { id: "warehouse", label: "Warehouse Night", bg: "#140603", ground: "#241209", grid: "#442414", material: "normal", fog: 0.1, exposure: 0.92, floor: "solid", floorRoughness: 0.8 },
  { id: "research", label: "Research Lab", bg: "#2a0f06", ground: "#4a2415", grid: "#6b3a22", material: "normal", fog: 0.04, exposure: 1.15, floor: "solid", floorRoughness: 0.7 },
  { id: "blueprint", label: "Blueprint", bg: "#1c0803", ground: "#2e1408", grid: "#8a4a1c", material: "blueprint", fog: 0.08, exposure: 1, floor: "grid" },
  { id: "night", label: "Studio Night", bg: "#100402", ground: "#160805", grid: "#2e1409", material: "normal", fog: 0.18, exposure: 0.72, floor: "reflector", floorRoughness: 0.5 },
];

export const ENV_MAP = Object.fromEntries(ENVIRONMENTS.map((e) => [e.id, e])) as Record<
  EnvId,
  EnvDef
>;
