"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";

/**
 * A free-form pan + zoom viewport for the lesson canvas.
 *
 * - Touch: pinch to zoom (focal-point preserved), drag to pan once zoomed in.
 *   At rest (zoom = 1) on mobile, a vertical drag is left to the BROWSER so the
 *   lesson page keeps scrolling; only a horizontal drag pans (the diagram is
 *   wider than the phone). `allowPageScrollAtRest` opts into this.
 * - Mouse / trackpad: wheel to zoom around the cursor, drag to pan when zoomed.
 * - Double-tap / double-click: reset to fit (or, on desktop, zoom toward the point).
 *
 * Crucially, a TAP that doesn't move is never preventDefault-ed and never captures
 * the pointer, so it falls through to interactive SVG elements (click-to-halve,
 * the "sort by end" button, grid walks, …). Pointer capture is taken only once an
 * actual pan begins, which also suppresses the trailing click after a drag.
 *
 * Transforms are applied imperatively to the inner layer (no React re-render per
 * move); a tiny `atRest` state only flips `touch-action` when zoom crosses 1.
 */
interface PanZoomProps {
  children: React.ReactNode;
  className?: string;
  /** Pixel size of the fit-scaled content at zoom = 1 (used for centring + bounds). */
  contentWidth: number;
  contentHeight: number;
  minZoom?: number;
  maxZoom?: number;
  /** Mobile inline: let the page scroll vertically while at rest. */
  allowPageScrollAtRest?: boolean;
}

