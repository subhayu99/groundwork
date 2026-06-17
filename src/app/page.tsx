import Link from "next/link";
import { Chrome } from "@/shared/layout/Chrome";
import { ResumeBanner } from "./ResumeBanner";
import { JourneySpine } from "@/shared/journey/JourneySpine";
import { listPrinciples } from "@/principles/registry";
import { listAllTopics, listCategories } from "@/categories/registry";

const STEPS = [
  { n: "01", t: "Start from a problem", d: "No definitions up front. You meet a real question and feel why the obvious approach is too slow." },
  { n: "02", t: "Derive the idea", d: "Step by step on an animated canvas — you watch the insight appear, one move at a time, until the algorithm assembles itself." },
  { n: "03", t: "See the real code", d: "The same idea in plain Python, line by line, tied to the picture. The name comes last, once it's obvious." },
];

export default function Landing() {
  const principles = listPrinciples();
  const topicCount = listAllTopics().length;
  // Scope row numbers come straight from the registry so they can never drift
  // from what the platform actually ships: lessons = all topics, ideas = the
  // seven principles, tracks = the registry categories.
  const ideaCount = principles.length;
  const trackCount = listCategories().length;

  return (
    <div className="min-h-screen flex flex-col">
      <Chrome />

      <main id="main-content" className="flex-1 w-full">
        {/* HERO */}
        <section className="max-w-4xl mx-auto px-5 md:px-8 pt-20 pb-14 w-full">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line-faint)] bg-[var(--bg-card)] px-3 py-1 mb-6 font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            <span className="inline-block w-2 h-2 rotate-45 bg-[var(--accent-sky)]" />
            {topicCount} lessons · {principles.length} principles
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold text-[var(--text)] leading-[1.05] mb-5">
            First principles,
            <br />
            not patterns.
          </h1>
          <p className="text-lg text-[var(--text-muted)] mb-8 max-w-2xl leading-relaxed">
            Most courses make you memorize algorithm names. Groundwork teaches the seven ideas
            underneath every one of them &mdash; then has you{" "}
            <strong className="text-[var(--text)]">derive each algorithm from scratch</strong>, step
            by step, until it feels obvious.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/start"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--bg)] hover:opacity-90 transition-opacity"
            >
              Start learning &rarr;
            </Link>
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] px-5 py-3 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--line-strong)] transition-colors"
            >
              Browse the map &rarr;
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1.5 px-2 py-3 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              See how it works &rarr;
            </Link>
          </div>
          <p className="mt-3 text-[12.5px] text-[var(--text-faint)]">
            Three quick questions pick your starting point and how lessons are explained.
          </p>
          <div className="mt-8 max-w-xl">
            <ResumeBanner />
          </div>
        </section>

        {/* THE JOURNEY — the named four-stage arc, plus a registry-computed scope row */}
        <section className="border-t border-[var(--line-faint)]">
          <div className="max-w-4xl mx-auto px-5 md:px-8 py-14 w-full">
            <h2 className="text-2xl font-semibold text-[var(--text)] mb-1">The journey, end to end</h2>
            <p className="text-[var(--text-muted)] mb-3">
              Four stages, from your first line of code to interview-ready &mdash; each one builds on the last.
            </p>
            <div className="mb-7 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-[var(--text-faint)]">
              <span className="text-[var(--text-muted)]">{topicCount} lessons</span>
              <span aria-hidden="true">&middot;</span>
              <span className="text-[var(--text-muted)]">{ideaCount} ideas</span>
              <span aria-hidden="true">&middot;</span>
              <span className="text-[var(--text-muted)]">{trackCount} tracks</span>
            </div>
            <JourneySpine variant="full" />
          </div>
        </section>

        {/* SEVEN PRINCIPLES */}
        <section className="border-t border-[var(--line-faint)] bg-[var(--bg-elevated)]">
          <div className="max-w-4xl mx-auto px-5 md:px-8 py-14 w-full">
            <h2 className="text-2xl font-semibold text-[var(--text)] mb-1">Seven ideas underneath everything</h2>
            <p className="text-[var(--text-muted)] mb-8">
              Every algorithm you&rsquo;ll meet is one (or a few) of these in disguise.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {principles.map((p) => (
                <Link
                  key={p.key}
                  href={`/principles/${p.key}`}
                  className="block p-4 rounded-xl border border-[var(--line-faint)] bg-[var(--bg-card)] hover:border-[var(--line-strong)] transition-colors"
                >
                  <div className="font-semibold text-[var(--text)] mb-0.5 leading-snug first-letter:uppercase">{p.displayName}</div>
                  <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-faint)]">{p.name}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* HOW A LESSON WORKS */}
        <section className="max-w-4xl mx-auto px-5 md:px-8 py-14 w-full">
          <h2 className="text-2xl font-semibold text-[var(--text)] mb-8">How a lesson works</h2>
          <div className="grid gap-7 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div className="font-mono text-sm text-[var(--accent-ink)] mb-2">{s.n}</div>
                <div className="font-semibold text-[var(--text)] mb-1">{s.t}</div>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="border-t border-[var(--line-faint)]">
          <div className="max-w-4xl mx-auto px-5 md:px-8 py-16 w-full text-center">
            <h2 className="text-3xl font-semibold text-[var(--text)] mb-3">Build it from the ground up.</h2>
            <p className="text-[var(--text-muted)] mb-7 max-w-xl mx-auto">
              Follow the map from foundations to advanced &mdash; every topic sits on the ones it builds on.
            </p>
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--bg)] hover:opacity-90 transition-opacity"
            >
              See the map &rarr;
            </Link>

            <div className="mt-12 pt-8 border-t border-[var(--line-faint)] max-w-xl mx-auto">
              <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-faint)] mb-2">
                Don&rsquo;t see your topic?
              </div>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                Tell us what you want to derive next &mdash; the most-asked-for topics get built first.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
                <a
                  href="https://github.com/subhayu99/groundwork/issues/new?title=Topic+request%3A+&labels=topic-request&body=Which+topic+would+you+like+to+derive+from+first+principles%3F"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--text)] underline decoration-[var(--line-strong)] underline-offset-4 hover:decoration-[var(--text)] transition-colors"
                >
                  Request it on GitHub &rarr;
                </a>
                <a
                  href="mailto:balasubhayu99@gmail.com?subject=Groundwork%20topic%20request&body=I%27d%20love%20to%20see%20a%20lesson%20on%3A%20"
                  className="font-medium text-[var(--text-muted)] underline decoration-[var(--line-faint)] underline-offset-4 hover:text-[var(--text)] hover:decoration-[var(--line-strong)] transition-colors"
                >
                  Or email a suggestion
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
