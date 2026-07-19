"use client";

/**
 * Full-screen film grain + vignette + a faint scanline haze. Pure CSS/SVG so it
 * costs nothing on the GPU budget. Sits above the canvas, below the UI.
 */
export function Grain() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 40%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {/* Animated grain */}
      <div
        className="absolute inset-[-50%] opacity-[0.022] mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          animation: "grain 6s steps(6) infinite",
        }}
      />
    </div>
  );
}
