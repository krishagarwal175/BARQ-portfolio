"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Group, Material, Mesh } from "three";
import { ENV_MAP } from "@/lib/environments";
import { useApp } from "@/lib/store";
import { damp } from "@/lib/utils";

/**
 * Lighting built for a robot that floats in the ember field rather than one
 * that sits in a neutral studio.
 *
 * The important part is the image-based rig: the robot's legs and chassis are
 * metal (metalness 0.7–0.8), and metal takes almost all of its appearance from
 * reflections, not from diffuse light. While the Lightformer panels were cool
 * white and blue the robot read as a flat grey cut-out pasted over a warm
 * background — lit correctly, but lit for a different room. Tinting the rig
 * into the same ember family as the field is what makes it look like it is
 * actually in the scene.
 *
 * A strong ember rim from behind does the rest: with no ground plane under it
 * for most of the page, that lit edge is the only thing separating the
 * silhouette from the background.
 */

/** Deep ember rather than black — a black shadow on a warm floor reads dirty. */
const SHADOW_COLOR = "#1a0602";
const SHADOW_OPACITY = 0.62;

/** Grounding shadow only makes sense where there is ground — i.e. the Lab. */
function GroundShadow() {
  const ready = useApp((s) => s.ready);
  const labActive = useApp((s) => s.labActive);

  const ref = useRef<Group>(null);
  const amount = useRef(0);
  const peak = SHADOW_OPACITY;

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    amount.current = damp(
      amount.current,
      ready && labActive ? 1 : 0,
      2.4,
      Math.min(delta, 0.05),
    );
    g.visible = amount.current > 0.01;
    if (!g.visible) return;
    g.traverse((child) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as Material;
      if (mat) mat.opacity = amount.current * peak;
    });
  });

  return (
    <group ref={ref} visible={false}>
      <ContactShadows
        position={[0, 0.004, 0]}
        opacity={peak}
        scale={2.6}
        blur={3.2}
        far={0.9}
        resolution={512}
        color={SHADOW_COLOR}
      />
    </group>
  );
}

export function Lighting() {
  const env = useApp((s) => s.env);
  const def = ENV_MAP[env];
  const boost = def.exposure ?? 1;

  return (
    <>
      {/* Warm ambient — the field bounces a lot of orange back up. */}
      <ambientLight intensity={0.22 * boost} color="#ffcfa8" />

      {/* Key — the only shadow caster. */}
      <directionalLight
        position={[2.6, 4.0, 2.4]}
        intensity={2.3 * boost}
        color="#fff2e2"
        castShadow
        /* 1024, not 2048. The frustum is only 1.6 m across, so this still
           resolves ~1.5 mm per texel on a 0.35 m robot — visually identical
           here, at a quarter of the shadow-pass fill cost every frame. */
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.004}
      >
        <orthographicCamera attach="shadow-camera" args={[-0.8, 0.8, 0.8, -0.8, 3.2, 7.6]} />
      </directionalLight>

      {/* Ember rim from behind — the silhouette separator while floating. */}
      <directionalLight position={[-2.6, 1.8, -2.8]} intensity={2.6 * boost} color="#ff7a14" />
      {/* Second rim, higher and tighter, to catch the top edges of the chassis. */}
      <directionalLight position={[-0.6, 3.2, -1.8]} intensity={1.1 * boost} color="#ffab40" />
      {/* Cool low fill so the shadow cores keep some form instead of crushing. */}
      <directionalLight position={[-1.2, 0.4, 2.0]} intensity={0.5 * boost} color="#8fa6c8" />

      <Environment resolution={256} background={false}>
        {/* Soft top key panel — warm white. */}
        <Lightformer
          form="rect"
          intensity={3.0}
          color="#fff1e0"
          position={[0, 5, 1]}
          scale={[8, 4, 1]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
        {/* Ember side softbox — the dominant reflection in the metal. */}
        <Lightformer
          form="rect"
          intensity={2.6}
          color="#ff7a14"
          position={[-5, 2, -1]}
          scale={[5, 5, 1]}
          rotation={[0, Math.PI / 2.5, 0]}
        />
        {/* Deep red opposite, so the two sides of the chassis differ. */}
        <Lightformer
          form="rect"
          intensity={1.7}
          color="#d62e07"
          position={[5, 1.5, 0]}
          scale={[4, 5, 1]}
          rotation={[0, -Math.PI / 2.5, 0]}
        />
        {/* Front fill — kept near-white so the front faces stay readable. */}
        <Lightformer
          form="circle"
          intensity={1.5}
          color="#ffe6cc"
          position={[0, 1, 6]}
          scale={[4, 4, 1]}
        />
        {/* Ground bounce, ember — sells the field continuing under the robot. */}
        <Lightformer
          form="rect"
          intensity={1.0}
          color="#c2500e"
          position={[0, -2, 1]}
          scale={[8, 4, 1]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      </Environment>

      <GroundShadow />
    </>
  );
}
