import { notFound } from "next/navigation";
import { getCategory, getTopic, listAllTopics } from "@/categories/registry";
import { TopicPageClient } from "./TopicPageClient";

export function generateStaticParams() {
  return listAllTopics().map((t) => ({ category: t.category, topic: t.key }));
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ category: string; topic: string }>;
}) {
  const { category, topic } = await params;
  const cat = getCategory(category);
  const top = getTopic(category, topic);
  if (!cat || !top) notFound();

  return <TopicPageClient categoryKey={category} topicKey={topic} />;
}
