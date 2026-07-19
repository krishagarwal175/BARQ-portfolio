"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import {
  FogExp2,
  Material,
  Mesh,
} from "three";
import { ENV_MAP } from "@/lib/environments";
import { useApp } from "@/lib/store";

/** Deep ember — matches the base of the ambient field gradient. */
const FOG_TINT = "#160604";

/**
 * Applies the active environment to the scene: background, fog and the robot's
 * material mode (normal / wireframe / blueprint). Original materials are cached
 * on first touch so switching back is lossless.
 */
export function EnvController() {
  const { scene } = useThree();
  const env = useApp((s) => s.env);
  const robot = useApp((s) => s.robot);

  /**
   * Wireframe clones of the robot's own materials, cached per source material.
   *
   * Blueprint originally swapped in a flat cyan MeshBasicMaterial, then a flat
   * grey one — both unlit, so the robot went matte and lost every highlight.
   * The teardown's ghost does something different and better: it keeps the
   * PBR material and simply turns `wireframe` on, so the skeleton stays the
   * machine's own dark graphite *and still takes light* — rim, reflections and
   * all. This does the same, cloning once per unique source material so the
   * originals are never mutated and switching back is lossless.
   */
  const wireCache = useRef(new Map<Material, Material>());
  const wireframeOf = (src: Material): Material => {
    const hit = wireCache.current.get(src);
    if (hit) return hit;
    const clone = src.clone() as Material & { wireframe?: boolean };
    clone.wireframe = true;
    clone.transparent = true;
    clone.opacity = 0.62;
    clone.depthWrite = false;
    wireCache.current.set(src, clone);
    return clone;
  };

  // Fog only — the background stays null so the ambient field behind the
  // transparent canvas shows through. Fog is tinted to the ember ground
  // rather than the environment's own background colour, otherwise the floor
  // fades to a cold grey that fights the field it is sitting on.
  useEffect(() => {
    const def = ENV_MAP[env];
    scene.background = null;
    scene.fog = def.fog > 0 ? new FogExp2(FOG_TINT, def.fog) : null;
  }, [env, scene]);

  // Robot material mode.
  useEffect(() => {
    if (!robot) return;
    const def = ENV_MAP[env];
    robot.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      if (!mesh.userData.originalMaterial) {
        mesh.userData.originalMaterial = mesh.material as Material;
      }
      const original = mesh.userData.originalMaterial as Material;
      mesh.material =
        def.material === "wireframe" || def.material === "blueprint"
          ? wireframeOf(original)
          : original;
    });
  }, [env, robot]);

  return null;
}
