import Link from "next/link";
import type { Metadata } from "next";
import { Chrome } from "@/shared/layout/Chrome";
import { howToLearn } from "./content";

export const metadata: Metadata = {
  title: "How to learn — Groundwork",
  description:
    "The method behind the site: derive instead of memorize, type the code and run it, sit with the wall, and come back to re-derive from scratch.",
};

export default function HowToLearnPage() {
  const { intro, rules, theWall, comeBack, links } = howToLearn;

  return (
    <div className="min-h-screen flex flex-col">
      <Chrome breadcrumb={[{ label: "How to learn" }]} />

      <main id="main-content" className="flex-1 max-w-3xl mx-auto px-5 md:px-8 py-16 w-full">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-1">
          the method
        </div>
        <h1 className="text-4xl font-semibold text-[var(--text)] mb-4">How to learn here</h1>
        <p className="text-lg text-[var(--text-muted)] leading-relaxed max-w-2xl">{intro}</p>

        {/* THE RULES */}
        <div className="mt-14 text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-5">
          five habits that make it work
        </div>
        <ol className="space-y-7">
          {rules.map((rule, i) => (
            <li
              key={rule.title}
              className="rounded-xl border border-[var(--line-faint)] bg-[var(--bg-card)] p-5 md:p-6"
            >
              <div className="flex items-baseline gap-3">
                <span
                  aria-hidden="true"
                  className="font-mono text-sm text-[var(--accent-ink)] tabular-nums"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="text-lg font-semibold text-[var(--text)] leading-snug">
                  {rule.title}
                </h2>
              </div>
              <p className="mt-2 pl-9 text-[15px] text-[var(--text-muted)] leading-relaxed">
                {rule.body}
              </p>
            </li>
          ))}
        </ol>

        {/* THE WALL — the part people quit on, called out on its own */}
        <section className="mt-14 rounded-xl border border-[var(--line-faint)] bg-[var(--bg-elevated)] p-6 md:p-7">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-ink)] mb-3">
            the wall
          </div>
          <p className="text-base text-[var(--text)] leading-relaxed">{theWall}</p>
        </section>

        {/* SPACED RE-DERIVATION */}
        <section className="mt-12">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-3">
            come back later
          </div>
          <p className="text-base text-[var(--text-muted)] leading-relaxed max-w-2xl">{comeBack}</p>
        </section>

        {/* WHERE TO GO — the real topic, named by its idea (bridge rule) */}
        <section className="mt-12 pt-8 border-t border-[var(--line-faint)]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-4">
            then go do one
          </div>
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group inline-flex items-center gap-2 font-medium text-[var(--text)] underline decoration-[var(--line-strong)] underline-offset-4 hover:decoration-[var(--text)] transition-colors"
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className="text-[var(--text-faint)] group-hover:text-[var(--text)] transition-colors"
                >
                  &rarr;
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-14">
          <Link href="/" className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--text)]">
            &larr; back home
          </Link>
        </div>
      </main>
    </div>
  );
}
