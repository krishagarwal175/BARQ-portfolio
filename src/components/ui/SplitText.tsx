"use client";

import { motion } from "motion/react";
import { stagger, VIEW, WORD } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A headline that assembles itself: each word rises out of the line below it,
 * defocused, in sequence.
 *
 * Words are wrapped in an `overflow-hidden` span so they emerge from behind a
 * hard edge rather than fading in mid-air — that clipped reveal is what makes
 * the type feel like it is being set rather than merely appearing.
 *
 * Pass a plain string. Use "\n" for a deliberate line break; each line staggers
 * as its own group so multi-line headings cascade instead of firing at once.
 */
export function SplitText({
  children,
  className,
  delay = 0,
  as: Tag = "h2",
}: {
  children: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p";
}) {
  const lines = children.split("\n");
  const MotionTag = motion[Tag];

  return (
    <MotionTag
      variants={stagger(0.055, delay)}
      initial="hidden"
      whileInView="show"
      viewport={VIEW}
      className={cn(className)}
    >
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.split(" ").map((word, wi) => (
            // Trailing space kept inside the clip so words keep their rhythm.
            <span key={wi} className="inline-block overflow-hidden align-bottom">
              <motion.span variants={WORD} className="inline-block will-change-transform">
                {word}
                {wi < line.split(" ").length - 1 ? " " : ""}
              </motion.span>
            </span>
          ))}
        </span>
      ))}
    </MotionTag>
  );
}
