"use client";

import { useEffect, useState } from "react";

/**
 * True when the viewport is at or below the given breakpoint (default: Tailwind
 * `md`, i.e. < 768px). SSR/first-render returns false (desktop) so the server
 * and initial client render agree; it flips after mount.
 */
export function useIsMobile(query = "(max-width: 767px)"): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return isMobile;
}
