"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { listAllTopics } from "@/categories/registry";
import { useProgress } from "@/shared/progress/useProgress";
import type { TopicMeta } from "@/shared/derivation/types";

/**
 * The home "map": every topic placed on a tier equal to how deep its prerequisite
 * chain runs (level 0 = no prereqs = where you start; each level builds on the ones
 * above). Edges connect each topic to the prerequisites sitting above it, and the
 * arrowheads flow DOWNWARD — from a prerequisite into what builds on it — so it
 * reads as a clean dependency hierarchy ("learn this, then this"), never a hairball.
 *
 * Layout is fully deterministic (no force sim): tiers are fixed rows, and within a
 * tier nodes are ordered by the average x of their prerequisites above to reduce
 * crossings. Hovering a topic lights its whole "builds on" chain. Desktop draws the
 * SVG tiers; mobile gets the same tiers as stacked, scrollable bands.
 */

const W = 1160;
const LEFT = 132;
const RIGHT = 48;
const TOP = 66;
const ROW = 88; // tier spacing — kept compact since the basics track adds several tiers
const HH = 16; // chip half-height

const tierLabel = (l: number) => (l === 0 ? "FOUNDATION" : `LEVEL ${l}`);
const diffColor = (d?: string) =>
  d === "easy" ? "var(--diff-easy)" : d === "medium" ? "var(--diff-med)" : d === "hard" ? "var(--diff-hard)"
  : d === "foundation" ? "var(--accent-sky)" : "var(--text-faint)";
// "FOUNDATION" is long and reads as jargon on a small badge — show "Basics" instead.
const diffLabel = (d?: string) => (d === "foundation" ? "Basics" : d ?? "");
const chipW = (label: string) => Math.max(66, label.length * 6.3 + 24);
const CHIP_GAP = 12; // min horizontal gap between chips in a tier

