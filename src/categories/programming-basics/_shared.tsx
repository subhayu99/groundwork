import type { ReactNode } from "react";

/** Shared canvas size + small SVG building blocks for the Programming Basics track,
 *  so every lesson draws with the same look (DRY across the track). */
export const VW = 860, VH = 470;

/** A labelled value box: the name floats above, the value sits inside. */
export function Box({
  x, y, w = 150, h = 64, name, value, active, tone = "accent",
}: {
  x: number; y: number; w?: number; h?: number; name?: string; value: ReactNode; active?: boolean;
  tone?: "accent" | "good" | "bad" | "muted";
}) {
  const stroke = !active ? "var(--line)" : tone === "good" ? "var(--diff-easy)" : tone === "bad" ? "var(--diff-hard)" : "var(--accent-line)";
  const fill = !active
    ? "var(--bg-card)"
    : tone === "good" ? "color-mix(in oklab, var(--diff-easy) 14%, var(--bg-card))"
    : tone === "bad" ? "color-mix(in oklab, var(--diff-hard) 14%, var(--bg-card))"
    : "var(--accent-soft)";
  return (
    <g>
      {name != null && (
        <text x={x + w / 2} y={y - 12} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 13, fill: active ? "var(--accent-ink)" : "var(--text-muted)" }}>{name}</text>
      )}
      <rect x={x} y={y} width={w} height={h} rx={12} fill={fill} stroke={stroke} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
      <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 18, fill: "var(--text)" }}>{value}</text>
    </g>
  );
}

/** A small rounded label chip. */
export function Chip({ x, y, w, text, tone = "muted" }: { x: number; y: number; w: number; text: string; tone?: "accent" | "good" | "bad" | "muted" }) {
  const stroke = tone === "good" ? "var(--diff-easy)" : tone === "bad" ? "var(--diff-hard)" : tone === "accent" ? "var(--accent-line)" : "var(--line)";
  const fill = tone === "accent" ? "var(--accent-soft)" : tone === "good" ? "color-mix(in oklab, var(--diff-easy) 12%, var(--bg-card))" : tone === "bad" ? "color-mix(in oklab, var(--diff-hard) 12%, var(--bg-card))" : "var(--bg-card)";
  return (
    <g>
      <rect x={x} y={y} width={w} height={32} rx={8} fill={fill} stroke={stroke} strokeWidth={1.5} style={{ transition: "fill .3s, stroke .3s" }} />
      <text x={x + w / 2} y={y + 16} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text)" }}>{text}</text>
    </g>
  );
}

/** A centred caption line under the diagram. */
export function Cap({ y = 162, children, tone }: { y?: number; children: ReactNode; tone?: "muted" | "good" | "bad" }) {
  const fill = tone === "good" ? "var(--diff-easy)" : tone === "bad" ? "var(--diff-hard)" : "var(--text-faint)";
  return <text x={VW / 2} y={y} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 13, fill }}>{children}</text>;
}
