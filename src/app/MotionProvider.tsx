"use client";

import { MotionConfig } from "framer-motion";

/**
 * Honors the OS "reduce motion" setting for all Framer Motion animations
 * (`reducedMotion="user"` swaps transform/layout animations for instant ones).
 * CSS transitions are handled separately via a media query in globals.css.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
