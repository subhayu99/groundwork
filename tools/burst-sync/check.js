#!/usr/bin/env node
/**
 * BURST-SYNC CHECKER (E1 / L0.11) — the OBJECTIVE half of the audit.
 *
 * Reads a topic's probes.json (from capture.js) and flags, per beat:
 *
 *   A  empty-during-animation   activeCodeLines is [] in a frame while the
 *                               beat's visual is demonstrably animating
 *                               (svg-signature hash changing) and the code
 *                               panel is open. The "line follows the beat"
 *                               promise is broken outright.
 *   B  stuck-line               the SAME set of code lines stays lit across
 *                               > N consecutive visual steps (hash changes).
 *                               The visual moved substantially; the code
 *                               didn't follow.
 *   C  line-outside-file        an active line number < 1 or > the rendered
 *                               file's line count (sync-anchor / probe error).
 *   D  code-panel-closed        (warning) an animating beat was captured with
 *                               the code panel closed — harness or UI failure;
 *                               A/B can't be judged for it.
 *   -  gate-stuck               (warning) capture could not get past a wedge
 *                               gate; later beats have no evidence.
 *
 * Animation detection is objective: a "visual step" = consecutive probe pair
 * with different svg hashes, BOTH past the entry-fade window (FADE_MS) so the
 * beat-mount fade can't masquerade as playback. A beat "is animating" when it
 * has >= MIN_STEPS visual steps.
 *
 * Usage:
 *   node tools/burst-sync/check.js algorithms/binary-search          # resolves under tools/burst-sync/out
 *   node tools/burst-sync/check.js path/to/out/algorithms/binary-search
 *   node tools/burst-sync/check.js path/to/probes.json
 *
 * Env: FADE_MS (default 700) · MIN_STEPS (default 2) · MAX_STUCK (default 3)
 * Emits <topic-dir>/verdict.json + a human summary on stdout.
 * Exit code: 0 pass (warnings allowed) · 1 fail · 2 usage/IO error.
 */
const fs = require("fs");
const path = require("path");

const FADE_MS = parseInt(process.env.FADE_MS || "700", 10);
const MIN_STEPS = parseInt(process.env.MIN_STEPS || "2", 10);
const MAX_STUCK = parseInt(process.env.MAX_STUCK || "3", 10);

/* ── resolve input ───────────────────────────────────────────────────────── */
const arg = process.argv[2];
if (!arg) {
  console.error("Usage: node check.js <category/topic | out-dir | probes.json>");
  process.exit(2);
}
let probesPath = arg;
if (/^[a-z0-9-]+\/[a-z0-9-]+$/.test(arg) && !fs.existsSync(arg)) {
  for (const root of [path.join(process.cwd(), "tools", "burst-sync", "out"), path.join(__dirname, "out")]) {
    const p = path.join(root, arg, "probes.json");
    if (fs.existsSync(p)) { probesPath = p; break; }
  }
}
if (fs.existsSync(probesPath) && fs.statSync(probesPath).isDirectory()) {
  probesPath = path.join(probesPath, "probes.json");
}
if (!fs.existsSync(probesPath)) {
  console.error(`probes.json not found (tried: ${probesPath}) — run capture.js first.`);
  process.exit(2);
}
const data = JSON.parse(fs.readFileSync(probesPath, "utf8"));
const outDir = path.dirname(probesPath);

/* ── per-beat analysis ───────────────────────────────────────────────────── */
const sameLines = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const findings = [];
const beatReports = [];