export function TopicTierMap() {
  const router = useRouter();
  const { state } = useProgress();
  const [hover, setHover] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  // Progress is client-only (localStorage); gate progress-dependent styling behind
  // mount so the static-export HTML and first client render match (no hydration mismatch).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { topics, byKey, tiers, maxLevel } = useMemo(() => {
    const topics = listAllTopics();
    const byKey = new Map<string, TopicMeta>(topics.map((t) => [t.key, t]));
    const memo = new Map<string, number>();
    const level = (k: string, seen = new Set<string>()): number => {
      if (memo.has(k)) return memo.get(k)!;
      const t = byKey.get(k);
      const pre = (t?.prerequisites ?? []).filter((p) => byKey.has(p) && p !== k);
      if (!t || pre.length === 0 || seen.has(k)) { memo.set(k, 0); return 0; }
      seen.add(k);
      const lv = 1 + Math.max(...pre.map((p) => level(p, seen)));
      seen.delete(k);
      memo.set(k, lv);
      return lv;
    };
    topics.forEach((t) => level(t.key));
    const maxLevel = Math.max(0, ...topics.map((t) => memo.get(t.key)!));
    const tiers: string[][] = Array.from({ length: maxLevel + 1 }, () => []);
    topics.forEach((t) => tiers[memo.get(t.key)!].push(t.key));
    return { topics, byKey, tiers, maxLevel };
  }, []);

  // deterministic positions — order each tier by the barycentre of its prereqs above
  const pos = useMemo(() => {
    const pos = new Map<string, { x: number; y: number; w: number }>();
    for (let L = 0; L <= maxLevel; L++) {
      const y = TOP + L * ROW;
      const bary = (k: string) => {
        const pre = (byKey.get(k)?.prerequisites ?? []).filter((p) => pos.has(p));
        return pre.length ? pre.reduce((s, p) => s + pos.get(p)!.x, 0) / pre.length : W / 2;
      };
      const nodes = [...tiers[L]].sort((a, b) => (L === 0 ? a.localeCompare(b) : bary(a) - bary(b)));
      const n = nodes.length;
      nodes.forEach((k, i) => {
        const x = LEFT + (n === 1 ? 0.5 : (i + 0.5) / n) * (W - LEFT - RIGHT);
        pos.set(k, { x, y, w: chipW(byKey.get(k)!.name) });
      });
      // Even spacing alone can overlap when chips are wide and the tier is full
      // (level 6 had ~15px overlaps). Sweep L→R pushing each chip clear of the
      // previous one, then re-centre the packed row inside [LEFT, W-RIGHT] (or
      // clamp to the left margin if it can't fit) so nothing collides or runs off.
      const row = nodes.map((k) => pos.get(k)!);
      for (let i = 1; i < row.length; i++) {
        const minX = row[i - 1].x + row[i - 1].w / 2 + CHIP_GAP + row[i].w / 2;
        if (row[i].x < minX) row[i].x = minX;
      }
      if (row.length) {
        const leftEdge = row[0].x - row[0].w / 2;
        const rightEdge = row[row.length - 1].x + row[row.length - 1].w / 2;
        const avail = W - RIGHT - LEFT;
        const used = rightEdge - leftEdge;
        const shift = used <= avail ? LEFT + (avail - used) / 2 - leftEdge : LEFT - leftEdge;
        row.forEach((r) => { r.x += shift; });
      }
    }
    return pos;
  }, [tiers, maxLevel, byKey]);

  // transitive prerequisites, for the hover "builds on" highlight
  const ancestors = useMemo(() => {
    const cache = new Map<string, Set<string>>();
    const calc = (k: string): Set<string> => {
      if (cache.has(k)) return cache.get(k)!;
      const set = new Set<string>();
      cache.set(k, set);
      for (const p of byKey.get(k)?.prerequisites ?? []) {
        if (!byKey.has(p)) continue;
        set.add(p);
        for (const a of calc(p)) set.add(a);
      }
      return set;
    };
    byKey.forEach((_, k) => calc(k));
    return cache;
  }, [byKey]);

  const completed = (k: string) => {
    const t = byKey.get(k);
    return !!(mounted && t && state?.categories[t.category]?.[k]?.derivation.completed);
  };
  const ready = (k: string) => {
    const t = byKey.get(k);
    if (!mounted || !t || !state || completed(k)) return false;
    const pre = t.prerequisites.filter((p) => byKey.has(p));
    // Foundation topics (no prerequisites) are startable immediately, so they get
    // the "ready" affordance too — otherwise the true entry points read as locked.
    return pre.length === 0 || pre.every((p) => completed(p));
  };

  // Render (and therefore tab) chips tier-by-tier, left-to-right — matching the
  // visual layout instead of registry insertion order, so keyboard focus moves
  // through the map the way the eye does.
  const ordered = [...topics].sort((a, b) => {
    const pa = pos.get(a.key)!, pb = pos.get(b.key)!;
    return pa.y - pb.y || pa.x - pb.x;
  });

  const hl = hover ? new Set<string>([hover, ...(ancestors.get(hover) ?? [])]) : null;
  const H = TOP + maxLevel * ROW + 56;
  const go = (k: string) => { const t = byKey.get(k); if (t) router.push(`/categories/${t.category}/${t.key}`); };

  const edges: { from: string; to: string }[] = [];
  byKey.forEach((t, k) => t.prerequisites.forEach((p) => { if (byKey.has(p)) edges.push({ from: k, to: p }); }));

  return (
    <>
      {/* DESKTOP — SVG tiers (lg+, where the 1160-wide viewBox keeps chip text
          legible; below that the SVG text shrinks under ~8px, so we show the
          stacked bands instead). */}
      <div className="hidden lg:block rounded-2xl border border-[var(--line-faint)] bg-[var(--bg-elevated)] overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", aspectRatio: `${W} / ${H}` }} role="group" aria-label="Topic dependency map, by level">
          <defs>
            {/* small arrowhead — inherits the line's stroke colour via context-stroke */}
            <marker id="tierArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0.5,0.5 L9,5 L0.5,9.5 z" fill="context-stroke" />
            </marker>
          </defs>
          {/* tier labels */}
          {tiers.map((_, L) => (
            <g key={L}>
              <text x={20} y={TOP + L * ROW} dominantBaseline="central" className="font-mono" style={{ fontSize: 11, fill: "var(--text-faint)", letterSpacing: "0.12em" }}>{tierLabel(L)}</text>
              {L === 0 && <text x={20} y={TOP + L * ROW + 15} className="font-mono" style={{ fontSize: 9, fill: "var(--accent-ink)" }}>start here</text>}
            </g>
          ))}
          {/* edges (behind chips) */}
          <g>
            {edges.map((e, i) => {
              // a = the dependent topic (lower tier on screen); b = its prerequisite (upper).
              // Draw the arrow FROM the prerequisite DOWN INTO the dependent, so direction
              // reads "learn this → flows down to this".
              const a = pos.get(e.from)!, b = pos.get(e.to)!;
              const lit = !hl || (hl.has(e.from) && hl.has(e.to));
              return (
                <line key={i} x1={b.x} y1={b.y + HH} x2={a.x} y2={a.y - HH - 4}
                  markerEnd="url(#tierArrow)"
                  stroke={hover ? (lit ? "var(--accent-line)" : "var(--line-faint)") : "var(--line)"}
                  strokeWidth={hover && lit ? 1.5 : 1}
                  opacity={hover ? (lit ? 0.95 : 0.05) : 0.55} />
              );
            })}
          </g>
          {/* chips */}
          <g>
            {ordered.map((t) => {
              const p = pos.get(t.key)!;
              const done = completed(t.key), rdy = ready(t.key);
              const lit = !hl || hl.has(t.key);
              const focused = focusKey === t.key;
              const w = p.w;
              const preNames = t.prerequisites.map((pp) => byKey.get(pp)?.name ?? pp);
              let fill = "var(--bg-card)", stroke = "var(--line)", text = "var(--text-muted)", weight = 400;
              let dash: string | undefined;
              if (done) { fill = "var(--accent)"; stroke = "var(--accent)"; text = "var(--bg)"; weight = 500; }
              else if (rdy) { fill = "var(--accent-soft)"; stroke = "var(--accent-line)"; text = "var(--accent-ink)"; weight = 500; dash = "3 2.5"; }
              return (
                <g key={t.key} transform={`translate(${p.x},${p.y})`} opacity={lit ? 1 : 0.16}
                  style={{ cursor: "pointer", transition: "opacity 150ms", outline: "none" }}
                  onMouseEnter={() => setHover(t.key)} onMouseLeave={() => setHover((h) => (h === t.key ? null : h))}
                  onFocus={() => { setHover(t.key); setFocusKey(t.key); }}
                  onBlur={() => { setHover((h) => (h === t.key ? null : h)); setFocusKey((k) => (k === t.key ? null : k)); }}
                  onClick={() => go(t.key)} role="button" tabIndex={0}
                  aria-label={`${t.name}${preNames.length ? ` — builds on ${preNames.join(", ")}` : " — start here"}`}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(t.key); } }}>
                  {/* No SVG <title> here: React 19 hoists/empties it during SSR, which
                      mismatched on hydration and regenerated the whole map tree. The
                      accessible name lives on aria-label, and hovering already lights the
                      prerequisite chain — so the native tooltip wasn't pulling its weight. */}
                  {/* keyboard focus ring — native SVG outlines are unreliable, so draw our own */}
                  {focused && <rect x={-w / 2 - 4} y={-HH - 4} width={w + 8} height={HH * 2 + 8} rx={HH + 4} fill="none" stroke="var(--accent)" strokeWidth={2} />}
                  <rect x={-w / 2} y={-HH} width={w} height={HH * 2} rx={HH} fill={fill} stroke={stroke} strokeWidth={1} strokeDasharray={dash} />
                  {!done && <circle cx={w / 2 - 9} cy={-HH + 9} r={3} fill={diffColor(t.difficulty)} />}
                  <text textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={weight} fill={text} style={{ pointerEvents: "none", userSelect: "none" }}>{t.name}</text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* MOBILE / TABLET — same tiers as stacked bands */}
      <div className="lg:hidden space-y-7">
        {tiers.map((keys, L) => (
          <section key={L}>
            <div className="flex items-baseline gap-2 mb-3">
              <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--text-faint)]">{tierLabel(L)}</h2>
              {L === 0 && <span className="font-mono text-[10px] text-[var(--accent-ink)]">start here</span>}
            </div>
            <div className="grid gap-3">
              {keys.map((k) => {
                const t = byKey.get(k)!;
                const done = completed(k), rdy = ready(k);
                return (
                  <Link key={k} href={`/categories/${t.category}/${t.key}`}
                    className={`block p-3.5 rounded-xl border transition-colors hover:border-[var(--line-strong)] ${
                      done ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                        : rdy ? "border-dashed border-[var(--accent-line)] bg-[var(--accent-soft)]"
                        : "border-[var(--line-faint)] bg-[var(--bg-card)]"
                    }`}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-semibold text-[var(--text)]">
                        {t.name}
                        {done && <span className="ml-1.5 text-[var(--accent-ink)]">✓</span>}
                        {rdy && <span className="ml-1.5 font-mono text-[10px] text-[var(--accent-ink)]">ready</span>}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase shrink-0 border" style={{ color: diffColor(t.difficulty), borderColor: `color-mix(in oklab, ${diffColor(t.difficulty)} 45%, transparent)` }}>{diffLabel(t.difficulty)}</span>
                    </div>
                    {t.prerequisites.length > 0 && (
                      <div className="text-[11px] text-[var(--text-faint)] font-mono">builds on {t.prerequisites.map((p) => byKey.get(p)?.name ?? p).join(" · ")}</div>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
