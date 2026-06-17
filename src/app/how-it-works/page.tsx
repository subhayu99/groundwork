import Link from "next/link";
import { Chrome } from "@/shared/layout/Chrome";
import { JourneySpine } from "@/shared/journey/JourneySpine";
import { STAGES } from "@/shared/journey/spine";
import { howItWorks } from "./content";

export const metadata = {
  title: "How it works — Groundwork",
  description:
    "What Groundwork is, what it promises, the four-stage journey and the seven ideas under every algorithm — and exactly where a newcomer should start.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Chrome breadcrumb={[{ label: "How it works" }]} />

      <main id="main-content" className="flex-1 max-w-3xl mx-auto px-5 md:px-8 py-16 w-full">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-1">
          how it works
        </div>
        <h1 className="text-4xl font-semibold text-[var(--text)] mb-3">
          Lay of the land
        </h1>
        <p className="text-base text-[var(--text-muted)] mb-12 max-w-2xl leading-relaxed">
          {howItWorks.intro}
        </p>

        {/* OUR PROMISE */}
        <section className="mb-14">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-4">
            our promise
          </div>
          <ul className="space-y-4">
            {howItWorks.promise.map((p, i) => (
              <li key={i} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 inline-block w-2 h-2 rotate-45 shrink-0 bg-[var(--accent-sky)]"
                />
                <p className="text-base text-[var(--text-muted)] leading-relaxed">{p}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* THE FOUR-STAGE JOURNEY */}
        <section className="mb-14">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-4">
            the four-stage journey
          </div>
          <p className="text-base text-[var(--text-muted)] mb-6 leading-relaxed">
            {howItWorks.stagesIntro}
          </p>
          <ol className="space-y-3">
            {STAGES.map((s) => (
              <li
                key={s.key}
                className="flex items-baseline gap-4 rounded-xl border border-[var(--line-faint)] bg-[var(--bg-card)] px-4 py-3"
              >
                <span className="font-mono text-sm text-[var(--accent-ink)] shrink-0">
                  {s.n}/{s.total}
                </span>
                <span className="min-w-0">
                  <span className="font-semibold text-[var(--text)]">{s.name}</span>
                  <span className="text-[var(--text-faint)]"> — </span>
                  <span className="text-[var(--text-muted)]">{s.promise}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* THE SEVEN IDEAS */}
        <section className="mb-14">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-4">
            the seven ideas
          </div>
          <p className="text-base text-[var(--text-muted)] leading-relaxed">
            {howItWorks.sevenIdeas}
          </p>
        </section>

        {/* THE WHOLE ARC — JourneySpine, full variant */}
        <section className="mb-14">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-4">
            the whole arc
          </div>
          <JourneySpine variant="full" />
        </section>

        {/* WHERE TO START */}
        <section className="mb-12">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-4">
            where to start
          </div>
          <p className="text-base text-[var(--text-muted)] mb-6 leading-relaxed">
            {howItWorks.whereToStart}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {howItWorks.links.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                className={
                  i === 0
                    ? "inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--bg)] hover:opacity-90 transition-opacity"
                    : "inline-flex items-center gap-2 rounded-xl border border-[var(--line)] px-5 py-3 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--line-strong)] transition-colors"
                }
              >
                {l.label} &rarr;
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-4">
          <Link
            href="/"
            className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            &larr; back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
