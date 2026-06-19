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
const clearGate = async (page) => {
  const fo = page.locator('foreignObject button');
  if (await fo.count()) { try { await fo.first().click({ timeout: 1200 }); } catch {} }
  const cells = page.locator('[data-canvas-root] rect');
  const n = await cells.count();
  const idxs = [Math.floor(n/2), Math.floor(n/3), Math.floor(2*n/3), 1].filter((v,i,a)=>a.indexOf(v)===i && v>=0 && v<n);
  for (const idx of idxs) { try { await cells.nth(idx).click({ timeout: 700, force: true }); } catch {} }
};
async function cap(browser, vp, tag) {
  const ctx = await browser.newContext({ viewport: vp, colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto(BASE + ROUTE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('svg[role="img"]', { state: 'attached', timeout: 45000 });
  await page.waitForTimeout(1300);
  const total = (await stepNum(page))?.total ?? 1;
  let shots = 0, reached = 0;
  for (let i = 1; i <= total; i++) {
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/beat${i}-${tag}.png` }); shots++; reached = i;
    if (i === total) break;
    let cur = (await stepNum(page))?.cur ?? i;
    for (let a = 0; a < 3 && ((await stepNum(page))?.cur ?? cur) === cur; a++) {
      await clearGate(page); await page.waitForTimeout(300);
      await page.keyboard.press('ArrowRight'); await page.waitForTimeout(750);
    }
    if (((await stepNum(page))?.cur ?? cur) === cur) break; // stuck on a gate
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
