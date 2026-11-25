// Fitting production CSS into a system's scope (css-fit.js). Run with `pnpm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fitCss, fitSelector, fitTheme, flattenCss } from './css-fit.js';
import { cssProblems } from './css-scope.js';
import { themeInventory } from './tailwind-theme.js';

const themeClass = 'product-theme';
const fit = code => fitCss(code, { file: 'test.css', themeClass }).root.toString();

test('root, html and body rules become the theme boundary', () => {
  assert.equal(fitSelector(':root', themeClass), '.product-theme');
  assert.equal(fitSelector('html', themeClass), '.product-theme');
  assert.equal(fitSelector('body', themeClass), '.product-theme');
  assert.equal(fitSelector('html body', themeClass), '.product-theme');
  assert.equal(fitSelector('body .card', themeClass), '.product-theme .card');
});

test('global dark mode becomes the boundary dark mode', () => {
  const dark = '.product-theme[data-color-mode="dark"]';
  assert.equal(fitSelector('.dark', themeClass), dark);
  assert.equal(fitSelector(':root.dark', themeClass), dark);
  assert.equal(fitSelector('html.dark .card', themeClass), `${dark} .card`);
});

test('other selectors go under the theme class, with sibling selectors wrapped', () => {
  assert.equal(fitSelector('.card', themeClass), '.product-theme .card');
  assert.equal(fitSelector('.a + .b', themeClass), '.product-theme :is(.a + .b)');
  assert.equal(fitSelector('.a ~ .b::after', themeClass), '.product-theme :is(.a ~ .b)::after');
});

test('selectors already in scope are left alone', () => {
  const scoped = '.product-theme .card { color: red; }\n.product-theme[data-color-mode="dark"] .card { color: blue; }';
  const { changed } = fitCss(scoped, { file: 'test.css', themeClass });
  assert.equal(changed, false);
});

test('keyframes are prefixed and renamed where used', () => {
  const out = fit(
    '@keyframes spin { to { transform: rotate(1turn); } }\n.icon { animation: spin 1s linear infinite; }',
  );
  assert.match(out, /@keyframes product-theme-spin/);
  assert.match(out, /animation: product-theme-spin 1s/);
  assert.doesNotMatch(out, /\.product-theme to/);
});

test('a shadcn v4 globals.css passes validation once fitted', () => {
  const shadcn = `@import "tailwindcss";
@import "tw-animate-css";
@custom-variant dark (&:is(.dark *));
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --radius-sm: calc(var(--radius) - 4px);
}
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
}
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
}
@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
}`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'css-fit-'));
  const system = path.join(dir, 'product');
  fs.mkdirSync(path.join(system, 'styles'), { recursive: true });
  fs.writeFileSync(path.join(system, 'styles', 'globals.css'), shadcn);
  fs.writeFileSync(path.join(system, 'styles', 'theme.css'), '@import "./globals.css";\n');
  try {
    const { entry, problems } = fitTheme({ systemDir: system, themeClass });
    assert.deepEqual(problems, []);
    assert.notEqual(entry, path.join(system, 'styles', 'theme.css'));
    assert.deepEqual(cssProblems(fs.readFileSync(entry, 'utf8'), { file: entry, themeClass }), []);
    const { base, modes } = themeInventory(flattenCss(entry), themeClass);
    assert.equal(base.get('--background'), 'oklch(1 0 0)');
    assert.equal(modes.get('--background'), 'oklch(0.145 0 0)');
    assert.doesNotMatch(fs.readFileSync(entry, 'utf8') + flattenCss(entry), /tailwindcss|@custom-variant|@theme/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a package stylesheet is fitted in place of its import, with its assets still reachable', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'css-fit-'));
  const system = path.join(dir, 'product');
  const pkg = path.join(system, 'node_modules', 'brand-kit');
  fs.mkdirSync(path.join(system, 'styles'), { recursive: true });
  fs.mkdirSync(pkg, { recursive: true });
  fs.writeFileSync(
    path.join(pkg, 'package.json'),
    JSON.stringify({ name: 'brand-kit', exports: { './*.css': './*.css' } }),
  );
  fs.writeFileSync(path.join(pkg, 'font.woff2'), '');
  fs.writeFileSync(
    path.join(pkg, 'tokens.css'),
    ":root { --brand: red; }\n.dark { --brand: blue; }\n@font-face { font-family: Brand; src: url('./font.woff2'); }\n.brand { color: var(--brand); }",
  );
  fs.writeFileSync(path.join(system, 'styles', 'theme.css'), '@import "brand-kit/tokens.css";\n');
  try {
    const { entry, problems } = fitTheme({ systemDir: system, themeClass, packageProblem: () => null });
    assert.deepEqual(problems, []);
    const flat = flattenCss(entry);
    assert.match(flat, /\.product-theme \.brand/);
    const font = flat.match(/url\("([^"]+)"\)/)[1];
    assert.ok(fs.existsSync(path.resolve(path.dirname(entry), font)), 'the font url resolves from the fitted copy');
    assert.equal(themeInventory(flat, themeClass).base.get('--brand'), 'red');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('an undeclared package import is reported, not fitted', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'css-fit-'));
  const system = path.join(dir, 'product');
  fs.mkdirSync(path.join(system, 'styles'), { recursive: true });
  fs.writeFileSync(path.join(system, 'styles', 'theme.css'), '@import "other-kit/tokens.css";\n');
  try {
    const { problems } = fitTheme({
      systemDir: system,
      themeClass,
      packageProblem: () => 'other-kit is not declared.',
    });
    assert.match(problems.join('\n'), /other-kit is not declared/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
