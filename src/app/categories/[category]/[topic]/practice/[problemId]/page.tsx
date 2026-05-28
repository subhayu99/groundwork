import { notFound } from "next/navigation";
import { getCategory, getTopic, listAllTopics } from "@/categories/registry";
import { getPracticeProblem, listPracticeProblems } from "@/categories/topic-registry";
import { Chrome } from "@/shared/layout/Chrome";
import { ProblemView } from "@/shared/practice/ProblemView";

export function generateStaticParams() {
  const params: { category: string; topic: string; problemId: string }[] = [];
  for (const t of listAllTopics()) {
    for (const p of listPracticeProblems(t.category, t.key)) {
      params.push({ category: t.category, topic: t.key, problemId: p.id });
    }
  }
  return params;
}

export default async function PracticeProblemPage({
  params,
}: {
  params: Promise<{ category: string; topic: string; problemId: string }>;
}) {
  const { category, topic, problemId } = await params;
  const cat = getCategory(category);
  const top = getTopic(category, topic);
  if (!cat || !top) notFound();

  const problem = getPracticeProblem(category, topic, problemId);
  if (!problem) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <Chrome
        breadcrumb={[
          { label: cat.name, href: `/categories/${category}` },
          { label: top.name, href: `/categories/${category}/${topic}` },
          { label: "Practice", href: `/categories/${category}/${topic}/practice` },
          { label: problem.title },
        ]}
      />
      <main className="flex-1">
        <ProblemView
          categoryKey={category}
          topicKey={topic}
          topicName={top.name}
          problem={problem}
        />
      </main>
    </div>
  );
}
