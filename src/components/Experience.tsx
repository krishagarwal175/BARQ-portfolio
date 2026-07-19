"use client";

import dynamic from "next/dynamic";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Nav } from "@/components/layout/Nav";
import { AudioController } from "@/components/layout/AudioController";
import { ThemeController } from "@/components/layout/ThemeController";
import { GlassBudget } from "@/components/layout/GlassBudget";
import { OrbitDrag } from "@/components/layout/OrbitDrag";
import { OrbitHint } from "@/components/ui/OrbitHint";
import { Cursor } from "@/components/ui/Cursor";
import { Grain } from "@/components/ui/Grain";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { Boot } from "@/components/sections/Boot";
import { Hero } from "@/components/sections/Hero";
import { FeatureSection } from "@/components/sections/FeatureSection";
import { Thermal } from "@/components/sections/Thermal";
import { Reference } from "@/components/sections/Reference";
import { Exploded } from "@/components/sections/Exploded";
import { Lab } from "@/components/sections/Lab";
import { Pipeline } from "@/components/sections/Pipeline";
import { Highlights } from "@/components/sections/Highlights";
import { Hardware } from "@/components/sections/Hardware";
import { Software } from "@/components/sections/Software";
import { Capabilities } from "@/components/sections/Capabilities";
import { Footer } from "@/components/layout/Footer";
import { Marquee } from "@/components/ui/Marquee";

// The WebGL scene is client-only; never render it on the server.
const Scene = dynamic(() => import("@/components/canvas/Scene").then((m) => m.Scene), {
  ssr: false,
});

/**
 * Top-level composition: one persistent canvas fixed behind the scrolling
 * narrative. Overlays (grain, cursor, nav, boot) sit above it.
 */
export function Experience() {
  return (
    <SmoothScroll>
      {/* The canvas now carries the ambient field, the BARQ wordmark and the
          robot as one composited frame — back to front inside Scene, so the
          robot occludes the type. The DOM above it is interface only. */}
      <div id="top" className="fixed inset-0 z-0">
        <Scene />
      </div>

      <ThemeController />
      <GlassBudget />
      <OrbitDrag />
      <OrbitHint />
      <Grain />
      <Cursor />
      <ScrollProgress />
      <Nav />
      <AudioController />
      <Boot />

      <main className="relative z-10">
        <Hero />

        <FeatureSection
          index={1}
          eyebrow="Twelve degrees of freedom"
          body="Four legs, each a three-joint serial chain — hip, upper leg and lower leg. The whole mechanical hierarchy lives in a single URDF the browser assembles in real time, joint limits and all: the same file that drives simulation."
          statement={"One file,\nevery joint"}
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
              <circle cx="6" cy="6" r="2" strokeWidth="1.5" />
              <circle cx="18" cy="12" r="2" strokeWidth="1.5" />
              <circle cx="8" cy="19" r="2" strokeWidth="1.5" />
              <path d="M7.7 7.4 16.3 11M16.5 13.6 9.6 17.7" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          }
          note={{
            caption: "Forward kinematics · three angles per foot",
            formula: <span className="italic">p = f(θ₁,θ₂,θ₃)</span>,
          }}
        />

        <FeatureSection
          index={2}
          side="right"
          eyebrow="Twelve joints, one control path"
          body="Each joint is a DS3240MG high-torque digital servo driven over PWM through a PCA9685. A calibration pipeline and joint-level abstraction mean every servo is commanded the same way — pose and gait targets, never raw pulses."
          statement={"Commanded,\nnot pulsed"}
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
              <path d="M3 12h3l2-5 3 10 3-8 2 3h5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          note={{
            caption: "12-bit PWM · 4096 steps per channel",
            formula: <span className="italic">θ = k·(t − t₀)</span>,
          }}
        />

        <FeatureSection
          index={3}
          eyebrow="Designed to be iterated"
          body="Every structural component was modelled in Fusion 360 and optimised for printing, modularity and maintenance. The central body carries compute, IMU and power distribution — a platform built to be taken apart and improved."
          statement={"Built to\ncome apart"}
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
              <path d="M12 3 20 7.5v9L12 21 4 16.5v-9L12 3Z" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M12 12v9M12 12 4 7.5M12 12l8-4.5" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          }
        />

        <Marquee
          items={[
            "12 DOF",
            "4 legs · 3 joints",
            "DS3240MG",
            "PCA9685 · 12-bit PWM",
            "Jetson Orin Nano",
            "URDF single source",
          ]}
        />

        <Exploded />
        <Thermal />
        <Lab />
        {/* From here down the page is documentation, not a 3D narrative — it
            gets a floor, and the canvas behind it stops rendering. */}
        <Reference>
          <Pipeline />
          <Highlights />

          <Marquee
            items={[
              "HW-290 IMU",
              "4S LiPo · 6400 mAh",
              "YDLIDAR G2",
              "Fusion 360",
              "ROS 2",
              "Built end to end",
            ]}
          />

          <Hardware />
          <Software />
          <Capabilities />
          <Footer />
        </Reference>
      </main>
    </SmoothScroll>
  );
}
