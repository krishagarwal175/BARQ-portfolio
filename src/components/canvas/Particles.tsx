"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Points, ShaderMaterial } from "three";

/**
 * Faint volumetric dust that drifts around the robot — atmosphere, not noise.
 *
 * The drift used to be a CPU loop: 420 positions rewritten and the whole
 * buffer re-uploaded to the GPU every frame, for motion that is a single add.
 * It now runs in the vertex shader off a time uniform, so the geometry is
 * uploaded once and never touched again — no per-frame main-thread work and no
 * buffer traffic. Each mote carries its own speed in a second attribute, which
 * preserves the uneven, non-marching feel of the original.
 */
const VERT = /* glsl */ `
  attribute float aSpeed;
  uniform float uTime;
  uniform float uSize;
  uniform float uScale;   // viewport height / 2, matching three's attenuation
  varying float vFade;

  void main() {
    vec3 p = position;
    // Rise and wrap. mod() gives the same loop the CPU version did with a
    // branch, and costs nothing.
    p.y = mod(p.y + uTime * aSpeed, 3.0);

    // Fade in off the floor and out at the ceiling so wrapping is invisible.
    vFade = smoothstep(0.0, 0.4, p.y) * (1.0 - smoothstep(2.3, 3.0, p.y));

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    // Mirrors PointsMaterial's sizeAttenuation: size * (halfHeight / -z).
    // Hardcoding a constant here made motes ~480px wide — giant bokeh.
    // Clamped. Attenuation is 1/z, so a mote drifting close to the camera
    // scales without bound and fills the screen as a soft disc — the bokeh
    // blobs. Dust should never be more than a few pixels across.
    gl_PointSize = clamp(uSize * (uScale / -mv.z), 1.0, 4.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFade;

  void main() {
    // Round the point sprite off; square dust reads as dead pixels.
    vec2 d = gl_PointCoord - 0.5;
    float a = (1.0 - smoothstep(0.35, 0.5, length(d))) * uOpacity * vFade;
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

export function Particles({ count = 420 }: { count?: number }) {
  const ref = useRef<Points>(null);
  const mat = useRef<ShaderMaterial>(null);

  const { positions, speeds } = useMemo(() => {
    // Seeded PRNG (mulberry32) — deterministic so it stays pure and SSR-safe.
    let s = 0x9e3779b9;
    const rand = () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 6;
      pos[i * 3 + 1] = rand() * 3;
      pos[i * 3 + 2] = (rand() - 0.5) * 6;
      spd[i] = 0.04 + rand() * 0.05;
    }
    return { positions: pos, speeds: spd };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 0.006 },
      uScale: { value: 500 },
      uColor: { value: [0.56, 0.72, 1] },
      uOpacity: { value: 0.5 },
    }),
    [],
  );

  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.015;
    const u = mat.current?.uniforms;
    if (!u) return;
    u.uTime.value += Math.min(delta, 0.05);
    u.uScale.value = state.size.height * 0.5;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSpeed" args={[speeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
