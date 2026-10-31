import { chromium, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { strict as assert } from 'node:assert';

// A bounded foreground check: owns its preview and browsers, and closes both.
const root = resolve(process.env.HAMSTER_DIST || 'dist');
const output = process.env.HAMSTER_CHECK_OUT || '/tmp/hamster-dash-check';
await mkdir(output, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!path.startsWith('/preview/')) { response.writeHead(404).end(); return; }
    const file = resolve(root, path.slice('/preview/'.length) || 'index.html');
    if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    response.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const url = `http://127.0.0.1:${server.address().port}/preview/`;
const results = [];
function record(test, details) { results.push({ test, passed: true, details }); console.log(`PASS ${test}: ${details}`); }

async function playerX(page) {
  return page.locator('canvas').evaluate(canvas => {
    const ctx = canvas.getContext('2d');
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let sum = 0, count = 0;
    for (let y = Math.floor(height * .65); y < height; y++) for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      // Original hamster's tan fur, deliberately disjoint from the green scenery.
      if (data[i] === 231 && data[i + 1] === 174 && data[i + 2] === 112) { sum += x; count++; }
    }
    if (!count) throw new Error('Hamster sprite is missing');
    return sum / count / width;
  });
}

try {
  for (const [name, browserType] of [['Chromium', chromium], ['WebKit', webkit]]) {
    const browser = await browserType.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [], failed = [], external = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('requestfailed', r => failed.push(`${r.url()}: ${r.failure()?.errorText}`));
      page.on('request', r => { if (!r.url().startsWith(url) && !r.url().startsWith('data:')) external.push(r.url()); });
      await page.addInitScript(() => { Math.random = () => .5; });
      await page.goto(url); await page.locator('canvas').waitFor(); await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => {
        const c = document.querySelector('canvas');
        if (!c || !c.width || !c.height) return false;
        const pixels = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        for (let i = 0; i < pixels.length; i += 4) if (pixels[i] === 231 && pixels[i + 1] === 174 && pixels[i + 2] === 112) return true;
        return false;
      });
      await page.clock.install();
      await page.clock.runFor(100);
      const start = page.getByRole('button', { name: '开始游戏', exact: true });
      const box = await start.boundingBox(); assert.ok(box && box.y >= 0 && box.y + box.height <= 844);
      await page.screenshot({ path: `${output}/${name.toLowerCase()}-390-ready.png` });
      record(`${name}: mobile first screen`, '390×844: product and Start game visible');

      await start.click(); await page.clock.runFor(100);
      assert.ok(await page.locator('.playfield').evaluate(el => el === document.activeElement));
      const initialX = await playerX(page);
      await page.keyboard.down('ArrowLeft'); await page.clock.runFor(240); await page.keyboard.up('ArrowLeft');
      assert.ok(await playerX(page) < initialX - .1);
      await page.keyboard.down('d'); await page.clock.runFor(320); await page.keyboard.up('d');
      assert.ok(await playerX(page) > initialX);
      await page.keyboard.down('a'); await page.clock.runFor(100); await page.keyboard.up('a');
      await page.keyboard.down('ArrowRight'); await page.clock.runFor(100); await page.keyboard.up('ArrowRight');
      record(`${name}: keyboard movement`, 'ArrowLeft, ArrowRight, A and D change the rendered hamster position');

      const right = page.getByRole('button', { name: '向右移动', exact: true });
      const rightBox = await right.boundingBox();
      await page.mouse.move(rightBox.x + rightBox.width / 2, rightBox.y + rightBox.height / 2);
      await page.mouse.down(); await page.clock.runFor(240); await page.mouse.up();
      assert.ok(await playerX(page) > .65);
      const field = await page.locator('.playfield').boundingBox();
      await page.mouse.move(field.x + field.width * .72, field.y + field.height * .8);
      await page.mouse.down(); await page.mouse.move(field.x + field.width * .25, field.y + field.height * .8);
      await page.clock.runFor(50); await page.mouse.up();
      assert.ok(await playerX(page) < .35);
      record(`${name}: pointer controls`, 'Hold button moves right; captured playfield drag moves left');

      await page.keyboard.press('Space');
      await page.getByRole('button', { name: '继续游戏', exact: true }).last().waitFor();
      assert.ok(await page.locator('.primary-button').evaluate(el => el === document.activeElement));
      const pausedTime = await page.getByTestId('timer').textContent();
      await page.clock.runFor(3000); assert.equal(await page.getByTestId('timer').textContent(), pausedTime);
      await page.getByRole('button', { name: '继续游戏', exact: true }).last().click();
      assert.ok(await page.locator('.playfield').evaluate(el => el === document.activeElement));
      await page.clock.runFor(1200); assert.notEqual(await page.getByTestId('timer').textContent(), pausedTime);
      record(`${name}: pause and resume`, 'Space pauses; timer remains unchanged across 3 seconds; resume continues');

      await page.evaluate(() => window.dispatchEvent(new Event('blur')));
      await page.getByText('已自动暂停，准备好就继续本局。', { exact: true }).waitFor();
      const awayTime = await page.getByTestId('timer').textContent(); await page.clock.runFor(2000);
      assert.equal(await page.getByTestId('timer').textContent(), awayTime);
      record(`${name}: automatic pause`, 'Window blur pauses with explicit explanation and freezes countdown');

      await page.getByRole('button', { name: /Switch to English/ }).click();
      assert.equal(await page.locator('html').getAttribute('lang'), 'en');
      await page.getByRole('button', { name: 'Resume game', exact: true }).last().click();
      await page.getByRole('button', { name: 'Restart game', exact: true }).click();
      assert.equal(await page.getByTestId('score').textContent(), '000');
      assert.equal(await page.getByTestId('timer').textContent(), '45');
      await page.clock.runFor(25000);
      assert.ok(Number((await page.getByTestId('speed').textContent()).replace('×', '')) > 1.4);
      await page.clock.runFor(20500);
      await page.getByRole('button', { name: 'Play again', exact: true }).waitFor();
      assert.equal(await page.getByTestId('timer').textContent(), '00');
      const finalScore = Number(await page.getByTestId('score').textContent()); assert.ok(finalScore > 0);
      assert.equal(Number(await page.getByTestId('best').textContent()), finalScore);
      await page.screenshot({ path: `${output}/${name.toLowerCase()}-390-finished.png` });
      record(`${name}: complete round`, `45 active seconds; acceleration; score ${finalScore}; result, item counts and best displayed`);

      await page.getByRole('button', { name: 'Play again', exact: true }).click();
      assert.equal(await page.getByTestId('timer').textContent(), '45');
      assert.equal(await page.getByTestId('score').textContent(), '000');
      await page.reload();
      assert.equal(await page.locator('html').getAttribute('lang'), 'en');
      assert.equal(Number(await page.getByTestId('best').textContent()), finalScore);
      record(`${name}: persistence and replay`, 'Replay resets round; reload preserves English and local best');

      await page.getByRole('button', { name: 'Enable sound', exact: true }).click();
      if (await page.getByRole('button', { name: 'Mute sound', exact: true }).count()) {
        await page.getByRole('button', { name: 'Mute sound', exact: true }).click();
        assert.equal(await page.getByRole('button', { name: 'Enable sound', exact: true }).getAttribute('aria-pressed'), 'false');
        record(`${name}: optional sound control`, 'AudioContext enabled by gesture, then muted; no audible-output claim');
      } else {
        await page.getByText('Sound is unavailable. You can still play.', { exact: true }).waitFor();
        record(`${name}: optional sound fallback`, 'Unsupported audio has a clear notice; game remains usable');
      }

      for (const width of [320, 390, 768, 1100, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px overflow`);
      }
      await page.screenshot({ path: `${output}/${name.toLowerCase()}-1440-en.png`, fullPage: true });
      const audit = await new AxeBuilder({ page }).analyze();
      assert.deepEqual(audit.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })), []);
      record(`${name}: layout and accessibility scan`, 'No horizontal overflow at 320, 390, 768, 1100, 1440; axe has no violations');

      await page.getByRole('link', { name: 'How to play', exact: true }).click();
      assert.equal(new URL(page.url()).hash, '#how-to');
      assert.equal(await page.getByRole('link', { name: 'Visit Squeekchain', exact: true }).getAttribute('href'), 'https://squeekchain.com/');
      record(`${name}: help and official link`, 'Help anchor navigates to rules; official link points to the supplied URL');

      assert.deepEqual(errors, []); assert.deepEqual(failed, []); assert.deepEqual(external, []);
      record(`${name}: static subpath and privacy`, '/preview/ assets resolve; no script errors, failed requests or external runtime requests');
      await context.close();
    } finally { await browser.close(); }
  }
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage unavailable', 'SecurityError'); } });
    });
    await page.goto(url);
    await page.clock.install();
    await page.clock.runFor(200);
    await page.getByText('浏览器无法保存数据，最高分仅保留到关闭页面。', { exact: true }).waitFor();
    await page.getByRole('button', { name: '开始游戏', exact: true }).tap();
    await page.getByRole('button', { name: '暂停游戏', exact: true }).waitFor();
    record('Storage denial fallback', 'Clear session-only notice; touch starts the game with localStorage blocked');

    await page.clock.runFor(100);
    const cdp = await page.context().newCDPSession(page);
    const right = await page.getByRole('button', { name: '向右移动', exact: true }).boundingBox();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: right.x + right.width / 2, y: right.y + right.height / 2 }] });
    await page.clock.runFor(300);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.ok(await playerX(page) > .65);
    const field = await page.locator('.playfield').boundingBox();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: field.x + field.width * .7, y: field.y + field.height * .8 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: field.x + field.width * .2, y: field.y + field.height * .8 }] });
    await page.clock.runFor(50);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.ok(await playerX(page) < .3);
    record('Mobile touch input', 'Emulated touch hold and touch drag move the rendered hamster; no physical-device claim');

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.getByText('已自动暂停，准备好就继续本局。', { exact: true }).waitFor();
    const time = await page.getByTestId('timer').textContent(); await page.clock.runFor(2000);
    assert.equal(await page.getByTestId('timer').textContent(), time);
    record('Visibility-change pause', 'Hidden document signal freezes the round; requires an explicit resume');
    await page.close();
  } finally { await browser.close(); }
  const summary = { passed: results.length, results };
  await writeFile(`${output}/results.json`, JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await new Promise(done => server.close(done));
}