for (const beat of data.beats || []) {
  const probes = beat.probes || [];
  const label = beat.beatLabel || `beat ${beat.index + 1}`;
  const report = {
    index: beat.index, label, frames: probes.length,
    visualSteps: 0, animating: false, lineSets: 0, findings: [],
  };

  if (beat.gateStuck) {
    const f = { rule: "gate-stuck", severity: "warning", beat: beat.index, label,
      detail: "capture could not satisfy this beat's interaction gate; no evidence beyond this point" };
    findings.push(f); report.findings.push(f); beatReports.push(report);
    continue;
  }
  if (probes.length === 0) { beatReports.push(report); continue; }

  // visual steps: consecutive hash changes past the entry fade
  const stepsAt = [];
  for (let k = 1; k < probes.length; k++) {
    if (probes[k].tMs > FADE_MS && probes[k].svgHash !== probes[k - 1].svgHash) stepsAt.push(k);
  }
  report.visualSteps = stepsAt.length;
  report.animating = stepsAt.length >= MIN_STEPS;
  const sets = [];
  for (const p of probes) if (!sets.some((s) => sameLines(s, p.activeCodeLines))) sets.push(p.activeCodeLines);
  report.lineSets = sets.length;

  // C — line outside the rendered file (checked on every probe)
  for (const p of probes) {
    const total = p.totalCodeLines || 0;
    const bad = p.activeCodeLines.filter((n) => n < 1 || (total > 0 && n > total));
    if (bad.length) {
      const f = { rule: "line-outside-file", severity: "error", beat: beat.index, label,
        frame: p.frame, detail: `active line(s) ${bad.join(",")} outside 1..${total}` };
      findings.push(f); report.findings.push(f);
    }
  }

  if (report.animating) {
    const span = probes.slice(stepsAt[0] - 1, stepsAt[stepsAt.length - 1] + 1); // the animating window
    // D — code panel closed during an animating beat (A/B unjudgeable)
    if (span.every((p) => !p.codeOpen)) {
      const f = { rule: "code-panel-closed", severity: "warning", beat: beat.index, label,
        detail: "visual animated but the code panel was closed for the whole burst" };
      findings.push(f); report.findings.push(f);
    } else {
      // A — empty active lines while the visual is animating
      for (const p of span) {
        if (p.codeOpen && p.activeCodeLines.length === 0) {
          const f = { rule: "empty-during-animation", severity: "error", beat: beat.index, label,
            frame: p.frame, t: p.tMs, detail: "no [data-active-line] while the visual was animating" };
          findings.push(f); report.findings.push(f);
        }
      }
      // B — same line set lit across > MAX_STUCK consecutive visual steps
      let run = 0;
      let prevLines = probes[stepsAt[0] - 1].activeCodeLines;
      for (const k of stepsAt) {
        if (sameLines(probes[k].activeCodeLines, prevLines)) run++;
        else { run = 0; prevLines = probes[k].activeCodeLines; }
        if (run === MAX_STUCK + 1) {
          const f = { rule: "stuck-line", severity: "error", beat: beat.index, label,
            frame: probes[k].frame, t: probes[k].tMs,
            detail: `code lines [${prevLines.join(",")}] unchanged across >${MAX_STUCK} visual steps` };
          findings.push(f); report.findings.push(f);
        }
      }
    }
  }
  beatReports.push(report);
}

/* ── verdict ─────────────────────────────────────────────────────────────── */
const errors = findings.filter((f) => f.severity === "error");
const warnings = findings.filter((f) => f.severity === "warning");
const verdict = {
  topic: data.topic, register: data.register, capturedAt: data.capturedAt,
  checkedAt: new Date().toISOString(),
  thresholds: { FADE_MS, MIN_STEPS, MAX_STUCK },
  verdict: errors.length ? "fail" : "pass",
  errorCount: errors.length, warningCount: warnings.length,
  beats: beatReports, findings,
};
fs.writeFileSync(path.join(outDir, "verdict.json"), JSON.stringify(verdict, null, 1));

/* ── human summary ───────────────────────────────────────────────────────── */
console.log(`\nBURST-SYNC ${data.topic}  (captured ${data.capturedAt}, register=${data.register})`);
console.log("beat  frames  visual-steps  line-sets  status");
for (const r of beatReports) {
  const status = r.findings.length
    ? r.findings.map((f) => f.rule).join(", ")
    : r.animating ? "ok (animated, code tracked)" : "ok (static)";
  console.log(
    `${String(r.index + 1).padStart(3)}   ${String(r.frames).padStart(5)}  ${String(r.visualSteps).padStart(11)}  ${String(r.lineSets).padStart(8)}   ${status}` +
      (r.label ? `   — ${r.label}` : ""),
  );
}
console.log(`\nverdict: ${verdict.verdict.toUpperCase()}  (${errors.length} error(s), ${warnings.length} warning(s))`);
console.log(`→ ${path.join(outDir, "verdict.json")}`);
process.exit(errors.length ? 1 : 0);
