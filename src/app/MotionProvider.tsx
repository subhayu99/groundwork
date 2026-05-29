"use client";

import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { useProgress } from "@/shared/progress/useProgress";

/**
 * Applies the user's saved preferences app-wide:
 * - **Theme**: sets `data-theme="light"` on <html> when Light is chosen (or when
 *   System resolves light); dark is the default (no attribute).
 * - **Motion**: when "reduce" is chosen, adds an `html.reduce-motion` class
 *   (kills CSS transitions) and forces Framer's `reducedMotion="always"`.
 *   Otherwise Framer follows the OS via `"user"`.
 *
 * Reads from the shared progress store, so changes on the Settings page take
 * effect immediately everywhere.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const { state } = useProgress();
  const theme = state?.settings.theme ?? "system";
  const reduceMotion = state?.settings.reduceMotion ?? "system";

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const resolved =
        theme === "system"
          ? window.matchMedia("(prefers-color-scheme: light)").matches
            ? "light"
            : "dark"
          : theme;
      if (resolved === "light") root.setAttribute("data-theme", "light");
      else root.removeAttribute("data-theme");
    };
    apply();
    if (theme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: light)");
      mql.addEventListener("change", apply);
      return () => mql.removeEventListener("change", apply);
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduceMotion === "reduce");
  }, [reduceMotion]);

  return (
    <MotionConfig reducedMotion={reduceMotion === "reduce" ? "always" : "user"}>
      {children}
    </MotionConfig>
  );
}
