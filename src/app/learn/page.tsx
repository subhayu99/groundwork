import { Chrome } from "@/shared/layout/Chrome";
import { ResumeBanner } from "../ResumeBanner";
import { TopicTierMap } from "./TopicTierMap";

export const metadata = {
  title: "The map — Groundwork",
  description: "Every topic sits on the ones it builds on. Start at the foundation and work down.",
};

export default function LearnPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Chrome />
      <main id="main-content" className="flex-1 max-w-6xl mx-auto px-5 md:px-8 py-12 w-full">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--text)] mb-2">The map</h1>
        <p className="text-[var(--text-muted)] mb-6 max-w-2xl">
          Every topic sits on the ones it builds on. Start at the foundation and work down &mdash;
          open any topic to begin its lesson. Hover a topic to trace what it&rsquo;s made of.
        </p>
        <div className="mb-8 max-w-xl">
          <ResumeBanner />
        </div>
        <TopicTierMap />
      </main>
    </div>
  );
}
