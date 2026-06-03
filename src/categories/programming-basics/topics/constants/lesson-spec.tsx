import type { LessonSpec } from "@/shared/lesson/types";
import { Term } from "@/shared/lesson/Term";
import { Box, Cap, VW } from "../../_shared";
import constantsPy from "./algorithm.py";

const BY = 226, BW = 200;
const cx = (VW - BW) / 2;

function Lock({ x, y }: { x: number; y: number }) {
  return (
    <g stroke="var(--accent-ink)" strokeWidth={2} fill="none">
      <rect x={x} y={y + 7} width={16} height={12} rx={2} fill="var(--accent-soft)" />
      <path d={`M ${x + 3} ${y + 7} v-3 a5 5 0 0 1 10 0 v3`} />
    </g>
  );
}

export const constantsLesson: LessonSpec = {
  topicTitle: "constants · a value that won't change",
  layout: "scene",
  canvas: { width: VW, height: 470 },
  codeSource: constantsPy as string,
  beats: [
    {
      id: "need",
      label: "The fixed value",
      actionLabel: "Lock it in",
      takeaway: "Some values should never change — mark them so nobody does.",
      visual: (
        <g>
          <Cap>some values are settings that should never change mid-program</Cap>
          <Box x={cx} y={BY} w={BW} name="MAX_SCORE" value="100" />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The fixed value", title: "A value that stays put.",
        body: <>Some values are <strong>settings</strong> &mdash; the maximum score, the price of a ticket, &pi;. They&rsquo;re used all over, and changing one by accident would be a nasty bug. We want to say &ldquo;this never changes.&rdquo;</>,
      }],
      detail: (
        <>
          <p>A variable can be reassigned any time &mdash; great for a score, dangerous for a setting. A <strong>constant</strong> is just a variable you&rsquo;ve decided to treat as fixed.</p>
        </>
      ),
      codeLabels: ["define"],
    },
    {
      id: "define",
      label: "Name it in CAPS",
      connector: "So how do we signal 'do not change this'?",
      actionLabel: "Use it",
      takeaway: "UPPER_CASE names are the convention for 'don't reassign me'.",
      visual: (
        <g>
          <Cap>MAX_SCORE = 100   ·   the ALL-CAPS name is the signal</Cap>
          <Box x={cx} y={BY} w={BW} name="MAX_SCORE" value="100" active />
          <Lock x={cx + BW - 24} y={BY - 26} />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Name it in CAPS", title: "MAX_SCORE = 100",
        body: <>You make it exactly like a variable, but write the name in <code>UPPER_CASE</code>. That casing is a <Term word="constant">constant</Term> convention &mdash; a message to every reader: <em>this isn&rsquo;t meant to change.</em></>,
      }],
      detail: (
        <>
          <p>Python doesn&rsquo;t have a special &ldquo;const&rdquo; keyword. Instead the whole community agrees: a name in <code>ALL_CAPS</code> is a constant. Tools and teammates read it the same way.</p>
        </>
      ),
      codeLabels: ["define"],
    },
    {
      id: "use",
      label: "Use it anywhere",
      connector: "A constant is read exactly like any other value.",
      actionLabel: "The promise",
      takeaway: "Read a constant by name — change it in ONE place, everywhere updates.",
      visual: (
        <g>
          <Cap>percent = score / MAX_SCORE * 100   →   70</Cap>
          <Box x={150} y={BY} w={170} name="MAX_SCORE" value="100" />
          <Box x={540} y={BY} w={170} name="percent" value="70.0" active tone="good" />
          <line x1={320} y1={BY + 32} x2={540} y2={BY + 32} stroke="var(--accent-line)" strokeWidth={1.5} markerEnd="url(#lesson-arrow)" />
          <text x={430} y={BY + 22} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>score / MAX_SCORE * 100</text>
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Use it anywhere", title: "percent = score / MAX_SCORE * 100",
        body: <>Wherever the limit matters, you write <code>MAX_SCORE</code> instead of a bare <code>100</code>. The code reads like English &mdash; and the meaning of that <code>100</code> is never a mystery.</>,
      }],
      detail: (
        <>
          <p>The real payoff: if the maximum ever <em>does</em> change, you edit <strong>one line</strong> &mdash; <code>MAX_SCORE = 100</code> &mdash; and every calculation that uses it updates at once. Hunting down scattered <code>100</code>s is exactly the bug constants prevent.</p>
        </>
      ),
      codeLabels: ["read"],
    },
    {
      id: "promise",
      label: "A promise, not a lock",
      connector: "One honest caveat about Python.",
      actionLabel: "Done",
      takeaway: "Python won't enforce it — the CAPS name is a promise you keep.",
      visual: (
        <g>
          <Cap>nothing technically stops a reassignment — the CAPS name is a promise</Cap>
          <Box x={cx} y={BY} w={BW} name="MAX_SCORE" value="100" />
          <g>
            <rect x={cx} y={BY + 86} width={BW} height={34} rx={9} fill="color-mix(in oklab, var(--diff-hard) 10%, var(--bg-card))" stroke="var(--diff-hard)" strokeWidth={1.5} strokeDasharray="4 3" />
            <text x={cx + BW / 2} y={BY + 103} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text-muted)", textDecoration: "line-through" }}>MAX_SCORE = 50</text>
            <text x={cx + BW + 14} y={BY + 103} dominantBaseline="central" style={{ fontSize: 18, fill: "var(--diff-hard)" }}>&times;</text>
          </g>
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "A promise, not a lock", title: "Honest about Python.",
        body: <>Python won&rsquo;t actually stop you writing <code>MAX_SCORE = 50</code> later &mdash; it just trusts you not to. The <code>ALL_CAPS</code> name is a promise to your future self and your teammates.</>,
      }],
      detail: (
        <>
          <p>That&rsquo;s the whole idea: a constant is a variable you&rsquo;ve named in <code>CAPS</code> to mark as fixed. Same mechanics as a variable; different intent.</p>
          <p>Some languages enforce it with a keyword (<code>const</code>, <code>final</code>); Python relies on the shared convention.</p>
        </>
      ),
      codeLabels: ["print"],
    },
  ],
};
