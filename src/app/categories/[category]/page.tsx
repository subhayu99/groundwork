import { notFound } from "next/navigation";
import { Chrome } from "@/shared/layout/Chrome";
import { getCategory, listCategories, listTopicsInCategory, listAllTopics } from "@/categories/registry";
import { CategoryChapters } from "./CategoryChapters";

export function generateStaticParams() {
  return listCategories().map((c) => ({ category: c.key }));
}

/* ── Track intros (3-5 sentences, plain language) ──────────────────────────────
 * Adapted from docs/contracts/TRACK-NARRATIVES.md — the jargon-free retelling of
 * each track's story arc, so a newcomer reads "here is the journey" before the
 * numbered chapters. Keyed by category key. */
const TRACK_INTRO: Record<string, string> = {
  "programming-basics":
    "This track builds one skill — writing a small program — a single layer at a time. " +
    "You start by giving a value a name so the computer never has to figure it out twice, " +
    "then teach it to make decisions and to repeat work without you typing it out. " +
    "By the end you can fold all of that into a reusable step and keep it standing even when " +
    "the real world misbehaves. Finish here and you can read every line of code the rest of " +
    "the platform will show you.",
  "data-structures":
    "Every structure in this track is a deal: what you pay to store your data, and what you " +
    "get back instantly in return. You begin with a simple numbered row of boxes, then meet " +
    "rows that restrict themselves on purpose, chains that point from one box to the next, and " +
    "a filing system so clever that “is it in here?” stops depending on how much data you have. " +
    "It ends with trees and graphs, where anything can connect to anything. " +
    "Finish here and you arrive at algorithms with your structures chosen and their costs known.",
  algorithms:
    "This track is the same handful of big ideas, shown in action: every algorithm is a " +
    "disciplined way to avoid doing work you don’t have to. " +
    "You start by walking across arrays cleverly — throwing away half the search at a time, " +
    "or reusing yesterday’s answer instead of recomputing it. " +
    "Then the problems start solving smaller copies of themselves, and you learn to explore, " +
    "remember, and prune whole branches of work. " +
    "By the close, all seven core ideas have shown up at least once — the thesis made visible.",
};

/* ── One-line, jargon-free chapter descriptions ────────────────────────────────
 * Keyed by topic key. Adapted from the per-topic sentences in TRACK-NARRATIVES.md;
 * plain language, no Big-O / no principle jargon. Apostrophes/quotes use string
 * exprs or escapes for JSX safety. */
const TOPIC_BLURB: Record<string, string> = {
  // Programming Basics
  variables: "A name that remembers a value, so nothing is ever figured out twice.",
  constants: "A name that carries a promise: this value will never change.",
  "data-types": "A name that also guarantees what kind of thing it is holding.",
  operators: "Combine stored values into new ones — big expressions built from small ones.",
  conditionals: "A yes/no test that sends the computer down one road and abandons the other.",
  "while-loops": "Repeat a step until a condition says stop — with a promise it eventually will.",
  "for-loops": "Walk through a whole collection, carrying a running answer as you go.",
  functions: "Fold a set of steps into one named, reusable move.",
  "try-except": "Keep the common path simple and stay standing when the rare failure hits.",
  // Data Structures
  arrays: "A numbered row of boxes where reaching any position takes a single step.",
  strings: "That same row wearing text’s clothes — with one twist that makes edits honest.",
  "hash-maps": "A filing system where “is it in here?” stops depending on how much you stored.",
  "sets-tuples": "The same filing trick stripped to membership, plus an unchangeable record.",
  "stacks-queues": "A row restricted on purpose: take only from the top, or only from the front.",
  "linked-lists": "Boxes that point to boxes — cheap to splice, and the first chain-shaped idea.",
  trees: "Let chains branch into a hierarchy, where you can throw whole halves away.",
  graphs: "Anything can point to anything; earlier structures become the tools to explore it.",
  // Algorithms
  "two-pointers": "Let sorted order steer two fingers so most pairs are never even looked at.",
  "binary-search": "Ask the middle, throw half the possibilities away — then repeat.",
  "sliding-window": "Reuse yesterday’s sum: subtract the box that left, add the box that joined.",
  "sliding-window-variable": "Same reuse, but now a rule decides when the window stretches or shrinks.",
  "monotonic-stack": "Each item is handled at most twice — so the average cost stays cheap.",
  "activity-selection": "Always take the earliest-finishing option, proven safe, and never look back.",
  recursion: "Solve a problem by trusting a smaller copy of the same problem.",
  dfs: "Explore a space by going as deep as you can, then backing up.",
  bfs: "Explore one ring at a time — and the shortest path falls out for free.",
  "dp-1d": "Remember sub-answers you already worked out, and an explosion of work collapses.",
  backtracking: "Try choices, and the moment one is hopeless, abandon that whole branch.",
  mergesort: "Split the work until it is trivial, then merge the pieces back in order.",
};

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();

  const topics = listTopicsInCategory(category);

  // Prerequisite key -> display name, resolved across all tracks (cross-track
  // anchors like arrays <- for-loops are intentional, per TRACK-NARRATIVES).
  const nameByKey = new Map(listAllTopics().map((t) => [t.key, t.name]));

  // Registry order already IS chapter order; keep prerequisites in that same
  // order so the "builds on" line reads in learn sequence.
  const learnIndex = new Map(topics.map((t, i) => [t.key, i]));
  const chapters = topics.map((topic) => ({
    topic,
    blurb: TOPIC_BLURB[topic.key] ?? "",
    buildsOn: [...topic.prerequisites]
      .sort((a, b) => (learnIndex.get(a) ?? 99) - (learnIndex.get(b) ?? 99))
      .map((k) => nameByKey.get(k) ?? k.replaceAll("-", " ")),
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Chrome breadcrumb={[{ label: cat.name }]} />
      <CategoryChapters
        categoryKey={cat.key}
        categoryName={cat.name}
        intro={TRACK_INTRO[cat.key] ?? cat.description}
        chapters={chapters}
      />
    </div>
  );
}
