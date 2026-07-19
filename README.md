# BARQ — Quadruped Robotics

An award-tier interactive product experience for a custom-built quadruped robot.
The robot's real URDF and Collada meshes are assembled and animated live in the
browser; the whole page is one continuous, cinematic scroll journey.

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **react-three-fiber** + **drei** + **postprocessing** — the persistent WebGL scene
- **urdf-loader** + **ColladaLoader** — real robot description → live scene graph
- **motion** (Framer Motion) · **anime.js** — UI and SVG animation
- **Lenis** — smooth scrolling · **zustand** — cross-boundary state
- **Tailwind CSS 4** — tokenised dark design system

## Architecture

```
src/
  app/                 Root layout (fonts, metadata), globals (design tokens)
  components/
    Experience.tsx     Top-level composition: fixed canvas + scrolling narrative
    canvas/            The WebGL layer
      Scene.tsx          Canvas, suspense, orbit controls
      Robot.tsx          URDF assembly, grounding, per-frame drive
      Teardown3D.tsx     Reversible exploded view + emissive part glow
      EnvController.tsx  Background, fog and material-mode per environment
      CameraRig / Lighting / Ground / Particles / Effects
    sections/          Hero, Story chapters, Exploded, Blueprint, Lab,
                       Performance, Hardware, Software
    layout/            Nav, SmoothScroll, Footer, AudioController
    ui/                Cursor, Grain, MagneticButton, TiltCard, CountUp, …
  hooks/               useUrdf, useSection
  lib/                 store (zustand), robot-config, robot-driver,
                       camera-keyframes, environments, content, accent, utils
  types/               Shared robot typings
public/robot/          barq.urdf + Collada meshes
```

### Key decisions

- **One persistent canvas** fixed behind the DOM. Sections publish state to a
  zustand store (scroll, section, exploded, motion, env); the canvas subscribes.
  The store — not React context — bridges UI and 3D because the R3F renderer
  runs its own reconciler.
- **The robot is never static.** `RobotDriver` layers breathing, weight-shift and
  servo jitter over the active pose, or runs a phase-offset gait engine ported
  from the original reference viewer.
- **React Compiler is disabled** for correctness with R3F's mutable render loop.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Deploy to Vercel

This repo is the app root, so Vercel auto-detects Next.js with **zero
configuration** — no build settings, no env vars required.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/krishagarwal175/BARQ-portfolio)

Or manually:

1. Go to [vercel.com/new](https://vercel.com/new) and **Import** the
   `krishagarwal175/BARQ-portfolio` repository.
2. Framework preset: **Next.js** (detected automatically). Root directory: `./`.
3. Click **Deploy** — Vercel runs `next build` and serves the static output,
   including the URDF and Collada meshes under `public/robot/`.

Every push to `main` triggers an automatic production redeploy.

## Credits

Ambient audio — "Drone Dark and Moody Atmospheric Ambient Background" by
**fronbondi_skegs**, free / no copyright. Stored at
`public/audio/barq-ambient.mp3`, re-encoded to 112 kbps stereo (942 KB) and
fetched lazily on first unmute so it never competes with the URDF and mesh
load.

Authors: **Aryaman & Krish**
