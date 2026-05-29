"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

/**
 * Scales its child down to fit the available width.
 *
 * Visualizers are authored at fixed pixel widths (grids, timelines, side-by-side
 * panels) that overflow a phone screen. Rather than make each one responsive, we
 * measure the child's natural width and apply a uniform `scale()` so it always
 * fits the container. It only ever scales DOWN — on desktop, where everything
 * fits, the scale stays 1 and this is a no-op.
 */
export function FitViewport({ children, minScale = 0.45 }: { children: ReactNode; minScale?: number }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [boxHeight, setBoxHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const measure = () => {
      const available = outer.clientWidth;
      // Transforms don't affect offset/scroll metrics, so these read the
      // child's *natural* (unscaled) size regardless of the current scale.
      const natural = inner.scrollWidth;
      if (!available || !natural) return;
      const next = natural > available ? Math.max(available / natural, minScale) : 1;
      setScale((prev) => (Math.abs(prev - next) > 0.005 ? next : prev));
      setBoxHeight(inner.offsetHeight * next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [minScale]);

  return (
    <div ref={outerRef} className="w-full flex justify-center" style={{ height: boxHeight }}>
      <div
        ref={innerRef}
        style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
      >
        {children}
      </div>
    </div>
  );
}
