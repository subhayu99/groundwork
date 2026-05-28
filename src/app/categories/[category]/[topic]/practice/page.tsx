import { notFound } from "next/navigation";
import { getCategory, getTopic } from "@/categories/registry";
import { listPracticeProblems } from "@/categories/topic-registry";
import { PracticeListClient } from "./PracticeListClient";

export default async function PracticeListPage({
  params,
}: {
  params: Promise<{ category: string; topic: string }>;
}) {
  const { category, topic } = await params;
  const cat = getCategory(category);
  const top = getTopic(category, topic);
  if (!cat || !top) notFound();

  const problems = listPracticeProblems(category, topic);

  return (
    <PracticeListClient
      categoryKey={category}
      topicKey={topic}
      categoryName={cat.name}
      topicName={top.name}
      problems={problems.map((p) => ({
        id: p.id,
        title: p.title,
        teaser: p.teaser,
        difficulty: p.difficulty,
      }))}
    />
  );
}
