import { notFound } from "next/navigation";
import { getCategory, getTopic } from "@/categories/registry";
import { TopicPageClient } from "./TopicPageClient";

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
