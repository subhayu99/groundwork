import { Chrome } from "@/shared/layout/Chrome";
import { OnboardingQuiz } from "./OnboardingQuiz";

export const metadata = {
  title: "Get set up — Groundwork",
  description:
    "Three quick questions so Groundwork knows where you should start and how every lesson should be pitched.",
};

export default function StartPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Chrome />
      <main id="main-content" className="flex-1 max-w-3xl mx-auto px-5 md:px-8 py-12 w-full">
        <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-faint)] mb-1">
          get set up
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--text)] mb-3">
          Three quick questions.
        </h1>
        <p className="text-[var(--text-muted)] mb-10 max-w-2xl leading-relaxed">
          Groundwork teaches the ideas underneath computer science by deriving them from first
          principles — no memorizing. Your answers decide <strong className="text-[var(--text)]">where you start</strong> and{" "}
          <strong className="text-[var(--text)]">how every lesson is pitched</strong>. Nothing is locked away — you can
          change these any time in settings.
        </p>
        <OnboardingQuiz />
      </main>
    </div>
  );
}
