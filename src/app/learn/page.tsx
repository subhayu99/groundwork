import Link from "next/link";
import { Chrome } from "@/shared/layout/Chrome";
import { ResumeBanner } from "../ResumeBanner";
import { TopicTierMap } from "./TopicTierMap";
import { YouAreHere } from "./YouAreHere";
import { JourneySpine } from "@/shared/journey/JourneySpine";

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
          open any topic to begin its lesson.{" "}
          {/* "Hover" is a dead instruction on touch — swap to "Tap" under a coarse
              pointer (CSS only, so no hydration branch). */}
          <span className="pointer-coarse:hidden">Hover</span>
          <span className="hidden pointer-coarse:inline">Tap</span> a topic to trace what
          it&rsquo;s made of.
        </p>
        {/* The four-stage spine as a slim "you are here" rail above the map. It
            reads saved progress itself (showProgress) and tolerates no progress. */}
        <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <JourneySpine variant="compact" showProgress />
          <Link
            href="/plan"
            className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent-ink)] hover:text-[var(--text)]"
          >
            see your plan →
          </Link>
        </div>
        <YouAreHere />
        <div className="mb-8 max-w-xl">
          <ResumeBanner />
        </div>
        <TopicTierMap />
      </main>
    </div>
  );
}
