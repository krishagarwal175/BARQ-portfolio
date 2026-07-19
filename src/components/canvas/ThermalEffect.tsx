"use client";

import { forwardRef, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Effect, EffectAttribute } from "postprocessing";
import { Uniform, Vector2, Vector3 } from "three";
import { useApp } from "@/lib/store";

/**
 * A thermal-camera pass.
 *
 * The first version mapped scene luminance straight to false colour, which was
 * wrong in a way that only showed up against this background: the ambient
 * ember field is bright orange, so the *sky* registered as the hottest thing
 * in frame and the robot had nothing to contrast against. An IR sensor does
 * not work that way — background is background, near-uniform and cold.
 *
 * So the pass samples depth. Anything at the far plane is scene background and
 * is forced to the cold end of the ramp regardless of how bright it looked;
 * only real geometry radiates. That single change is what makes the image read
 * as a sensor rather than a colour filter.
 *
 * Heat on the robot is not uniform either. It is dominated by a Gaussian core
 * centred on the chassis — where the compute, power distribution and IMU sit —
 * falling off with distance, so warmth *dissipates outward* through the frame
 * and down the legs the way conducted heat actually does. The core position is
 * the robot's own body, projected to screen space each frame.
 */

const FRAGMENT = /* glsl */ `
  uniform float uAmount;
  uniform float uTime;
  uniform vec2  uHot;      // screen-space centre of the chassis
  uniform float uAspect;
  uniform float uCore;     // strength of the body's hot core

  // Five-stop inferno ramp. Kept as mixes rather than a LUT texture so there
  // is no extra asset to ship or sample.
  vec3 inferno(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.03, 0.02, 0.10);   // cold — near-black indigo
    vec3 c1 = vec3(0.24, 0.05, 0.42);   // violet
    vec3 c2 = vec3(0.78, 0.16, 0.40);   // magenta
    vec3 c3 = vec3(1.00, 0.55, 0.09);   // orange
    vec3 c4 = vec3(1.00, 0.96, 0.80);   // white hot

    if (t < 0.28) return mix(c0, c1, t / 0.28);
    if (t < 0.52) return mix(c1, c2, (t - 0.28) / 0.24);
    if (t < 0.78) return mix(c2, c3, (t - 0.52) / 0.26);
    return mix(c3, c4, (t - 0.78) / 0.22);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
    // Depth is 1.0 at the far plane. The ambient field and the wordmark are
    // drawn with depthWrite off, so only the robot and the lab pad register.
    float isGeometry = 1.0 - step(0.9995, depth);

    // Distance from the chassis centre, aspect-corrected so the falloff is
    // circular on screen rather than stretched.
    vec2 d = uv - uHot;
    d.x *= uAspect;
    float r2 = dot(d, d);

    // The body's hot core, and the much weaker halo it radiates into the air
    // around it.
    float core = exp(-r2 * 30.0);
    float halo = exp(-r2 * 6.0);

    // Background: cold and near-uniform, with only a faint thermal bloom
    // around the machine. Explicitly NOT derived from scene luminance.
    float ambient = 0.055 + 0.035 * (1.0 - uv.y) + halo * 0.16 * uCore;

    // Geometry: a floor of radiated heat, the emissive signature the robot
    // materials carry, and the dominant core falling off from the chassis.
    float lum = dot(inputColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    float body = 0.30 + pow(lum, 0.9) * 0.42 + core * 0.62 * uCore + halo * 0.16;

    float heat = mix(ambient, body, isGeometry);

    // Sensor noise and a slow scan band — the tells that sell this as a live
    // instrument feed rather than a gradient map.
    float grain = fract(sin(dot(uv * 1024.0, vec2(12.9898, 78.233))) * 43758.5453);
    heat += (grain - 0.5) * 0.03;
    heat += sin(uv.y * 240.0 + uTime * 2.0) * 0.005;

    vec3 thermal = inferno(heat);
    outputColor = vec4(mix(inputColor.rgb, thermal, uAmount), inputColor.a);
  }
`;

class ThermalImpl extends Effect {
  constructor() {
    super("ThermalEffect", FRAGMENT, {
      // Requests the depth texture and switches mainImage to the depth-aware
      // signature. Without this the pass cannot separate subject from sky.
      attributes: EffectAttribute.DEPTH,
      uniforms: new Map<string, Uniform<number | Vector2>>([
        ["uAmount", new Uniform(0)],
        ["uTime", new Uniform(0)],
        ["uHot", new Uniform(new Vector2(0.5, 0.5))],
        ["uAspect", new Uniform(1)],
        ["uCore", new Uniform(1)],
      ]),
    });
  }
}

export const ThermalEffect = forwardRef<ThermalImpl, Record<string, never>>(
  function ThermalEffect(_props, ref) {
    const { camera, size } = useThree();
    const effect = useMemo(() => new ThermalImpl(), []);
    const world = useRef(new Vector3());

    useFrame((_, delta) => {
      const u = effect.uniforms;
      // Read from the store here rather than through a hook: this value
      // changes every scroll tick, and subscribing would re-render the whole
      // effect chain each time.
      const { thermal, robotGroup } = useApp.getState();
      u.get("uAmount")!.value = thermal;
      u.get("uTime")!.value = (u.get("uTime")!.value as number) + Math.min(delta, 0.05);
      u.get("uAspect")!.value = size.width / size.height;

      // Project the chassis to screen space so the hot core tracks the body
      // as the camera orbits.
      const group = robotGroup;
      if (group) {
        group.getWorldPosition(world.current);
        // Lift to roughly chassis height — the group origin sits at the feet.
        world.current.y += 0.22;
        world.current.project(camera);
        const hot = u.get("uHot")!.value as Vector2;
        hot.set(world.current.x * 0.5 + 0.5, world.current.y * 0.5 + 0.5);
      }
    });

    return <primitive ref={ref} object={effect} dispose={null} />;
  },
);
