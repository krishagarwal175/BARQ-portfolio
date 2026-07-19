import type { Metadata, Viewport } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Manrope carries both display and body, per the glass direction. Self-hosted
// by next/font at build time — no CDN request at runtime.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://barq.krishagarwal.dev"),
  title: {
    default: "BARQ — Quadruped Robotics",
    template: "%s · BARQ",
  },
  description:
    "BARQ is a custom-engineered quadruped robot. An interactive teardown of its kinematics, actuators, compute and control stack.",
  keywords: [
    "quadruped robot",
    "robotics",
    "URDF",
    "Aryaman",
    "Krish",
    "legged locomotion",
    "BARQ",
  ],
  authors: [{ name: "Aryaman" }, { name: "Krish" }],
  openGraph: {
    title: "BARQ — Quadruped Robotics",
    description: "An interactive teardown of a custom quadruped robot.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
