#!/usr/bin/env node
/**
 * BURST-SYNC CAPTURE (E1 / L0.11) — frame-by-frame left↔right sync evidence.
 *
 * For one topic, steps through every beat, opens the code panel once (sticky),
 * and on each beat captures a BURST of paired probes — a viewport screenshot
 * plus a DOM probe ({ activeCodeLines, beat identity, a serialized svg
 * text/attr snapshot + hash }) — every ~BURST_MS for ~BURST_S seconds. Output
 * goes to <out>/<category>/<topic>/{probes.json, frames/*.jpg}. The OBJECTIVE
 * judgment lives in check.js; this script only collects evidence.
 *
 * RUN (via the playwright skill executor — playwright is not a repo dep):
 *   cd <repo>
 *   node /Users/subhayu/.claude/plugins/cache/playwright-skill/playwright-skill/4.1.0/skills/playwright-skill/run.js \
 *     tools/burst-sync/capture.js algorithms/binary-search
 *
 * The executor chdirs into the skill dir and re-requires this file from a temp
 * copy, so NEVER rely on __dirname/cwd here: output resolves from $OUT, else
 * $PWD (the shell dir you launched from — run from the repo root).
 *
 * ENV knobs (all optional):
 *   BASE      app origin                          default http://localhost:3000
 *   TOPIC     category/topic (or pass as an arg)  e.g. algorithms/binary-search
 *   OUT       output root                          default $PWD/tools/burst-sync/out
 *   BURST_MS  probe cadence in ms                  default 250
 *   BURST_S   burst length per beat in seconds     default 6
 *   SETTLE_MS wait after arriving on a beat        default 700 (entry-fade)
 *   REGISTER  intuitive|structured|rigorous|none   default structured
 *             (injects a learner profile so first-visit chrome never blocks;
 *              "none" = raw first-visit state)
 *   FULL      "1" = full burst even on static beats (default: short-circuit
 *             a beat after ~2.5s if its svg hash never changed)
 *   HEADFUL   "1" = headed browser (debugging)
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

/* ── config ──────────────────────────────────────────────────────────────── */
const BASE = (process.env.BASE || "http://localhost:3000").replace(/\/$/, "");
const argTopic = process.argv.slice(2).find((a) => /^[a-z0-9-]+\/[a-z0-9-]+$/.test(a));
const TOPIC = process.env.TOPIC || argTopic;
if (!TOPIC) {
  console.error("Usage: node run.js capture.js <category>/<topic>   (or TOPIC env)");
  process.exit(1);
}
const [CATEGORY, SLUG] = TOPIC.split("/");
const OUT_ROOT = process.env.OUT || path.join(process.env.PWD || process.cwd(), "tools", "burst-sync", "out");
const OUT_DIR = path.join(OUT_ROOT, CATEGORY, SLUG);
const FRAMES_DIR = path.join(OUT_DIR, "frames");
const BURST_MS = Math.max(80, parseInt(process.env.BURST_MS || "250", 10));
const BURST_TOTAL = Math.round(parseFloat(process.env.BURST_S || "6") * 1000);
const SETTLE_MS = parseInt(process.env.SETTLE_MS || "700", 10);
const REGISTER = process.env.REGISTER || "structured";
const FULL = process.env.FULL === "1";
const STATIC_CUTOFF_MS = 2500; // short-circuit point for visually static beats
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── in-page probe: code lines + beat identity + svg state signature ─────── */
const probeFn = () => {
  const vis = (el) => !!el && el.getClientRects().length > 0;
  // active code lines — CodeHighlight marks each highlighted row with
  // [data-active-line]; the row's 1-based line number is its index in the <pre>.
  const rows = [...document.querySelectorAll("[data-active-line]")].filter(vis);
  const activeCodeLines = rows
    .map((el) => (el.parentElement ? [...el.parentElement.children].indexOf(el) + 1 : -1))
    .filter((n) => n > 0);
  const pre = [...document.querySelectorAll("pre")]
    .filter(vis)
    .find((p) => p.querySelector(":scope > div > span"));
  const totalCodeLines = pre ? pre.querySelectorAll(":scope > div").length : 0;
  // beat identity — the lesson's sr-only live region: "Step k of N: LABEL"
  const live =
    [...document.querySelectorAll('[aria-live="polite"]')]
      .map((e) => e.textContent || "")
      .find((t) => /^Step \d+ of \d+/.test(t)) || "";
  const m = live.match(/^Step (\d+) of (\d+)(?::\s*([^.]*))?/);
  // gate cue text appears (both layouts) only while a wedge gate is unsatisfied
  const gateActive = (document.body.textContent || "").toLowerCase().includes("on the canvas");
  // serialize the visible hero svg: tag + geometry/paint attrs + text content.
  const svg = [...document.querySelectorAll('svg[role="img"]')].filter(vis)[0];
  let sig = "";
  if (svg) {
    const ATTRS = ["x", "y", "cx", "cy", "r", "rx", "width", "height", "d", "points",
      "x1", "y1", "x2", "y2", "transform", "fill", "stroke", "stroke-width", "opacity", "fill-opacity"];
    const parts = [];
    svg.querySelectorAll("*").forEach((el) => {
      const t = el.tagName.toLowerCase();
      if (t === "defs" || el.closest("defs")) return;
      let s = t;
      for (const a of ATTRS) {
        const v = el.getAttribute(a);
        if (v != null) s += `|${a}=${v}`;
      }
      const so = el.style && el.style.opacity;
      if (so !== "" && so != null) s += `|so=${Number(so).toFixed(2)}`;
      if (t === "text" || t === "tspan") s += `|txt=${(el.textContent || "").trim()}`;
      parts.push(s);
    });
    sig = parts.join("\n");
  }
  let h = 5381;
  for (let i = 0; i < sig.length; i++) h = ((h << 5) + h + sig.charCodeAt(i)) | 0;
  return {
    step: m ? Number(m[1]) : null,
    stepsTotal: m ? Number(m[2]) : null,
    beatLabel: m && m[3] ? m[3].trim() : "",
    activeCodeLines,
    totalCodeLines,
    codeOpen: totalCodeLines > 0,
    gateActive,
    svgHash: h,
    svgSig: sig.length > 40000 ? sig.slice(0, 40000) + `…[+${sig.length - 40000}]` : sig,
  };
};

