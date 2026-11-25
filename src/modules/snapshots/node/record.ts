// Records each piece's snapshot clip: a short muted loop of the piece being used, with a pointer, and its first
// frame as a poster, written to public/snapshots/<id>.mp4 and .jpg. Run it against a running studio:
//
//   pnpm build && pnpm preview          (in one terminal)
//   node src/modules/snapshots/node/record.ts [--url http://localhost:4173] [--only <id>]
//
// It needs ffmpeg on the PATH. Each scene below drives one piece; add one when you feature a new piece.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, type Locator, type Page } from 'playwright';
import { SNAPSHOTS } from '../snapshots.ts';

type Scene = {
  /** The element the clip is cropped to. */
  target: (page: Page) => Locator;
  /** Waits until the piece is settled, before the clip starts. */
  ready?: (page: Page) => Promise<void>;
  /** What the pointer does. The clip starts when this starts. */
  play: (page: Page, pointer: Pointer) => Promise<void>;
};

const args = process.argv.slice(2);
const option = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const BASE = option('url') ?? 'http://localhost:4173';
const ONLY = option('only');
const VIEWPORT = { width: 1600, height: 1000 };
const CLIP_WIDTH = 960; // pixels wide in the encoded clip; keeps each file well under the asset limit

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const center = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`Nothing to point at: ${locator}`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

const POINTER_SVG =
  '<svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 2l15 8.5-6.5 1.5L8.5 18z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';

// A visible pointer, since recordings don't show the real one. It glides between points with an ease.
class Pointer {
  x = 0;
  y = 0;
  page: Page;
  constructor(page: Page) {
    this.page = page;
  }
  async show(x: number, y: number) {
    this.x = x;
    this.y = y;
    // A script string, since this file runs in Node: the page has a document, this module doesn't.
    await this.page.evaluate(`{
      const dot = Object.assign(window.document.createElement('div'), { id: 'snapshots-pointer' });
      dot.innerHTML = ${JSON.stringify(POINTER_SVG)};
      Object.assign(dot.style, { position: 'fixed', left: '0', top: '0', zIndex: '2147483647', pointerEvents: 'none' });
      window.document.body.append(dot);
    }`);
    await this.place();
    await this.page.mouse.move(x, y);
  }
  place() {
    return this.page.evaluate(
      `window.document.getElementById('snapshots-pointer').style.transform = 'translate(${this.x - 3}px, ${this.y - 2}px)'`,
    );
  }
  async to({ x, y }: { x: number; y: number }, ms = 700) {
    const steps = Math.max(8, Math.round(ms / 16));
    const [fromX, fromY] = [this.x, this.y];
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      this.x = fromX + (x - fromX) * e;
      this.y = fromY + (y - fromY) * e;
      await this.page.mouse.move(this.x, this.y);
      await this.place();
    }
  }
  async click(at: { x: number; y: number }, ms?: number) {
    await this.to(at, ms);
    await this.page.mouse.down();
    await wait(90);
    await this.page.mouse.up();
  }
}

const example = (page: Page, label: string) =>
  page.getByText(label, { exact: true }).first().locator('xpath=following-sibling::*[1]');

