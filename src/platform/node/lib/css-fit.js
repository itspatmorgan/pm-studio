// Lab feature (pm-studio): fit common production stylesheets into a system's scope at build time, so a team can
// import a package's plain CSS (shadcn's :root and .dark variables, a component package's own stylesheet) instead
// of writing its own scoping script. A system opts in with `cssFitting: 'fit'` in system.ts.
//
// What it does to each stylesheet a system's theme.css reaches through @import, and to CSS a system package's code
// imports for itself:
// - :root, html and body become the theme boundary; .dark, html.dark and :root.dark become its dark mode
// - every other selector is placed under the theme class, and sibling selectors are wrapped in :is(), because the
//   scope check accepts only descendant and child combinators after the theme class
// - keyframes gain the theme class prefix, and their uses are renamed
// - Tailwind lines Studio already supplies (@import "tailwindcss", @custom-variant dark, alias-only @theme inline
//   blocks) are dropped
// Selectors already under the theme class are left alone, so pre-scoped CSS passes through unchanged. Validation
// (css-scope.js) still runs on the result, so anything that can't be fitted safely keeps failing with its message.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import postcss from 'postcss';

// Packages whose CSS Studio's own stylesheet already loads for every system.
const SUPPLIED = new Set(['tailwindcss', 'tw-animate-css', 'shadcn/tailwind.css']);
const KEYFRAMES = /^(?:-webkit-)?keyframes$/i;
const IMPORT = /^(?:["']([^"']+)["']|url\(\s*["']?([^"')\s]+)["']?\s*\))(\s+.*)?$/s;

