/**
 * LEAF C — /how-it-works copy. All prose for the page lives here so it can be
 * tested in isolation (see src/tests/how-it-works.content.test.ts) without
 * importing React. The page component reads this object and the JourneySpine.
 *
 * Voice: structured base register (docs/contracts/VOICE-AND-DEPTH.md) —
 * plain English first, the term second. Anti-slop is enforced by the test.
 *
 * Stage names + promises are quoted from src/shared/journey/spine.ts (STAGES);
 * the seven ideas are the principles in src/principles/registry.ts. This file
 * does not import them (it is plain copy), but the wording is kept in sync.
 */

export interface HowItWorksContent {
  intro: string;
  promise: string[];
  stagesIntro: string;
  sevenIdeas: string;
  whereToStart: string;
  links: { href: string; label: string }[];
}

export const howItWorks: HowItWorksContent = {
  // What Groundwork is, in one breath.
  intro:
    "Groundwork teaches the ideas under computer science by having you rebuild each one from scratch, so the algorithm with a famous name feels like something you would have arrived at yourself.",

  // The promise — three concrete commitments, one per line.
  promise: [
    "You derive each algorithm instead of memorizing its name. Every lesson starts from a real problem, lets you feel why the obvious approach is too slow, then walks you to the fix one step at a time.",
    "The code is real, runnable Python — the same idea you just watched on the canvas, line by line, with the name arriving last, once it is obvious.",
    "It stays private and local. No account, no sign-up, no tracking. Your progress lives in your own browser, and nothing about what you study leaves this machine.",
  ],

  // Intro to the four-stage journey. Stage names + promises are from STAGES.
  stagesIntro:
    "The work is laid out as four stages, and each one earns you a plain ability. Foundations: make the computer do what you say. Structures: hold data so you can find it again. Techniques: turn the seven ideas into algorithms. Fluency: make it stick through practice and recall until you can do it under interview pressure. You move down the stages in order, because every topic sits on the ones before it.",

  // The seven ideas (principles registry).
  sevenIdeas:
    "Under the algorithms are seven repeating ideas, and once you see them you stop meeting a hundred separate tricks. Reuse what you already worked out instead of redoing it. Eliminate half the possibilities each step rather than checking them one by one. Keep a promise alive that lets you skip work. Solve a smaller version of the same problem. Write something down so you can look it up instantly. Pay a little extra sometimes so the average stays cheap. Take the best local choice when you can prove it is also best overall. Most algorithms you will meet are one or two of these wearing a disguise.",

  // Where a newcomer starts — concrete and directive.
  whereToStart:
    "If you are new, start with the three quick questions. They set where you begin and how plainly each lesson is pitched, then drop you straight into your first derivation. If you would rather see the whole shape first, open the map and pick any topic — it traces what it is built on. And if you want the reasoning behind deriving over memorizing before you commit, read how to learn here first.",

  links: [
    { href: "/start", label: "Answer three quick questions" },
    { href: "/learn", label: "Open the map" },
    { href: "/how-to-learn", label: "Why derive, not memorize" },
  ],
};