const SCENES: Record<string, Scene> = {
  'pattern-engine': {
    target: page => page.locator('iframe').first(),
    async play(page, pointer) {
      const view = page.frameLocator('iframe').first();
      const pick = async (label: string) => {
        await pointer.click(await center(view.getByLabel('Generator selector')));
        await wait(350);
        await pointer.click(await center(view.getByRole('option', { name: label })), 500);
        await wait(1600);
      };
      await wait(900);
      await pick('Flow field');
      const seed = await center(view.getByTitle('New seed'));
      await pointer.click(seed);
      await wait(1300);
      await pointer.click(seed, 250);
      await wait(1300);
      await pick('Voronoi');
    },
  },
  'pixel-mark': {
    target: page => example(page, 'Interaction states'),
    async play(page, pointer) {
      const box = example(page, 'Interaction states');
      const card = (label: string) => box.getByText(label, { exact: true }).locator('xpath=preceding-sibling::*[1]');
      await wait(500);
      for (const label of ['Scale', 'Lift', 'Accent']) {
        await pointer.to(await center(card(label)));
        await wait(900);
      }
      await pointer.click(await center(card('Roll').getByRole('button', { name: 'Play' })));
      await wait(1400);
      await pointer.click(await center(card('Entrance').getByRole('button', { name: 'Play' })));
      await wait(1200);
    },
  },
  'pixel-wave': {
    target: page => example(page, 'Split flap entrance'),
    async ready(page) {
      const button = example(page, 'Split flap entrance').getByRole('button', { name: 'Play' });
      await button.waitFor();
      await page.waitForFunction(el => !(el as HTMLButtonElement).disabled, await button.elementHandle(), { timeout: 15000 });
      await wait(500);
    },
    async play(page, pointer) {
      const box = example(page, 'Split flap entrance');
      await wait(600);
      await pointer.click(await center(box.getByRole('button', { name: 'Play' })));
      await wait(4800);
      const text = await box.locator('p').first().boundingBox();
      if (!text) throw new Error('No pixel wave text to hover');
      await pointer.to({ x: text.x + text.width * 0.15, y: text.y + text.height * 0.3 }, 600);
      await pointer.to({ x: text.x + text.width * 0.85, y: text.y + text.height * 0.3 }, 1600);
      await pointer.to({ x: text.x + text.width * 0.2, y: text.y + text.height * 0.75 }, 1400);
      await wait(600);
    },
  },
};

async function launch() {
  try {
    return await chromium.launch();
  } catch {
    return await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); // cloud containers
  }
}

async function record({ id, href, clip: snapshot }: (typeof SNAPSHOTS)[number], scene: Scene) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapshots-'));
  const browser = await launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    colorScheme: 'light',
    recordVideo: { dir, size: VIEWPORT },
  });
  const opened = Date.now();
  const page = await context.newPage();
  await page.goto(new URL(href, BASE).toString(), { waitUntil: 'networkidle' });
  const target = scene.target(page);
  await target.scrollIntoViewIfNeeded();
  await wait(1500);
  const box = await target.boundingBox();
  if (!box) throw new Error(`${id}: the target isn't on screen`);
  await scene.ready?.(page);
  const pointer = new Pointer(page);
  await pointer.show(box.x + box.width * 0.8, box.y + box.height * 0.85);
  const start = (Date.now() - opened) / 1000;
  await scene.play(page, pointer);
  const length = (Date.now() - opened) / 1000 - start;
  const video = page.video();
  await context.close();
  await browser.close();
  const raw = await video!.path();

  const even = (n: number) => Math.floor(n / 2) * 2;
  const crop = `crop=${even(box.width)}:${even(box.height)}:${Math.round(box.x)}:${Math.round(box.y)},scale=${CLIP_WIDTH}:-2`;
  const clip = path.resolve('public', `.${snapshot.video}`);
  const poster = path.resolve('public', `.${snapshot.poster}`);
  fs.mkdirSync(path.dirname(clip), { recursive: true });
  const ffmpeg = (...a: string[]) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);
  ffmpeg('-ss', start.toFixed(2), '-t', length.toFixed(2), '-i', raw, '-vf', crop, '-an', '-c:v', 'libx264', '-crf', '30',
    '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', clip);
  ffmpeg('-i', clip, '-frames:v', '1', '-q:v', '4', poster);
  fs.rmSync(dir, { recursive: true, force: true });
  const kb = (file: string) => Math.round(fs.statSync(file).size / 1024);
  console.log(`${id}: ${length.toFixed(1)}s, ${kb(clip)} KB clip, ${kb(poster)} KB poster`);
}

for (const entry of SNAPSHOTS) {
  if (ONLY && entry.id !== ONLY) continue;
  const scene = SCENES[entry.id];
  if (!scene) {
    console.warn(`${entry.id}: no scene in node/record.ts, so its snapshot wasn't recorded.`);
    continue;
  }
  await record(entry, scene);
}
