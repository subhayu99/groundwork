import Link from "next/link";
import { notFound } from "next/navigation";
import { Chrome } from "@/shared/layout/Chrome";
import { listPrinciples, getPrinciple } from "@/principles/registry";
import { listAllTopics, listCategories } from "@/categories/registry";
import type { PrincipleKey } from "@/shared/derivation/types";

export function generateStaticParams() {
  return listPrinciples().map((p) => ({ principle: p.key }));
}

export default async function PrinciplePage({
  params,
}: {
  params: Promise<{ principle: string }>;
}) {
  const { principle } = await params;
  const meta = getPrinciple(principle as PrincipleKey);
  if (!meta) notFound();

  const topics = listAllTopics().filter((t) =>
    t.principles.includes(principle as PrincipleKey),
  );
  const cats = listCategories();

  return (
    <div className="min-h-screen flex flex-col">
      <Chrome breadcrumb={[{ label: "Principle" }, { label: meta.name }]} />

      <main id="main-content" className="flex-1 max-w-3xl mx-auto px-5 md:px-8 py-16 w-full">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-1">
          one of the seven ideas
        </div>
        <h1 className="text-4xl font-semibold text-[var(--text)] mb-2">{meta.name}</h1>
        <p className="text-lg text-[var(--accent-ink)] mb-3">{meta.displayName}</p>
        <p className="text-base text-[var(--text-muted)] mb-12 max-w-2xl">
          {meta.universalFraming}
        </p>

        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-4">
          where this idea shows up
        </div>

        {topics.length === 0 ? (
          <p className="text-sm font-mono text-[var(--text-faint)]">no topics yet</p>
        ) : (
          <div className="space-y-8">
            {cats.map((cat) => {
              const inCat = topics.filter((t) => t.category === cat.key);
              if (inCat.length === 0) return null;
              return (
                <section key={cat.key}>
                  <h2 className="text-sm font-mono uppercase tracking-wider text-[var(--text-muted)] mb-3">
                    {cat.name}
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {inCat.map((t) => (
                      <Link
                        key={t.key}
                        href={`/categories/${t.category}/${t.key}`}
                        className="block p-4 rounded-xl border border-[var(--line-faint)] bg-[var(--bg-card)] hover:border-[var(--line-strong)] transition-colors"
                      >
                        <h3 className="font-semibold text-[var(--text)]">{t.name}</h3>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <div className="mt-12">
          <Link
            href="/"
            className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            ← back to all topics
          </Link>
        </div>
      </main>
    </div>
  );
}
