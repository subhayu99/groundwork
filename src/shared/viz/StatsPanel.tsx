"use client";

interface Stat {
  label: string;
  value: string | number;
  emphasis?: "default" | "warning" | "good";
}

interface StatsPanelProps {
  stats: Stat[];
}

export function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className="flex items-center gap-8 font-mono">
      {stats.map((s, i) => (
        <div key={i} className="flex flex-col items-start">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">
            {s.label}
          </span>
          <span
            className="text-2xl"
            style={{
              color:
                s.emphasis === "warning"
                  ? "var(--diff-med)"
                  : s.emphasis === "good"
                  ? "var(--diff-easy)"
                  : "var(--text)",
            }}
          >
            {s.value}
          </span>
        </div>
      ))}
    </div>
  );
}
