"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Mesh, Object3D, Quaternion, Vector3 } from "three";
import { useApp } from "@/lib/store";
import { LEGS, PARTS } from "@/lib/robot-config";
import { ACCENT } from "@/lib/accent";
import { damp } from "@/lib/utils";

interface PartMat {
  emissive: Color;
  emissiveIntensity?: number;
  wireframe: boolean;
  transparent: boolean;
  opacity: number;
  depthWrite: boolean;
}

interface Tracked {
  link: Object3D;
  rest: Vector3;
  offsetDir: Vector3; // local-space unit direction to travel
  dist: number;
  mats: PartMat[];
}

/**
 * Relative heat per link, driven when the thermal camera is up.
 *
 * The thermal pass maps scene *luminance* to false colour, so the way to make
 * a part read hot is to make it physically brighter — emissive is the heat
 * source. Weighting follows where the energy actually goes: the chassis
 * carries compute, the power distribution and the IMU and runs hottest; the
 * hip and thigh servos take most of the mechanical load; the lower legs are
 * mostly structure and stay near ambient.
 */
/** Near-white: the ramp reads luminance, so hot means bright. */
const HEAT_COLOR = "#fff0d8";

function heatFor(linkName: string): number {
  if (linkName === "base_link") return 1;
  if (linkName.endsWith("_coxa_link")) return 0.62;
  if (linkName.endsWith("_femur_link")) return 0.5;
  return 0.16;
}

/**
 * A component type highlights every instance of it — hovering "coxa" lights all
 * four legs, not just the front-left. Chassis is the single base link.
 */
function linkMatchesPart(partId: string | undefined, linkName: string): boolean {
  if (!partId) return false;
  if (partId === "chassis") return linkName === "base_link";
  return linkName.endsWith(`_${partId}_link`);
}

/**
 * The teardown driver. Captures each leg link's rest transform once, then eases
 * every link outward along its leg axis proportional to the store's `exploded`
 * value — a reversible, spring-damped explosion. Hovered parts glow.
 */
export function Teardown3D() {
  const robot = useApp((s) => s.robot);
  const tracked = useRef<Tracked[]>([]);
  const eased = useRef(0);
  const glow = useRef<Record<string, number>>({});
  const pulse = useRef(0);

  useEffect(() => {
    if (!robot) return;
    const list: Tracked[] = [];
    const center = new Vector3();
    (robot.links["base_link"] ?? robot).getWorldPosition(center);

    // Give each tracked link its own materials so we can glow it in isolation.
    const prepare = (link: Object3D): PartMat[] => {
      const mats: PartMat[] = [];
      link.traverse((o) => {
        const mesh = o as Mesh;
        if (!mesh.isMesh) return;
        const src = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const cloned = src.map((m) => m.clone());
        mesh.material = cloned.length === 1 ? cloned[0] : cloned;
        cloned.forEach((m) => {
          const em = m as unknown as PartMat;
          if (em.emissive) mats.push(em);
        });
      });
      return mats;
    };

    // Lift the chassis straight up.
    const base = robot.links["base_link"];
    if (base) {
      const invQ = base.parent
        ? base.parent.getWorldQuaternion(new Quaternion()).invert()
        : new Quaternion();
      list.push({
        link: base,
        rest: base.position.clone(),
        offsetDir: new Vector3(0, 1, 0).applyQuaternion(invQ),
        dist: 0.1,
        mats: prepare(base),
      });
    }

    // Each leg's links slide outward along the leg's horizontal axis.
    for (const leg of LEGS) {
      const coxa = robot.links[`${leg}_coxa_link`];
      const femur = robot.links[`${leg}_femur_link`];
      const tibia = robot.links[`${leg}_tibia_link`];
      if (!coxa) continue;

      const coxaWorld = coxa.getWorldPosition(new Vector3());
      const outward = coxaWorld.clone().sub(center);
      outward.y = 0;
      outward.normalize();

      [coxa, femur, tibia].forEach((link) => {
        if (!link || !link.parent) return;
        const invQ = link.parent.getWorldQuaternion(new Quaternion()).invert();
        list.push({
          link,
          rest: link.position.clone(),
          offsetDir: outward.clone().applyQuaternion(invQ),
          dist: 0.05,
          mats: prepare(link),
        });
      });
    }

    tracked.current = list;
    return () => {
      // Restore rest positions when unmounting.
      for (const t of tracked.current) t.link.position.copy(t.rest);
      tracked.current = [];
    };
  }, [robot]);

  useFrame((_, delta) => {
    const list = tracked.current;
    if (!list.length) return;
    const dt = Math.min(delta, 0.05);
    const { exploded, hoveredPart, thermal } = useApp.getState();
    eased.current = damp(eased.current, exploded, 6, dt);
    const e = eased.current;

    // A slow pulse, so the body reads as a live thermal source rather than a
    // static glow — the sensor image never sits perfectly still.
    if (!useApp.getState().debug) pulse.current += dt;
    const breathe = 0.9 + Math.sin(pulse.current * 1.6) * 0.1;

    const part = PARTS.find((p) => p.id === hoveredPart);
    const accent = part ? ACCENT[part.accent].hex : "#ff8a20";

    for (const t of list) {
      t.link.position.copy(t.rest).addScaledVector(t.offsetDir, e * t.dist);

      // `ghost` is how far this link recedes: 0 when nothing is hovered or
      // this *is* the hovered part, 1 when some other part has focus.
      const key = t.link.name;
      const isFocus = linkMatchesPart(part?.id, t.link.name);
      const want = part && !isFocus ? 1 : 0;
      glow.current[key] = damp(glow.current[key] ?? 0, want, 7, dt);
      const g = glow.current[key];

      for (const m of t.mats) {
        // Everything but the focused part drops to a wireframe skeleton, so
        // the part you are inspecting is the only solid object in the scene.
        // Reading the part out of the surrounding structure beats flooding it
        // with colour — the geometry does the pointing.
        m.wireframe = g > 0.5;
        m.transparent = g > 0.01;
        m.opacity = 1 - g * 0.62;
        m.depthWrite = g < 0.5;

        // Emissive does double duty: the hover lift, and the heat signature
        // the thermal camera reads. Heat dominates when the camera is up, so
        // the chassis blooms hot while the lower legs stay near ambient.
        const heat = thermal * heatFor(key) * breathe;
        if (heat > 0.001) {
          m.emissive.set(HEAT_COLOR);
          // 0.5, not 1.9. At the old value the chassis saturated the ramp,
          // clipped to white-hot everywhere at once and then fed a huge bloom
          // — a sun rather than a warm body. A real IR image keeps its hottest
          // subject in the orange/yellow band with only small specular points
          // reaching white, so the gradient across the part stays readable.
          if (m.emissiveIntensity !== undefined) m.emissiveIntensity = heat * 0.5;
        } else {
          m.emissive.set(accent);
          if (m.emissiveIntensity !== undefined) {
            m.emissiveIntensity = isFocus ? 0.18 : 0;
          }
        }
      }
    }
  });

  return null;
}
