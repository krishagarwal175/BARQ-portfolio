"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, OrbitControls, Preload } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import { CameraRig } from "./CameraRig";
import { Effects } from "./Effects";
import { Lighting } from "./Lighting";
import { Particles } from "./Particles";
import { Robot } from "./Robot";
import { useApp } from "@/lib/store";

function LabControls() {
  const labActive = useApp((s) => s.labActive);
  if (!labActive) return null;
  return (
    <OrbitControls
      makeDefault
      target={[0, 0.14, 0]}
      enablePan={false}
      minDistance={0.4}
      maxDistance={2.5}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI / 2 - 0.05}
      enableDamping
      dampingFactor={0.08}
    />
  );
}

/**
 * The single persistent WebGL scene shared across the whole experience.
 * Fixed behind the DOM content; sections drive it through the store.
 */
export function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0.62, 0.34, 0.72], fov: 38, near: 0.01, far: 100 }}
      gl={{
        antialias: false,
        powerPreference: "high-performance",
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#050505", 1);
      }}
    >
      <Suspense fallback={null}>
        <Lighting />
        <Robot />
        <Particles />
        <CameraRig />
        <LabControls />
        <Effects />
        <Preload all />
      </Suspense>
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
