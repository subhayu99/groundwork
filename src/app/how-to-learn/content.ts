/**
 * /how-to-learn — the meta-lesson. The one page that is ABOUT the method, not a
 * topic. Pure data; the page renders it. Human-facing prose: anti-slop strict
 * (no AI-ese, varied rhythm, concrete over abstract), and the topic link follows
 * the TRACK-NARRATIVES bridge rule — recall the IDEA, never the topic's name.
 */

export interface HowToLearnContent {
  intro: string;
  rules: { title: string; body: string }[];
  theWall: string;
  comeBack: string;
  links: { href: string; label: string }[];
}

export const howToLearn: HowToLearnContent = {
  intro:
    "This whole site is built on one bet: an idea you worked out yourself is the only kind you actually keep. A name you were handed fades by next week. So every lesson hands you a problem before it hands you an answer, and asks you to build the answer one move at a time. Read this page once. It is the method that makes the rest of the site work, and it takes about three minutes.",

  rules: [
    {
      title: "Derive it, don't memorize it",
      body:
        "Memorizing the name of an algorithm tells you nothing about when to reach for it. Each lesson starts you at the obvious slow approach, lets you feel exactly where it hurts, and only then builds the fast idea that fixes that pain. When the idea finally clicks, it clicks because you watched it become necessary, not because someone told you to remember it. The name comes last, once it is obvious what to call the thing you just built.",
    },
    {
      title: "Type the code yourself, then run it",
      body:
        "Reading code feels like understanding code. It is not the same thing. Open an editor, type the lines out by hand instead of copying, and run them. Then break something on purpose: change a bound, drop a line, feed it the empty input. Watch how it fails. The gap between what you expected and what the machine did is the most honest teacher you have, and you only meet it by running the thing.",
    },
    {
      title: "Sit with the moment it won't click",
      body:
        "There is always one step where the derivation stalls and your brain refuses to take it. That moment feels like failure. It is not. It is the exact spot where the learning happens, and everyone hits it, every time. Do not reach for the hint yet. Stay there. Re-read the last step you did understand, draw the small case on paper, say the question out loud. The understanding that arrives after you have struggled for it is the kind that stays.",
    },
    {
      title: "Come back and re-derive from scratch",
      body:
        "A week after a lesson clicks, open it again and rebuild the idea from the problem, without reading the steps first. You will stumble in new places, and that is the point: the stumble shows you which part you only borrowed. Re-deriving beats re-reading every time, because re-reading lets you nod along at something you could not actually reproduce. Space these returns out. The longer the gap you can still cross, the deeper the idea has set.",
    },
    {
      title: "Walk the four stages in order",
      body:
        "The map is one path in four stages, each standing on the one before. Foundations: make the computer do what you say. Structures: hold data so you can find it again. Techniques: turn the core ideas into real algorithms. Fluency: practice and recall until it is automatic. Skip ahead and a later lesson will lean on something you never built, and it will feel like magic instead of mechanics. Go in order. Every topic sits on the ones below it for a reason.",
    },
  ],

  theWall:
    "One more word on the wall, because it is the part people quit on. The frustration you feel when a derivation will not come is not a sign you are bad at this. It is the work itself, showing up the only way it knows how. Strong learners are not the ones who never hit the wall. They are the ones who learned that the wall is the doorway, and stayed long enough to walk through it.",

  comeBack:
    "Re-derivation is the habit that turns a lesson you understood into a tool you own. Pick a topic you finished, wait until it has gone a little fuzzy, then come back and re-derive it from the bare problem, steps hidden. When you can rebuild it cold, it is yours.",

  links: [
    {
      // TRACK-NARRATIVES bridge rule: name the IDEA, not the topic. This is the
      // canonical "eliminate, don't check" lesson — the clearest place to feel
      // the method working on a real problem.
      href: "/categories/algorithms/binary-search/",
      label: "Try it now: finding anything in a sorted row by halving",
    },
    {
      href: "/learn",
      label: "See the whole map",
    },
  ],
};
