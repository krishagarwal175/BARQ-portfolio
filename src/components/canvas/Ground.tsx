"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Group, ShaderMaterial } from "three";
import { useApp } from "@/lib/store";
import { damp } from "@/lib/utils";

/**
 * The Lab platform.
 *
 * Absent for most of the page — the robot floats in the ambient field with
 * nothing under it — and eases in only once the viewer reaches the Lab, where
 * a ground plane genuinely helps read stance height and orbit.
 *
 * It is not a flat plane. A flat plane over the ember field reads as a grey
 * slab laid on top of the artwork; this is a circular pad that dissolves at
 * its rim, so it belongs to the field rather than covering it. A measured grid
 * fades out with distance, a hot pool sits directly under the robot, and a
 * sweeping scan ring travels outward — the machine is standing on a test rig,
 * not on a floor.
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPos;
  void main() {
    vUv = uv;
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  varying vec3 vPos;

  uniform float uTime;
  uniform float uFade;      // 0..1 master reveal
  uniform vec3  uGrid;      // grid line colour
  uniform vec3  uGlow;      // hot pool under the robot
  uniform float uRadius;    // pad radius in local units

  // Antialiased grid lines with a configurable period.
  float gridLine(vec2 p, float period, float width) {
    vec2 g = abs(fract(p / period - 0.5) - 0.5) * period;
    vec2 fw = fwidth(p) * width;
    vec2 l = smoothstep(fw, vec2(0.0), g);
    return max(l.x, l.y);
  }

  void main() {
    // Radial distance from the pad centre, normalised.
    float d = length(vPos.xy) / uRadius;
    if (d > 1.0) discard;

    // Long dissolve. The fade has to start early and run most of the pad's
    // width — a late, tight falloff leaves a visible disc edge, which is
    // exactly the abrupt ending this replaces. By the time the geometry is
    // discarded at d = 1 there is nothing left to see.
    float edge = 1.0 - smoothstep(0.18, 0.98, d);
    edge *= edge;

    // Two grid densities: fine cells, heavier section lines every 5th.
    // Periods are world metres, sized so cells stay readable rather than
    // collapsing into moire at the far side of a much larger pad.
    float fine    = gridLine(vPos.xy, 0.10, 1.0) * 0.26;
    float section = gridLine(vPos.xy, 0.50, 1.4) * 0.5;
    float grid = max(fine, section);

    // Grid thins out well before the rim so it reads as depth, not wallpaper.
    grid *= 1.0 - smoothstep(0.05, 0.6, d);

    // Hot pool directly beneath the robot. The robot is ~0.35 m across, so
    // this is deliberately a small fraction of the pad.
    float pool = (1.0 - smoothstep(0.0, 0.16, d)) * 0.55;

    // Scan ring travelling outward on a slow loop.
    float ringT = fract(uTime * 0.14);
    float ring = smoothstep(0.02, 0.0, abs(d - ringT)) * (1.0 - ringT) * 0.45;

    vec3 col = uGrid * grid + uGlow * (pool + ring);
    float alpha = (grid * 0.9 + pool * 0.85 + ring) * edge * uFade;

    if (alpha < 0.003) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

/**
 * Local radius of the pad, in metres. The robot is roughly 0.35 m across, so
 * this is deliberately far larger than the subject: the pad has to run past
 * the edge of frame and dissolve out there, otherwise its rim is visible as a
 * disc the machine is standing on.
 */
const PAD_RADIUS = 4.2;

export function Ground() {
  const ready = useApp((s) => s.ready);
  const labActive = useApp((s) => s.labActive);

  const group = useRef<Group>(null);
  const mat = useRef<ShaderMaterial>(null);
  const fade = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uFade: { value: 0 },
      uGrid: { value: new Color("#ff9a3c") },
      uGlow: { value: new Color("#ff6a12") },
      uRadius: { value: PAD_RADIUS },
    }),
    [],
  );

  useFrame((_, delta) => {
    const g = group.current;
    const u = mat.current?.uniforms;
    if (!g || !u) return;

    const dt = Math.min(delta, 0.05);
    fade.current = damp(fade.current, ready && labActive ? 1 : 0, 2.4, dt);

    g.visible = fade.current > 0.01;
    if (!g.visible) return;

    if (!useApp.getState().debug) u.uTime.value += dt;
    u.uFade.value = fade.current;
  });

  return (
    <group ref={group} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <circleGeometry args={[PAD_RADIUS, 128]} />
        <shaderMaterial
          ref={mat}
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
