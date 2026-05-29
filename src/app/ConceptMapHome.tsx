"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  type Simulation,
} from "d3-force";
import { listCategories, listAllTopics } from "@/categories/registry";
import { listPrinciples } from "@/principles/registry";
import { useProgress } from "@/shared/progress/useProgress";

type NodeKind = "principle" | "category" | "topic";

interface GNode {
  id: string;
  kind: NodeKind;
  label: string;
  href: string;
  /** topic-only */
  category?: string;
  completed?: boolean;
  /** chip half-width / half-height for collision + layout */
  hw: number;
  hh: number;
  // mutated by d3-force
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GLink {
  source: string | GNode;
  target: string | GNode;
  kind: "topic-category" | "topic-principle";
}

const W = 960;
const H = 600;

function chipWidth(label: string, kind: NodeKind): number {
  const base = kind === "topic" ? 6.4 : 7;
  return Math.max(54, label.length * base + (kind === "topic" ? 18 : 24));
}

function endpointId(e: string | GNode): string {
  return typeof e === "object" ? e.id : e;
}

/**
 * Desktop home: a force-directed concept map. The seven principles sit toward
 * the center; the two category hubs anchor each side; every topic is a leaf
 * linked to its category and to each principle it's built on. Completed topics
 * are filled. Hovering a node highlights its connections; clicking navigates.
 *
 * Client-only (the simulation + completion state need the browser), so it
 * renders fine under static export. The mobile fallback (a plain grid) lives
 * in page.tsx behind a breakpoint.
 */
export function ConceptMapHome() {
  const router = useRouter();
  const { state } = useProgress();
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [, tick] = useReducer((n: number) => n + 1, 0);
  // The simulation runs only in the browser, so the prerendered/SSR HTML has no
  // node positions. Render the graph contents only after mount so the server and
  // first client render match exactly (no hydration mismatch under static export).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Build the graph once (topology is static; completion is layered on at render).
  const { nodes, links, adjacency } = useMemo(() => {
    const principles = listPrinciples();
    const categories = listCategories();
    const topics = listAllTopics();

    const nodes: GNode[] = [];
    const links: GLink[] = [];

    categories.forEach((c, i) => {
      const label = c.name;
      nodes.push({
        id: `c:${c.key}`,
        kind: "category",
        label,
        href: `/categories/${c.key}`,
        hw: chipWidth(label, "category") / 2,
        hh: 15,
        // anchor the two hubs left/right for a stable, readable layout
        fx: i === 0 ? W * 0.32 : W * 0.68,
        fy: H * 0.5,
      });
    });

    principles.forEach((p, i) => {
      const label = p.name;
      const angle = (i / principles.length) * Math.PI * 2 - Math.PI / 2;
      nodes.push({
        id: `p:${p.key}`,
        kind: "principle",
        label,
        href: `/principles/${p.key}`,
        hw: chipWidth(label, "principle") / 2,
        hh: 14,
        x: W / 2 + Math.cos(angle) * 120,
        y: H / 2 + Math.sin(angle) * 120,
      });
    });

    topics.forEach((t, i) => {
      const label = t.name;
      const angle = (i / topics.length) * Math.PI * 2;
      nodes.push({
        id: `t:${t.category}/${t.key}`,
        kind: "topic",
        label,
        href: `/categories/${t.category}/${t.key}`,
        category: t.category,
        hw: chipWidth(label, "topic") / 2,
        hh: 11,
        x: W / 2 + Math.cos(angle) * 280,
        y: H / 2 + Math.sin(angle) * 240,
      });
      links.push({ source: `t:${t.category}/${t.key}`, target: `c:${t.category}`, kind: "topic-category" });
      t.principles.forEach((pk) => {
        links.push({ source: `t:${t.category}/${t.key}`, target: `p:${pk}`, kind: "topic-principle" });
      });
    });

    // adjacency by id, for hover highlighting
    const adjacency = new Map<string, Set<string>>();
    nodes.forEach((n) => adjacency.set(n.id, new Set()));
    links.forEach((l) => {
      const s = endpointId(l.source);
      const t = endpointId(l.target);
      adjacency.get(s)?.add(t);
      adjacency.get(t)?.add(s);
    });

    return { nodes, links, adjacency };
  }, []);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const simRef = useRef<Simulation<GNode, GLink> | null>(null);

  useEffect(() => {
    const sim = forceSimulation<GNode, GLink>(nodes)
      .force(
        "link",
        forceLink<GNode, GLink>(links)
          .id((d) => d.id)
          .distance((l) => (l.kind === "topic-principle" ? 130 : 86))
          .strength((l) => (l.kind === "topic-principle" ? 0.18 : 0.5)),
      )
      .force("charge", forceManyBody().strength(-430))
      .force("center", forceCenter(W / 2, H / 2))
      .force(
        "collide",
        forceCollide<GNode>().radius((d) => d.hw + 10).iterations(2),
      )
      .force("x", forceX(W / 2).strength(0.04))
      .force("y", forceY(H / 2).strength(0.06));

    sim.on("tick", () => {
      // keep chips inside the frame
      for (const n of nodesRef.current) {
        if (n.x != null) n.x = Math.max(n.hw + 6, Math.min(W - n.hw - 6, n.x));
        if (n.y != null) n.y = Math.max(n.hh + 24, Math.min(H - n.hh - 6, n.y));
      }
      tick();
    });

    simRef.current = sim;
    return () => {
      sim.stop();
    };
  }, [nodes, links]);

  // Layer completion state onto topic nodes (read-only; doesn't disturb layout).
  if (state) {
    for (const n of nodesRef.current) {
      if (n.kind === "topic" && n.category) {
        const key = n.id.slice(n.id.indexOf("/") + 1);
        n.completed = state.categories[n.category]?.[key]?.derivation.completed ?? false;
      }
    }
  }

  const isActive = (id: string) =>
    hoverId == null || id === hoverId || adjacency.get(hoverId)?.has(id);
  const linkActive = (l: GLink) => {
    if (hoverId == null) return true;
    return endpointId(l.source) === hoverId || endpointId(l.target) === hoverId;
  };

  const go = (href: string) => router.push(href);

  return (
    <div>
      <div className="rounded-2xl border border-[var(--line-faint)] bg-[var(--bg-elevated)] overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-[600px]"
          role="group"
          aria-label="Concept map of principles, categories, and topics"
        >
          {mounted && (
          <>
          {/* edges */}
          <g>
            {links.map((l, i) => {
              const s = l.source as GNode;
              const t = l.target as GNode;
              if (typeof s !== "object" || typeof t !== "object") return null;
              const active = linkActive(l);
              const highlight = hoverId != null && active;
              return (
                <line
                  key={i}
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke={highlight ? "var(--accent-line)" : "var(--line-faint)"}
                  strokeWidth={highlight ? 1.4 : 0.8}
                  opacity={hoverId == null ? 0.4 : active ? 0.9 : 0.07}
                />
              );
            })}
          </g>

          {/* nodes */}
          <g>
            {nodesRef.current.map((n) => {
              if (n.x == null || n.y == null) return null;
              const active = isActive(n.id);
              const opacity = hoverId == null ? 1 : active ? 1 : 0.2;

              const isPrinciple = n.kind === "principle";
              const isCategory = n.kind === "category";
              const isTopic = n.kind === "topic";

              let fill = "var(--bg-card)";
              let stroke = "var(--line)";
              let textColor = "var(--text-muted)";
              let fontWeight = 400;

              if (isPrinciple) {
                fill = "var(--accent-soft)";
                stroke = "var(--accent-line)";
                textColor = "var(--accent-ink)";
                fontWeight = 600;
              } else if (isCategory) {
                fill = "var(--bg-card-hi)";
                stroke = "var(--line-strong)";
                textColor = "var(--text)";
                fontWeight = 600;
              } else if (isTopic && n.completed) {
                fill = "var(--accent)";
                stroke = "var(--accent)";
                textColor = "var(--bg)";
                fontWeight = 500;
              }

              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x},${n.y})`}
                  opacity={opacity}
                  style={{ cursor: "pointer", transition: "opacity 160ms" }}
                  onMouseEnter={() => setHoverId(n.id)}
                  onMouseLeave={() => setHoverId((h) => (h === n.id ? null : h))}
                  onClick={() => go(n.href)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      go(n.href);
                    }
                  }}
                >
                  <title>{n.label}</title>
                  <rect
                    x={-n.hw}
                    y={-n.hh}
                    width={n.hw * 2}
                    height={n.hh * 2}
                    rx={n.hh}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isCategory ? 1.6 : 1}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={isTopic ? 10 : isPrinciple ? 11 : 12}
                    fontWeight={fontWeight}
                    fill={textColor}
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {n.label}
                  </text>
                </g>
              );
            })}
          </g>
          </>
          )}
        </svg>
      </div>

      {/* legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-mono text-[var(--text-faint)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-line)]" />
          principle
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-[var(--bg-card-hi)] border border-[var(--line-strong)]" />
          category
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-[var(--accent)]" />
          topic you&rsquo;ve finished
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-[var(--bg-card)] border border-[var(--line)]" />
          topic to explore
        </span>
        <span className="ml-auto text-[var(--text-faint)]">hover to trace · click to open</span>
      </div>
    </div>
  );
}