(async () => {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: !process.env.HEADFUL });
  const context = await browser.newContext({ viewport: { width: 1680, height: 950 } });

  // Inject a learner profile (schema-v2 ProgressState) so first-visit chrome
  // (onboarding invites / register defaults) never blocks the automation.
  if (REGISTER !== "none") {
    const state = {
      version: 2,
      lastUpdated: new Date().toISOString(),
      categories: {},
      audience: { experience: "knows-dsa", register: REGISTER, goal: "understand", updatedAt: Date.now() },
      settings: { theme: "dark", animationSpeed: "normal", codeLanguage: "python", reduceMotion: "system" },
    };
    await context.addInitScript((s) => localStorage.setItem("fp-progress-v1", s), JSON.stringify(state));
  }

  const page = await context.newPage();
  const url = `${BASE}/categories/${CATEGORY}/${SLUG}/`;
  console.log(`→ ${url}  (register=${REGISTER}, burst ${BURST_MS}ms × ${BURST_TOTAL / 1000}s)`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  const dots = page.locator('nav[aria-label="lesson steps"] li button');
  await dots.first().waitFor({ timeout: 30000 }); // lesson engine mounted
  const beatCount = await dots.count();

  // Open the code panel ONCE — the engine makes a manual toggle sticky across beats.
  const showCode = page.locator('button[aria-label="show code"]');
  if (await showCode.count()) await showCode.first().click();
  await page.waitForTimeout(400);

  /** Satisfy a wedge gate by clicking canvas [role="button"] targets (cells
   *  first, reset/replay-style controls last) until the gate cue clears. */
  const satisfyGate = async () => {
    const targets = page.locator('[data-canvas-root] [role="button"]');
    const n = Math.min(await targets.count(), 12);
    const cells = [];
    const controls = []; // reset/replay-style — try only if no cell satisfies the gate
    for (let k = 0; k < n; k++) {
      const al = ((await targets.nth(k).getAttribute("aria-label")) || "").toLowerCase();
      (/(reset|replay)/.test(al) ? controls : cells).push(k);
    }
    for (const k of [...cells, ...controls]) {
      const t = targets.nth(k);
      if (!(await t.isVisible().catch(() => false))) continue;
      await t.click({ force: true }).catch(() => {});
      await page.waitForTimeout(250);
      if (!(await page.evaluate(() => (document.body.textContent || "").toLowerCase().includes("on the canvas")))) return true;
    }
    return false;
  };

  const meta = {
    base: BASE, topic: TOPIC, register: REGISTER, capturedAt: new Date().toISOString(),
    burstMs: BURST_MS, burstTotalMs: BURST_TOTAL, settleMs: SETTLE_MS,
    viewport: { width: 1680, height: 950 }, beatCount, beats: [],
  };
  let frames = 0;

  for (let i = 0; i < beatCount; i++) {
    // Navigate by step dot (deterministic; both layouts render the dot nav).
    const dot = dots.nth(i);
    if (await dot.isDisabled().catch(() => false)) {
      // scene layout disables forward dots while the current beat is gated
      const ok = await satisfyGate();
      if (!ok && (await dot.isDisabled().catch(() => false))) {
        console.warn(`  ! beat ${i + 1}: gate could not be satisfied — capture stops here`);
        meta.beats.push({ index: i, gateStuck: true, probes: [] });
        break;
      }
    }
    await dot.click();
    await page
      .waitForFunction(
        (want) =>
          [...document.querySelectorAll('[aria-live="polite"]')].some((e) =>
            new RegExp(`^Step ${want} of `).test(e.textContent || "")),
        i + 1,
        { timeout: 5000 },
      )
      .catch(() => {});
    await sleep(SETTLE_MS); // let the entry fade finish before probing

    const beat = { index: i, probes: [], static: false };
    const t0 = Date.now();
    let k = 0;
    let firstHash = null;
    let hashChanged = false;
    while (Date.now() - t0 < BURST_TOTAL) {
      const probe = await page.evaluate(probeFn);
      probe.tMs = Date.now() - t0;
      const frame = `b${String(i + 1).padStart(2, "0")}-f${String(k).padStart(2, "0")}.jpg`;
      await page.screenshot({ path: path.join(FRAMES_DIR, frame), type: "jpeg", quality: 55 });
      probe.frame = `frames/${frame}`;
      beat.probes.push(probe);
      frames++;
      if (firstHash === null) firstHash = probe.svgHash;
      else if (probe.svgHash !== firstHash) hashChanged = true;
      // visually static so far? stop early (unless FULL=1)
      if (!FULL && !hashChanged && probe.tMs > STATIC_CUTOFF_MS) {
        beat.static = true;
        break;
      }
      k++;
      const next = t0 + k * BURST_MS;
      await sleep(Math.max(0, next - Date.now()));
    }
    const last = beat.probes[beat.probes.length - 1] || {};
    beat.beatLabel = last.beatLabel || "";
    beat.step = last.step ?? i + 1;
    console.log(
      `  beat ${i + 1}/${beatCount} "${beat.beatLabel}": ${beat.probes.length} probes` +
        (beat.static ? " (static, short-circuited)" : ""),
    );
    meta.beats.push(beat);
  }

  meta.framesWritten = frames;
  fs.writeFileSync(path.join(OUT_DIR, "probes.json"), JSON.stringify(meta, null, 1));
  console.log(`✓ wrote ${frames} frames + probes.json → ${OUT_DIR}`);
  await browser.close();
})().catch((err) => {
  console.error("capture failed:", err);
  process.exit(1);
});