const boundary = themeClass => ({ theme: `.${themeClass}`, dark: `.${themeClass}[data-color-mode="dark"]` });
const after = (selector, head) =>
  selector === head || (selector.startsWith(head) && /[\s.:[>+~,]/.test(selector[head.length]));

// `.theme .a + .b` selects the same elements as `.theme :is(.a + .b)`, which the scope check accepts.
function wrapSiblings(selector, heads) {
  for (const head of heads) {
    if (!selector.startsWith(head + ' ')) continue;
    let rest = selector.slice(head.length + 1);
    if (!/(^|[^\\(])\s*[+~]\s*(?![^(]*\))/.test(rest)) return selector;
    const pseudo = rest.match(/(::[\w-]+(\([^)]*\))?)$/);
    if (pseudo) rest = rest.slice(0, -pseudo[1].length);
    return `${head} :is(${rest})${pseudo ? pseudo[1] : ''}`;
  }
  return selector;
}

/** One selector, fitted under the theme class. */
export function fitSelector(selector, themeClass) {
  const { theme, dark } = boundary(themeClass);
  const heads = [dark, theme];
  let s = selector.trim();
  if (after(s, theme)) return wrapSiblings(s, heads);
  const darkRoot = /^(?::root|html)?\.dark(?=[\s.:[>+~]|$)|^:is\(html\.dark\)|^:root\[data-color-mode="dark"\]/;
  if (darkRoot.test(s)) {
    s = s.replace(darkRoot, '').trim();
    return s ? wrapSiblings(`${dark} ${s}`, heads) : dark;
  }
  const rootLike = /^(?::root|html|body)(?=[\s.:[>+~]|$)/;
  if (rootLike.test(s)) {
    s = s.replace(rootLike, '').trim();
    if (!s) return theme;
    // `html body`, `:root > body`: both name the boundary.
    s = s.replace(/^(?:>\s*)?body(?=[\s.:[>+~]|$)/, '').trim();
    return s ? wrapSiblings(`${theme} ${s}`, heads) : theme;
  }
  return wrapSiblings(`${theme} ${s}`, heads);
}

const aliasOnly = node =>
  node.nodes?.every(n => n.type === 'comment' || (n.type === 'decl' && /^(?:calc\()?\s*var\(/.test(n.value)));

/** The fitted text of one stylesheet, and whether anything changed. Imports are left to the caller. */
export function fitCss(code, { file, themeClass }) {
  const root = postcss.parse(code, { from: file });
  let changed = false;
  root.walkAtRules(rule => {
    const name = rule.name.toLowerCase();
    if (name === 'custom-variant' && /^dark\b/.test(rule.params)) {
      rule.remove();
      changed = true;
    } else if (name === 'theme' && /\binline\b/.test(rule.params) && aliasOnly(rule)) {
      // Studio generates these aliases from the system's declared tokens.
      rule.remove();
      changed = true;
    }
  });
  const frames = new Map();
  root.walkAtRules(KEYFRAMES, rule => {
    if (rule.params.startsWith(`${themeClass}-`)) return;
    frames.set(rule.params, `${themeClass}-${rule.params}`);
    rule.params = `${themeClass}-${rule.params}`;
    changed = true;
  });
  root.walkRules(rule => {
    // Nested rules sit inside an already fitted parent, and keyframe steps aren't selectors.
    if (rule.parent?.type === 'rule' || (rule.parent?.type === 'atrule' && KEYFRAMES.test(rule.parent.name))) return;
    const selectors = rule.selectors.map(s => fitSelector(s, themeClass));
    if (selectors.join() !== rule.selectors.map(s => s.trim()).join()) {
      rule.selectors = selectors;
      changed = true;
    }
  });
  if (frames.size)
    root.walkDecls(/^(?:-webkit-)?animation(?:-name)?$/, decl => {
      for (const [from, to] of frames)
        decl.value = decl.value.replace(new RegExp(`(^|[\\s,])${from}(?=$|[\\s,])`, 'g'), `$1${to}`);
    });
  return { root, changed };
}

const relative = (from, to) => {
  const rel = path.relative(from, to).split(path.sep).join('/');
  return rel.startsWith('.') ? rel : `./${rel}`;
};

/** The output folder for a system's fitted stylesheets: inside its own node_modules, so packages resolve from it. */
export const fitFolder = systemDir => path.join(systemDir, 'node_modules', '.studio-fit');

/**
 * Fit a system's theme.css and every stylesheet it reaches, writing changed copies into fitFolder(systemDir).
 * Returns the stylesheet to load in place of theme.css (theme.css itself when nothing needed fitting), the files it
 * reached, and problems with what it couldn't read. `packageProblem(source, importer)` checks bare imports in the
 * system's own files against its declared packages, as validation does for theme.css today.
 */
export function fitTheme({ systemDir: dir, themeClass, packageProblem }) {
  const systemDir = path.resolve(dir);
  const out = fitFolder(systemDir);
  const entry = path.join(systemDir, 'styles', 'theme.css');
  const results = new Map();
  const inputs = new Set();
  const problems = [];
  const writes = new Map();
  const own = file => !file.split(path.sep).includes('node_modules');

  function visit(file) {
    if (results.has(file)) return results.get(file);
    results.set(file, file); // a cycle loads the original
    inputs.add(file);
    let fitted;
    try {
      fitted = fitCss(fs.readFileSync(file, 'utf8'), { file, themeClass });
    } catch (error) {
      problems.push(`${file}: cannot fit stylesheet: ${error.message}`);
      return file;
    }
    const { root } = fitted;
    let changed = fitted.changed;
    const imports = [];
    root.walkAtRules('import', rule => {
      const match = rule.params.match(IMPORT);
      const source = match?.[1] ?? match?.[2];
      if (!source || /^(?:https?:|\/\/|data:)/i.test(source)) return; // validation reports these
      if (SUPPLIED.has(source)) {
        rule.remove();
        changed = true;
        return;
      }
      if (own(file) && !source.startsWith('.')) {
        const problem = packageProblem?.(source, file);
        if (problem) {
          problems.push(`${file}: ${problem}`);
          return;
        }
      }
      let target;
      try {
        target = source.startsWith('.')
          ? path.resolve(path.dirname(file), source)
          : createRequire(file).resolve(source);
      } catch {
        problems.push(`${file}: cannot resolve @import "${source}".`);
        return;
      }
      const result = visit(target);
      if (result !== target) changed = true;
      imports.push({ rule, result, rest: match[3] ?? '' });
    });
    if (!changed) return file;
    // The copy lives in another folder: point its imports and relative url()s at their real files.
    for (const { rule, result, rest } of imports) rule.params = `"${relative(out, result)}"${rest}`;
    root.walkDecls(decl => {
      if (!decl.value.includes('url(')) return;
      decl.value = decl.value.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (whole, quote, url) => {
        if (/^(?:data:|#|[a-z][\w+.-]*:|\/)/i.test(url)) return whole;
        return `url("${relative(out, path.resolve(path.dirname(file), url))}")`;
      });
    });
    const name = `${crypto.createHash('sha256').update(file).digest('hex').slice(0, 10)}-${path.basename(file)}`;
    const target = path.join(out, name);
    writes.set(target, `/* Fitted by Studio from ${file}. Generated; edit the source. */\n${root.toString()}`);
    results.set(file, target);
    return target;
  }

  const fitted = visit(entry);
  fs.mkdirSync(out, { recursive: true });
  for (const [file, code] of writes)
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== code) fs.writeFileSync(file, code);
  return { entry: fitted, inputs: [...inputs], problems };
}

/** A stylesheet with its local @imports inlined, in order, for reading the tokens a system declares. */
export function flattenCss(file, seen = new Set()) {
  if (seen.has(file)) return '';
  seen.add(file);
  const root = postcss.parse(fs.readFileSync(file, 'utf8'), { from: file });
  root.walkAtRules('import', rule => {
    if (rule.parent?.type !== 'root') return;
    const match = rule.params.match(IMPORT);
    const source = match?.[1] ?? match?.[2];
    if (!source || /^(?:https?:|\/\/|data:)/i.test(source)) return;
    try {
      const target = source.startsWith('.')
        ? path.resolve(path.dirname(file), source)
        : createRequire(file).resolve(source);
      rule.replaceWith(postcss.parse(flattenCss(target, seen), { from: target }).nodes);
    } catch {
      // Unresolvable imports are reported by validation; they declare no tokens here.
    }
  });
  return root.toString();
}

/** The CSS a system package's code imports, fitted for every system that declares that package and opts in. */
export function fitPackageCss(code, { file, themeClasses }) {
  const parts = themeClasses.map(themeClass => fitCss(code, { file, themeClass }).root.toString());
  return parts.join('\n');
}

/**
 * Where a system's theme loads from, and the CSS its tokens are read from. A system with `cssFitting: 'strict'` loads
 * styles/theme.css as written and declares its tokens there; one with 'fit' loads the fitted copy, and its tokens
 * include those declared in the stylesheets it imports.
 */
export function systemTheme({ root, spec, packageProblem }) {
  const systemDir = path.join(root, spec.dir);
  const original = path.join(systemDir, 'styles', 'theme.css');
  if (spec.cssFitting !== 'fit')
    return { file: original, tokens: fs.readFileSync(original, 'utf8'), inputs: [original], problems: [] };
  const { entry, inputs, problems } = fitTheme({ systemDir, themeClass: spec.themeClass, packageProblem });
  return { file: entry, tokens: flattenCss(entry), inputs, problems };
}