export const PanZoom = forwardRef<HTMLDivElement, PanZoomProps>(function PanZoom(
  { children, className, contentWidth, contentHeight, minZoom = 1, maxZoom = 4, allowPageScrollAtRest = false },
  forwardedRef,
) {
  const vpRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const setVp = useCallback(
    (el: HTMLDivElement | null) => {
      vpRef.current = el;
      if (typeof forwardedRef === "function") forwardedRef(el);
      else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    },
    [forwardedRef],
  );

  const tRef = useRef({ z: 1, x: 0, y: 0 });
  const [atRest, setAtRest] = useState(true);

  const clampZoom = useCallback((z: number) => Math.min(maxZoom, Math.max(minZoom, z)), [maxZoom, minZoom]);

  // Apply a transform, clamped so content stays in view (centred when smaller than the box).
  const apply = useCallback(
    (z: number, x: number, y: number) => {
      const el = vpRef.current;
      if (!el) return;
      const vw = el.clientWidth, vh = el.clientHeight;
      const sw = contentWidth * z, sh = contentHeight * z;
      const cx = sw <= vw ? (vw - sw) / 2 : Math.min(0, Math.max(vw - sw, x));
      const cy = sh <= vh ? (vh - sh) / 2 : Math.min(0, Math.max(vh - sh, y));
      tRef.current = { z, x: cx, y: cy };
      if (innerRef.current) innerRef.current.style.transform = `translate3d(${cx}px, ${cy}px, 0) scale(${z})`;
      const rest = z <= 1.001;
      setAtRest((prev) => (prev === rest ? prev : rest));
    },
    [contentWidth, contentHeight],
  );

  const center = useCallback(
    (z = 1) => {
      const el = vpRef.current;
      if (!el) return;
      apply(z, (el.clientWidth - contentWidth * z) / 2, (el.clientHeight - contentHeight * z) / 2);
    },
    [apply, contentWidth, contentHeight],
  );

  // Centre on mount + whenever the fit size changes, and re-centre (keeping zoom) on resize.
  useEffect(() => { center(1); }, [center]);
  useEffect(() => {
    const el = vpRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => center(tRef.current.z));
    ro.observe(el);
    return () => ro.disconnect();
  }, [center]);

  useEffect(() => {
    const el = vpRef.current;
    if (!el) return;
    const ptrs = new Map<number, { x: number; y: number }>();
    let lastDist = 0, lastMid = { x: 0, y: 0 }, last = { x: 0, y: 0 };
    let axis: "" | "pan" | "scroll" = "";
    let captured = false;
    let downAt = 0, downPt = { x: 0, y: 0 }, moved = false;
    let lastTapAt = 0;

    const pt = (e: PointerEvent) => { const r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const beginCapture = (id: number) => { if (!captured) { try { el.setPointerCapture(id); } catch { /* ignore */ } captured = true; } };

    const onDown = (e: PointerEvent) => {
      ptrs.set(e.pointerId, pt(e));
      axis = ""; moved = false; downAt = e.timeStamp; downPt = pt(e);
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        lastDist = Math.hypot(a.x - b.x, a.y - b.y);
        lastMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      } else {
        last = pt(e);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!ptrs.has(e.pointerId)) return;
      const p = pt(e); ptrs.set(e.pointerId, p);
      const cur = tRef.current;

      if (ptrs.size >= 2) {
        const [a, b] = [...ptrs.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (lastDist > 0) {
          const z2 = clampZoom(cur.z * (dist / lastDist));
          apply(z2, mid.x - (lastMid.x - cur.x) * (z2 / cur.z), mid.y - (lastMid.y - cur.y) * (z2 / cur.z));
        }
        lastDist = dist; lastMid = mid; moved = true; beginCapture(e.pointerId);
        e.preventDefault();
        return;
      }

      const dx = p.x - last.x, dy = p.y - last.y;
      const tdx = p.x - downPt.x, tdy = p.y - downPt.y;
      const zoomed = cur.z > 1.001;

      if (!zoomed) {
        if (!allowPageScrollAtRest) return; // desktop at base: let taps/clicks fall through; zoom via wheel first
        // mobile at rest: axis-lock — horizontal pans the wide diagram, vertical lets the page scroll.
        if (axis === "") {
          if (Math.abs(tdx) > 6 || Math.abs(tdy) > 6) axis = Math.abs(tdx) > Math.abs(tdy) ? "pan" : "scroll";
          else return;
        }
        if (axis === "scroll") return;
        apply(cur.z, cur.x + dx, cur.y);
        last = p; moved = true; beginCapture(e.pointerId);
        e.preventDefault();
        return;
      }

      // Zoomed in: free pan — but keep a small jitter a "tap" so clicks still fall through.
      if (!moved && Math.hypot(tdx, tdy) < 3) return;
      apply(cur.z, cur.x + dx, cur.y + dy);
      last = p; moved = true; beginCapture(e.pointerId);
      e.preventDefault();
    };

    const onUp = (e: PointerEvent) => {
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) lastDist = 0;
      if (ptrs.size === 1) last = [...ptrs.values()][0];
      if (ptrs.size === 0) {
        if (captured) { try { el.releasePointerCapture(e.pointerId); } catch { /* ignore */ } captured = false; }
        // double-tap (touch, no drag) → reset when zoomed in
        const isTap = !moved && e.timeStamp - downAt < 250 && Math.abs(pt(e).x - downPt.x) < 8 && Math.abs(pt(e).y - downPt.y) < 8;
        if (isTap && e.pointerType !== "mouse") {
          if (e.timeStamp - lastTapAt < 300 && tRef.current.z > 1.05) center(1);
          lastTapAt = e.timeStamp;
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      const cur = tRef.current;
      const z2 = clampZoom(cur.z * Math.exp(-e.deltaY * 0.0008));
      apply(z2, px - (px - cur.x) * (z2 / cur.z), py - (py - cur.y) * (z2 / cur.z));
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove, { passive: false });
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [apply, center, clampZoom, allowPageScrollAtRest]);

  const onDoubleClick = (e: React.MouseEvent) => {
    const el = vpRef.current;
    if (!el) return;
    const cur = tRef.current;
    if (cur.z > 1.05) { center(1); return; }
    const r = el.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const z2 = clampZoom(2);
    apply(z2, px - (px - cur.x) * (z2 / cur.z), py - (py - cur.y) * (z2 / cur.z));
  };

  // Zoom around the viewport centre — for the on-canvas +/−/reset controls (also the
  // keyboard-accessible path, since pinch/wheel aren't reachable without a pointer).
  const zoomBy = (factor: number) => {
    const el = vpRef.current;
    if (!el) return;
    const cur = tRef.current;
    const cx = el.clientWidth / 2, cy = el.clientHeight / 2;
    const z2 = clampZoom(cur.z * factor);
    apply(z2, cx - (cx - cur.x) * (z2 / cur.z), cy - (cy - cur.y) * (z2 / cur.z));
  };
  const btn = "inline-flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-inset)] disabled:opacity-30 text-[15px] leading-none";

  return (
    <div
      ref={setVp}
      className={className}
      style={{ touchAction: allowPageScrollAtRest && atRest ? "pan-y" : "none", overflow: "hidden", cursor: atRest ? undefined : "grab" }}
      onDoubleClick={onDoubleClick}
    >
      <div ref={innerRef} style={{ transformOrigin: "0 0", willChange: "transform" }}>
        {children}
      </div>
      {/* zoom controls — discoverable + keyboard-accessible; reset shows once zoomed */}
      <div
        className="absolute bottom-2 right-2 z-20 flex items-center gap-0.5 rounded-lg border border-[var(--line-faint)] bg-[color-mix(in_oklab,var(--bg-card)_80%,transparent)] px-0.5 py-0.5 opacity-60 hover:opacity-100 transition-opacity backdrop-blur-sm"
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={btn} aria-label="Zoom out" onClick={() => zoomBy(1 / 1.4)} disabled={atRest && minZoom >= 1}>−</button>
        {!atRest && <button type="button" className={btn} aria-label="Reset zoom" title="Reset" onClick={() => center(1)}>⟳</button>}
        <button type="button" className={btn} aria-label="Zoom in" onClick={() => zoomBy(1.4)}>+</button>
      </div>
    </div>
  );
});
