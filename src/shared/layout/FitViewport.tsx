"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

/**
 * Scales its child to fit the available space.
 *
 * Default (desktop): fit by WIDTH only, scale down never up, top-centered, and
 * collapse the box to the scaled height — a no-op when everything already fits.
 *
 * `fitHeight` (mobile sticky visual panel): fill the parent box, fit by BOTH
 * width and height, and center on both axes. Use this when the parent imposes a
 * bounded height (e.g. a fixed-height panel) so the visual fills it instead of
 * being a small strip pinned to the top.
 */
export function FitViewport({
  children,
  minScale = 0.45,
  fitHeight = false,
}: {
  children: ReactNode;
  minScale?: number;
  fitHeight?: boolean;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [boxHeight, setBoxHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const measure = () => {
      const availW = outer.clientWidth;
      const availH = outer.clientHeight;
      // Transforms don't affect offset/scroll metrics, so these read the
      // child's *natural* (unscaled) size regardless of the current scale.
      const natW = inner.scrollWidth;
      const natH = inner.offsetHeight;
      if (!availW || !natW) return;

      let next = natW > availW ? availW / natW : 1;
      if (fitHeight && availH && natH) {
        next = Math.min(next, availH / natH);
      }
      next = Math.max(Math.min(next, 1), minScale);

      setScale((prev) => (Math.abs(prev - next) > 0.005 ? next : prev));
      if (!fitHeight) setBoxHeight(natH * next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [minScale, fitHeight]);

  if (fitHeight) {
    return (
      <div ref={outerRef} className="w-full h-full flex items-center justify-center overflow-hidden">
        <div ref={innerRef} style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div ref={outerRef} className="w-full flex justify-center" style={{ height: boxHeight }}>
      <div ref={innerRef} style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}>
        {children}
      </div>
    </div>
  );
}
