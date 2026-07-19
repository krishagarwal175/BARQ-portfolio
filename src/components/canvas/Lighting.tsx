"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Box3, Group, Material, Mesh, PointLight, Vector3 } from "three";
import { REVEAL_SHIFT } from "@/lib/camera-keyframes";
import { lightRig } from "@/lib/debug";
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

/**
 * Lights the underside during the opening reveal.
 *
 * Every lamp in the main rig is above the robot, which is correct for a
 * machine standing in a room and useless for a shot taken from beneath it —
 * the engraved panel sat in full shadow. Two lamps fix it: a soft fill so the
 * plate is legible at all, and a grazing light raking across it at a shallow
 * angle so the cut letters throw their own micro-shadows and read as relief
 * rather than as a flat texture. Both fade out as the camera pulls back, so
 * they never touch the normal lighting.
 */
function RevealLight() {
  const fill = useRef<PointLight>(null);
  const graze = useRef<PointLight>(null);
  const rake = useRef<PointLight>(null);
  const box = useRef(new Box3());
  const mark = useRef(new Vector3());

  useFrame(() => {
    const f = fill.current;
    const g = graze.current;
    const r = rake.current;
    if (!f || !g || !r) return;

    const { reveal, robot, debug } = useApp.getState();
    // Held at full while debugging. The camera rig owns `reveal`, and it stands
    // down in debug mode — so the value sat at its initial 1, `amount` computed
    // to 0, and these lamps were switched off before a single slider value was
    // read. Nothing responded because nothing was lit.
    const amount = debug ? 1 : 1 - Math.min(1, Math.max(0, reveal));
    // Every value comes from the live rig, so the debug sliders drive the real
    // lamps and the defaults in that object are exactly what ships.
    const { fill: LF, key: LK, opposite: LO } = lightRig;

    f.intensity = amount * LF.intensity;
    g.intensity = amount * LK.intensity;
    r.intensity = amount * LO.intensity;
    f.visible = amount > 0.01;
    g.visible = f.visible;
    r.visible = f.visible;
    if (!f.visible) return;

    const base = robot?.links?.["base_link"];
    if (!base) return;
    box.current.setFromObject(base);
    if (box.current.isEmpty()) return;
    box.current.getCenter(mark.current);
    mark.current.y = box.current.min.y;
    // Same shift the camera uses. Without it these lamps sat under the feet —
    // a quarter of a metre below the panel they were meant to rake — which is
    // why cranking the intensity alone never lit anything.
    mark.current.x += REVEAL_SHIFT[0];
    mark.current.y += REVEAL_SHIFT[1];
    mark.current.z += REVEAL_SHIFT[2];

    f.position.set(mark.current.x + LF.x, mark.current.y + LF.y, mark.current.z + LF.z);
    // The key rakes: held almost level with the plate so the beam travels
    // nearly parallel to it. Light arriving square on returns a flat grey
    // panel; light skimming across strikes the wall of every cut and throws a
    // shadow off every edge, and that shadow is what reads as depth.
    g.position.set(mark.current.x + LK.x, mark.current.y + LK.y, mark.current.z + LK.z);
    r.position.set(mark.current.x + LO.x, mark.current.y + LO.y, mark.current.z + LO.z);

    f.color.set(LF.color);
    g.color.set(LK.color);
    r.color.set(LO.color);
    f.distance = LF.distance;
    g.distance = LK.distance;
    r.distance = LO.distance;
  });

  return (
    <>
      <pointLight ref={fill} color="#ffd9b0" distance={0.9} decay={2} visible={false} />
      <pointLight ref={graze} color="#ffcb96" distance={1.6} decay={2} visible={false} />
      <pointLight ref={rake} color="#ff8f45" distance={0.9} decay={2} visible={false} />
    </>
  );
}

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

      <RevealLight />
      <GroundShadow />
    </>
  );
}
