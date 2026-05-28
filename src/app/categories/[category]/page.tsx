import Link from "next/link";
import { notFound } from "next/navigation";
import { Chrome } from "@/shared/layout/Chrome";
import { getCategory, listCategories, listTopicsInCategory } from "@/categories/registry";
import { getPrinciple } from "@/principles/registry";

export function generateStaticParams() {
  return listCategories().map((c) => ({ category: c.key }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();

  const topics = listTopicsInCategory(category);

  return (
    <div className="min-h-screen flex flex-col">
      <Chrome breadcrumb={[{ label: cat.name }]} />

      <main className="flex-1 max-w-4xl mx-auto px-8 py-16 w-full">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-1">
          category
        </div>
        <h1 className="text-4xl font-semibold text-[var(--text)] mb-2">{cat.name}</h1>
        <p className="text-base text-[var(--text-muted)] mb-10 max-w-2xl">{cat.description}</p>

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
      </main>
    </div>
  );
}
