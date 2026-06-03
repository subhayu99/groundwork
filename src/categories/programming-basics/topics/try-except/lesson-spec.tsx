import type { LessonSpec } from "@/shared/lesson/types";
import { Term } from "@/shared/lesson/Term";
import { Cap, VW } from "../../_shared";
import tryPy from "./algorithm.py";

const TX = 330, TY = 188, TW = 200, TH = 48; // try box

/** path: which route is lit — "none", "ok" (try succeeds), or "err" (jumps to except). */
function Flow({ path }: { path: "none" | "ok" | "err" }) {
  const okOn = path === "ok", errOn = path === "err";
  const okColor = okOn ? "var(--diff-easy)" : "var(--line)";
  const errColor = errOn ? "var(--diff-hard)" : "var(--line)";
  const box = (x: number, y: number, w: number, lines: string[], on: boolean, tone: "good" | "bad") => {
    const stroke = on ? (tone === "good" ? "var(--diff-easy)" : "var(--diff-hard)") : "var(--line)";
    const fill = on ? (tone === "good" ? "color-mix(in oklab, var(--diff-easy) 13%, var(--bg-card))" : "color-mix(in oklab, var(--diff-hard) 13%, var(--bg-card))") : "var(--bg-card)";
    return (
      <g opacity={on || path === "none" ? 1 : 0.45} style={{ transition: "opacity .3s" }}>
        <rect x={x} y={y} width={w} height={lines.length > 1 ? 56 : 40} rx={10} fill={fill} stroke={stroke} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
        {lines.map((l, i) => (
          <text key={i} x={x + w / 2} y={y + (lines.length > 1 ? 20 + i * 20 : 20)} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text)" }}>{l}</text>
        ))}
      </g>
    );
  };
  return (
    <g>
      {/* try box */}
      <rect x={TX} y={TY} width={TW} height={TH} rx={10} fill="var(--bg-card-hi)" stroke="var(--line-strong)" strokeWidth={2} />
      <text x={TX + TW / 2} y={TY + 17} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>try:</text>
      <text x={TX + TW / 2} y={TY + 34} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text)" }}>return a / b</text>

      {/* OK path (left-down) */}
      <line x1={TX + 50} y1={TY + TH} x2={250} y2={320} stroke={okColor} strokeWidth={okOn ? 2 : 1.3} markerEnd="url(#lesson-arrow)" style={{ transition: "stroke .3s" }} />
      <text x={250} y={302} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: okOn ? "var(--diff-easy)" : "var(--text-faint)" }}>no error &darr;</text>
      {box(165, 326, 190, ["it worked", "→ returns 5.0"], okOn, "good")}

      {/* ERROR path (right-down) */}
      <line x1={TX + TW - 50} y1={TY + TH} x2={610} y2={320} stroke={errColor} strokeWidth={errOn ? 2 : 1.3} markerEnd="url(#lesson-arrow)" style={{ transition: "stroke .3s" }} />
      <text x={612} y={302} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: errOn ? "var(--diff-hard)" : "var(--text-faint)" }}>raises error &#9889;</text>
      {box(505, 326, 230, ["except ZeroDivisionError:", "→ returns 0"], errOn, "bad")}
    </g>
  );
}

export const tryExceptLesson: LessonSpec = {
  topicTitle: "try / except · catching errors",
  layout: "scene",
  canvas: { width: VW, height: 470 },
  codeSource: tryPy as string,
  beats: [
    {
      id: "need",
      label: "Code that can fail",
      actionLabel: "Wrap it",
      takeaway: "Some operations can fail at runtime — and an error stops everything.",
      visual: <g><Cap>some lines can fail — and a failure crashes the whole program</Cap><Flow path="none" /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Code that can fail", title: "When a line blows up.",
        body: <>Some operations can fail while running: dividing by zero, opening a missing file, bad input. By default an <Term word="exception">error</Term> like this <strong>crashes</strong> the whole program right there.</>,
      }],
      detail: <><p>These runtime errors are called <strong>exceptions</strong>. <code>10 / 0</code> raises a <code>ZeroDivisionError</code>. We need a way to say &ldquo;try this, but if it fails, do something sensible instead of dying.&rdquo;</p></>,
      codeLabels: ["def"],
    },
    {
      id: "try",
      label: "try — attempt it",
      connector: "So we mark the risky part.",
      actionLabel: "And the safety net",
      takeaway: "Put the risky code in a try block.",
      visual: <g><Cap>wrap the line that might fail inside try:</Cap><Flow path="none" /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "try — attempt it", title: "try:  return a / b",
        body: <>Put the line that might fail inside a <code>try:</code> block. Python will <strong>attempt</strong> it &mdash; and if anything goes wrong, instead of crashing it looks for a matching <code>except</code> to handle it.</>,
      }],
      detail: <><p>On its own, <code>try</code> changes nothing about the happy path. Its power only shows when something inside it actually raises an error.</p></>,
      codeLabels: ["try", "divide"],
    },
    {
      id: "except",
      label: "except — catch it",
      connector: "What happens when it does fail?",
      actionLabel: "The good case",
      takeaway: "except catches a matching error and runs a recovery block instead.",
      visual: <g><Cap>if a matching error is raised, control jumps to except</Cap><Flow path="none" /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "except — catch it", title: "except ZeroDivisionError:",
        body: <>The <code>except</code> block is the safety net. If the <code>try</code> raises that kind of error, Python <strong>jumps</strong> straight to <code>except</code> and runs it &mdash; here, returning <code>0</code> instead of crashing.</>,
      }],
      detail: <><p>You name the error you expect (<code>ZeroDivisionError</code>) so you only catch what you understand. Catching <em>everything</em> blindly hides real bugs &mdash; be specific.</p></>,
      codeLabels: ["except", "handle"],
    },
    {
      id: "ok",
      label: "The happy path",
      connector: "Run it once where nothing goes wrong.",
      actionLabel: "Now break it",
      takeaway: "If the try succeeds, the except block is skipped entirely.",
      visual: <g><Cap>safe_divide(10, 2): 10 / 2 works → returns 5.0, except skipped</Cap><Flow path="ok" /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The happy path", title: "safe_divide(10, 2)  →  5.0",
        body: <>With <code>10</code> and <code>2</code>, <code>10 / 2</code> works fine. The <code>try</code> succeeds, returns <code>5.0</code>, and the <code>except</code> is <strong>skipped completely</strong> &mdash; it only exists for trouble.</>,
      }],
      detail: <><p>So <code>try/except</code> costs nothing when things go right. The safety net just sits there, unused, until it&rsquo;s needed.</p></>,
      codeLabels: ["divide", "ok"],
    },
    {
      id: "err",
      label: "The caught error",
      connector: "Now feed it the input that fails.",
      actionLabel: "Done",
      takeaway: "try/except lets a program survive errors instead of crashing.",
      visual: <g><Cap>safe_divide(10, 0): 10 / 0 raises → jumps to except → returns 0</Cap><Flow path="err" /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The caught error", title: "safe_divide(10, 0)  →  0",
        body: <>With <code>0</code>, <code>10 / 0</code> raises <code>ZeroDivisionError</code>. Instead of crashing, control jumps to <code>except</code>, which returns <code>0</code>. The program <strong>keeps running</strong>.</>,
      }],
      detail: <><p>That&rsquo;s the whole idea: <code>try</code> the risky thing, <code>except</code> catches the failure you anticipated, and your program stays alive and predictable. It&rsquo;s how real software handles the messy world.</p></>,
      codeLabels: ["zero", "handle"],
    },
  ],
};
