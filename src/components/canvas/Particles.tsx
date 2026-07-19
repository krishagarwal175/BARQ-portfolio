"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, Points } from "three";

/** Faint volumetric dust that drifts around the robot — atmosphere, not noise. */
export function Particles({ count = 420 }: { count?: number }) {
  const ref = useRef<Points>(null);

  const positions = useMemo(() => {
    // Seeded PRNG (mulberry32) — deterministic so it stays pure and SSR-safe.
    let s = 0x9e3779b9;
    const rand = () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * 6;
      arr[i * 3 + 1] = rand() * 3;
      arr[i * 3 + 2] = (rand() - 0.5) * 6;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.015;
    const attr = ref.current.geometry.getAttribute("position") as BufferAttribute;
    for (let i = 0; i < count; i++) {
      const y = attr.getY(i) + 0.0009 * (0.5 + (i % 5) * 0.1);
      attr.setY(i, y > 3 ? 0 : y);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.006}
        color="#8fb7ff"
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
