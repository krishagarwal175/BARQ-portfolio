"use client";

import { forwardRef, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Effect, EffectAttribute } from "postprocessing";
import { Uniform, Vector2, Vector3 } from "three";
import { useApp } from "@/lib/store";
import { damp } from "@/lib/utils";

/**
 * A thermal-camera pass.
 *
 * The first version mapped scene luminance straight to false colour, which was
 * wrong in a way that only showed up against this background: the ambient
 * ember field is bright orange, so the *sky* registered as the hottest thing
 * in frame and the robot had nothing to contrast against. An IR sensor does
 * not work that way — what the background looks like in visible light says
 * nothing about its temperature.
 *
 * So the pass samples depth. Anything at the far plane is scene background and
 * is given a temperature of its own rather than one inherited from its colour;
 * only real geometry radiates from the image. That separation is what makes
 * the result read as a sensor rather than a colour filter.
 *
 * The background is then imaged as a *room* — see `room()` — because a real IR
 * frame never returns a void. Above it rises a convection plume off the
 * chassis, which is the only thing in the frame that moves on its own.
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

  /**
   * The room the machine is being imaged in.
   *
   * Forcing the background to a flat cold value was right in principle — an IR
   * sensor must not read the ember sky as the hottest thing in frame — but it
   * left the robot floating in a void, and a real thermal frame never looks
   * like that. Every surface in a room holds some temperature, so the sensor
   * always returns structure: a bench that has soaked up heat, a wall that is
   * cooler the further it is from anything working, the uneven pooling of a
   * space that has been running a while.
   *
   * All analytic — no texture, no noise lookup. That keeps it cheap, and more
   * importantly keeps it smooth: a sampled field at this scale is exactly what
   * made the background grainy before.
   */
  float room(vec2 uv) {
    // The bench the robot works over. Below the horizon is a surface that has
    // been absorbing heat, above it is wall falling away into the cold.
    float above = smoothstep(0.300, 0.345, uv.y);
    float bench = 0.150 - (0.30 - uv.y) * 0.10;
    float wall  = 0.078 + (1.0 - uv.y) * 0.030;
    float t = mix(bench, wall, above);

    // Thermal mass on the wall — broad, low-frequency lobes. A room warms
    // unevenly, and these are what stop the upper half reading as flat paper.
    vec2 a = (uv - vec2(0.18, 0.74)) * vec2(1.0, 1.6);
    vec2 b = (uv - vec2(0.86, 0.58)) * vec2(1.0, 1.4);
    vec2 c = (uv - vec2(0.52, 0.90)) * vec2(1.0, 2.2);
    t += 0.034 * exp(-dot(a, a) * 7.0) * above;
    t += 0.026 * exp(-dot(b, b) * 11.0) * above;
    t -= 0.018 * exp(-dot(c, c) * 9.0) * above;

    // Faint regular structure — racking, panelling, the built edges of a lab.
    // Held very low contrast on purpose: it should register as "the sensor is
    // resolving a real surface", not as a pattern anyone is meant to look at.
    float slots = smoothstep(0.42, 0.58, abs(fract(uv.x * 26.0) - 0.5) * 2.0);
    float rows  = smoothstep(0.30, 0.70, abs(fract(uv.y * 15.0) - 0.5) * 2.0);
    t -= slots * rows * 0.020 * above;

    // The far corners of any frame are the coldest thing the sensor sees.
    vec2 v = uv - 0.5;
    t -= dot(v, v) * 0.075;

    return t;
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
    // around it. The core is deliberately tight: the heat sources are the
    // compute stack and power distribution in the middle of the chassis, so
    // anything much wider than the body itself is not physical.
    float core = exp(-r2 * 52.0);
    float halo = exp(-r2 * 6.0);

    // Background: the imaged room, plus the machine's own thermal bloom.
    // Explicitly NOT derived from scene luminance.
    float ambient = room(uv) + halo * 0.16 * uCore;

    // Convection plume. Twelve servos under load dump their heat into the air
    // above the chassis, and that column is the single clearest tell that this
    // is a live sensor and not a colour grade — it is the one part of the frame
    // that moves on its own. Narrow at the source, widening and cooling as it
    // rises, with a slow lateral wander so it drifts rather than pulses.
    float up = d.y;
    if (up > 0.0) {
      float width = 0.020 + up * 0.16;
      float wander = sin(up * 9.0 - uTime * 0.9) * 0.014
                   + sin(up * 21.0 - uTime * 1.7) * 0.006;
      float column = exp(-pow((d.x - wander) / width, 2.0));
      // Fades with height as the plume mixes into room air.
      ambient += column * exp(-up * 4.2) * 0.30 * uCore;
    }

    // Geometry, calibrated against the scale printed beside the section. The
    // ramp breakpoints ARE the legend stops — T_IDLE is where the violet band
    // starts, T_NOMINAL the magenta, T_LOAD the orange — so a reading taken off
    // the image can be checked against the label, which is the whole point of
    // showing a scale at all.
    //
    // The machine is idling, so that is what the great majority of it reports:
    // limbs, shells and feet sit at the bottom of the scale. Only the middle of
    // the chassis climbs, and only to between nominal and load, because that is
    // where the compute and power electronics are. The previous floor of 0.30
    // plus a large luminance term pushed the entire robot up into the magenta,
    // which read as a machine in thermal distress from head to toe.
    float T_IDLE    = 0.28;
    float T_NOMINAL = 0.52;
    float T_LOAD    = 0.78;

    float lum = dot(inputColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    // Luminance only modulates within the idle band — it carries material and
    // shading variation so the body is not a flat colour, and nothing more.
    float body = T_IDLE - 0.025 + pow(lum, 0.9) * 0.075;
    // The chassis core, landing between nominal and load at full strength.
    body += core * (mix(T_NOMINAL, T_LOAD, 0.45) - T_IDLE) * uCore;
    // Conducted spill out of the core — how heat actually leaves a hot part.
    body += halo * 0.045 * uCore;

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
      // Eased toward the target rather than assigned. Scroll snapping moves the
      // page in one throw, so the raw value can step a long way between frames
      // — and a hard step in this uniform is a whole-screen colour cut. Damping
      // it means every entry and exit is a dissolve no matter how the section
      // was reached, which is what was making the hand-off into the lab jar.
      const eased = damp(
        u.get("uAmount")!.value as number,
        thermal,
        6,
        Math.min(delta, 0.05),
      );
      u.get("uAmount")!.value = eased;
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
