"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Measures the live width of a container element so a visualizer can pick
 * mobile-vs-desktop sizing (cell size, wrap, scroll) from the actual space it
 * has — instead of authoring one fixed pixel width and letting FitViewport
 * shrink it. Returns [ref, width]; width is 0 until mounted/measured.
 */
export function useContainerWidth<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width] as const;
}
