import { Color, Mesh, MeshStandardMaterial } from "three";
import type { URDFRobotLike } from "@/types/robot";

/**
 * A physically based finish that reads as manufactured hardware (Unitree /
 * Boston Dynamics), not imported CAD. Frame is matte graphite; the legs are
 * brighter anodized aluminium; the lower legs a darker anodized tone.
 */
interface Finish {
  color: string;
  roughness: number;
  metalness: number;
  envMapIntensity: number;
}

const FRAME: Finish = { color: "#26282c", roughness: 0.82, metalness: 0.3, envMapIntensity: 0.7 };
const ALU: Finish = { color: "#3d4147", roughness: 0.46, metalness: 0.82, envMapIntensity: 1.0 };
const ALU_DARK: Finish = { color: "#2f3237", roughness: 0.56, metalness: 0.72, envMapIntensity: 0.9 };

function make(f: Finish) {
  return new MeshStandardMaterial({
    color: new Color(f.color),
    roughness: f.roughness,
    metalness: f.metalness,
    envMapIntensity: f.envMapIntensity,
  });
}

function finishFor(linkName: string): Finish {
  if (linkName.includes("coxa") || linkName.includes("femur")) return ALU;
  if (linkName.includes("tibia")) return ALU_DARK;
  return FRAME;
}

/**
 * Replaces every imported Collada material with a PBR finish keyed by the link
 * it belongs to. Returns the created materials so callers can dispose them.
 */
export function applyRobotMaterials(robot: URDFRobotLike): MeshStandardMaterial[] {
  const created: MeshStandardMaterial[] = [];
  const cache = new Map<string, MeshStandardMaterial>();

  for (const [name, link] of Object.entries(robot.links)) {
    const finish = finishFor(name);
    let mat = cache.get(finish.color);
    if (!mat) {
      mat = make(finish);
      cache.set(finish.color, mat);
      created.push(mat);
    }
    link.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      mesh.material = mat as MeshStandardMaterial;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
  }

  return created;
}
