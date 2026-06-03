import Link from "next/link";

export type PrereqItem = { name: string; href: string; completed: boolean };

/**
 * Non-blocking, advisory banner shown before a lesson when the learner hasn't
 * finished its prerequisites. It never blocks navigation — the learner can
 * always "Continue anyway". Stateless: the parent owns dismissal.
 */
export function PrereqNudge({
  prerequisites,
  onContinue,
}: {
  prerequisites: PrereqItem[];
  onContinue: () => void;
}) {
  const unmet = prerequisites.filter((p) => !p.completed);
  if (unmet.length === 0) return null;

  return (
    <div
      className="pointer-events-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] px-5 py-4"
      role="note"
      aria-label="Recommended foundation"
    >
      <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-ink)]">
        Recommended foundation
      </div>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--text-muted)]">
        This usually clicks faster once you&apos;ve done{" "}
        <strong className="text-[var(--text)]">
          {unmet.map((p, i) => (
            <span key={p.href}>
              {i > 0 && (i === unmet.length - 1 ? " and " : ", ")}
              {p.name}
            </span>
          ))}
        </strong>
        .
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {unmet.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-1.5 text-[12.5px] text-[var(--accent-ink)] hover:border-[var(--line-strong)] transition-colors"
          >
            <span className="inline-block w-2 h-2 rotate-45 bg-[var(--accent-sky)]" />
            {p.name}
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-inset)] transition-colors"
      >
        Continue anyway →
      </button>
    </div>
  );
}
