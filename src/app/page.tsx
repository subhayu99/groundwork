import Link from "next/link";
import { Chrome } from "@/shared/layout/Chrome";
import { listCategories, listTopicsInCategory } from "@/categories/registry";
import { getPrinciple } from "@/principles/registry";

export default function Home() {
  const categories = listCategories();

  return (
    <div className="min-h-screen flex flex-col">
      <Chrome />

      <main className="flex-1 max-w-4xl mx-auto px-8 py-16 w-full">
        <h1 className="text-5xl font-semibold text-[var(--text)] mb-3">
          First principles, not patterns.
        </h1>
        <p className="text-lg text-[var(--text-muted)] mb-12 max-w-2xl">
          Learn the seven ideas underneath every algorithm. Derive each pattern from scratch &mdash;
          never memorize a name without understanding what it&rsquo;s made of.
        </p>

        <div className="space-y-12">
          {categories.map((cat) => {
            const topics = listTopicsInCategory(cat.key);
            return (
              <section key={cat.key}>
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold text-[var(--text)]">{cat.name}</h2>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{cat.description}</p>
                </div>
                {topics.length === 0 ? (
                  <p className="text-sm font-mono text-[var(--text-faint)]">coming soon</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {topics.map((t) => (
                      <Link
                        key={t.key}
                        href={`/categories/${cat.key}/${t.key}`}
                        className="block p-4 rounded-xl border border-[var(--line-faint)] bg-[var(--bg-card)] hover:border-[var(--line-strong)] transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-[var(--text)]">{t.name}</h3>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase"
                            style={{
                              color:
                                t.difficulty === "easy"
                                  ? "var(--diff-easy)"
                                  : t.difficulty === "medium"
                                  ? "var(--diff-med)"
                                  : t.difficulty === "hard"
                                  ? "var(--diff-hard)"
                                  : "var(--text-muted)",
                            }}
                          >
                            {t.difficulty}
                          </span>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {t.principles.map((p) => (
                            <span
                              key={p}
                              className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--accent-ink)]"
                            >
                              {getPrinciple(p)?.displayName ?? p.replaceAll("-", " ")}
                            </span>
                          ))}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
