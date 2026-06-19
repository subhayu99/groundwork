// Visual-capture helper for the focus-layout review gallery.
// Run via the playwright-skill executor:
//   TOPIC_KEY=<key> TOPIC_ROUTE=<route> node run.js <abs path to this file>
// Walks the lesson at desktop + mobile, screenshots each reachable beat
// (best-effort generic gate-clearing) + the open code drawer, into
// docs/capture/img/<key>/. Prints a JSON summary. Review artifact only.
const fs = require('fs');
const { chromium } = require('playwright');
const KEY = process.env.TOPIC_KEY, ROUTE = process.env.TOPIC_ROUTE;
const REPO = '/Users/subhayu/Downloads/first-principles-learning-platform';
const OUT = `${REPO}/docs/capture/img/${KEY}`;
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:3000';

const stepNum = async (page) => {
  try {
    const t = await page.locator('text=/step \\d+\\/\\d+/').first().innerText({ timeout: 2000 });
    const m = t.match(/step (\d+)\/(\d+)/); return m ? { cur: +m[1], total: +m[2] } : null;
  } catch { return null; }
};
const clickDot = async (page, n) => {
  try { await page.getByRole('button', { name: new RegExp('^step ' + n + ' of ') }).first().click({ timeout: 1500 }); return true; }
  catch { return false; }
};
// Best-effort generic gate-clearer. Wedge interactions vary (click a node, a
// cell, a push/pop button, a finger; drag a slider), so we (1) click any
// predict-gate choice buttons, (2) click a dense grid of points across the
// diagram to hit whatever interactive element is there, (3) attempt a drag.
const clearGate = async (page) => {
  const fo = page.locator('foreignObject button');
  const foN = await fo.count();
  for (let i = 0; i < Math.min(foN, 3); i++) { try { await fo.nth(i).click({ timeout: 700 }); } catch {} }
  const svg = page.locator('svg[role="img"]').first();
  let box = null; try { box = await svg.boundingBox(); } catch {}
  if (box) {
    const cols = 5, rows = 4;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      try { await page.mouse.click(box.x + box.width * (c + 0.5) / cols, box.y + box.height * (r + 0.5) / rows); } catch {}
    }
    const my = box.y + box.height * 0.5; // drag across the middle (slider wedges)
    try { await page.mouse.move(box.x + box.width * 0.28, my); await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.62, my, { steps: 10 }); await page.mouse.up(); } catch {}
  }
};
async function cap(browser, vp, tag) {
  const ctx = await browser.newContext({ viewport: vp, colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto(BASE + ROUTE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('svg[role="img"]', { state: 'attached', timeout: 45000 });
  await page.waitForTimeout(1300);
  const total = (await stepNum(page))?.total ?? 1;
  let shots = 0, reached = 0;
  // Jump to each beat via the progress dots, always FROM beat 1 (the setup beat
  // is never a wedge, so gated=false there and a forward jump to any beat is
  // allowed). This bypasses every wedge gate without performing the (topic-
  // specific) interaction, and works identically on desktop and mobile.
  for (let t = 1; t <= total; t++) {
    await clickDot(page, 1); await page.waitForTimeout(350);
    if (t !== 1) await clickDot(page, t);
    await page.waitForTimeout(850);
    await page.screenshot({ path: `${OUT}/beat${t}-${tag}.png` }); shots++; reached = t;
  }
  if (tag === 'd') {
    try {
      await page.getByRole('button', { name: 'code', exact: true }).click({ timeout: 1500 });
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${OUT}/drawer-code-${tag}.png` });
    } catch {}
  }
  await ctx.close();
  return { shots, reached, total };
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  const d = await cap(browser, { width: 1440, height: 900 }, 'd');
  const m = await cap(browser, { width: 390, height: 844 }, 'm');
  console.log(JSON.stringify({ key: KEY, desktop: d, mobile: m }));
  await browser.close();
})();
