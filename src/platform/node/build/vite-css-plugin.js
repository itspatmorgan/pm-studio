import fs from 'node:fs';
import postcss from 'postcss';
import { tailwindThemeProblems, themeInventory, themeAdapter, scopeThemeUtilities } from '../lib/tailwind-theme.js';
import { SYSTEM_SPECS, refreshSystems } from '../../modules/systems/node/systems.js';
import { cssProblems } from '../lib/css-scope.js';
import { scopePolicy } from '../lib/scope.js';
import { systemTheme, fitPackageCss } from '../lib/css-fit.js';
// Fills in the two lists in the app's stylesheet (src/platform/app/styles.css) that depend on what is installed,
// so adding a design system or a module needs no edit to it. CSS can't be given a list at run time, so the stylesheet
// has a marker where each goes and this puts the lines in as the file is read:
//   /* @studio:system-themes */   an @import of each design system's styles/theme.css (in either system root, src/platform/core/roots.ts)
//   /* @studio:data-files */      an @source not for each folder of prototype-shaped folders' meta.json files, which
//                                  Tailwind would otherwise scan for class names and reload the page when they change
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG, PROTOTYPE_DIRS } from '../lib/modules.js';
import { PROTOTYPE_SYSTEMS } from '../../modules/systems/node/systems.js';
import { systemRegistered } from '../../core/config.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const STYLESHEET = path.join(ROOT, 'src', 'platform', 'app', 'styles.css');
const packageProblem = () => scopePolicy({ root: ROOT, systems: PROTOTYPE_SYSTEMS, modules: [] }).packageProblem;
// Where each system's theme loads from: theme.css as written, or its fitted copy (src/platform/node/lib/css-fit.js).
/** A system's theme as Studio uses it: fitted when the system declares cssFitting 'fit', with its tokens flattened. */
export const themeOf = spec =>
  systemTheme({ root: ROOT, spec, packageProblem: spec.role === 'platform' ? undefined : packageProblem() });
export function inventories(deploy = false) {
  return Object.entries(SYSTEM_SPECS)
    .filter(([id, spec]) => systemRegistered(CONFIG, id, spec.role) && (!deploy || spec.status !== 'archived'))
    .map(([id, spec]) => ({
      ...spec,
      inventory: themeInventory(themeOf(spec).tokens, spec.themeClass),
    }));
}

const rel = target => path.relative(path.dirname(STYLESHEET), target).split(path.sep).join('/');

function validateThemes() {
  const problems = Object.keys(SYSTEM_SPECS).flatMap(id => {
    const theme = themeOf(SYSTEM_SPECS[id]);
    const file = theme.file;
    return [
      ...theme.problems,
      ...(SYSTEM_SPECS[id].role === 'platform'
        ? []
        : cssProblems(fs.readFileSync(file, 'utf8'), {
            file,
            themeClass: SYSTEM_SPECS[id].themeClass,
            packagePolicy: packageProblem(),
          })),
      ...tailwindThemeProblems(theme.tokens, { file, ...SYSTEM_SPECS[id] }),
    ];
  });
  if (problems.length) return problems.join('\n');
}

// CSS that a declared system package's own code imports (a component importing its stylesheet) is fitted for every
// system that declares the package and opts in with cssFitting: 'fit'. Other CSS in node_modules is left alone.
function packageNameOf(file) {
  for (let dir = path.dirname(file); dir !== path.dirname(dir); dir = path.dirname(dir)) {
    const manifest = path.join(dir, 'package.json');
    if (!fs.existsSync(manifest)) continue;
    const { name } = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    if (name) return name;
  }
  return null;
}
function fittingClasses(name) {
  return Object.values(PROTOTYPE_SYSTEMS)
    .filter(spec => spec.cssFitting === 'fit' && (!deploy || spec.status !== 'archived'))
    .filter(spec => {
      const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, spec.dir, 'package.json'), 'utf8'));
      return Boolean(manifest.dependencies?.[name]);
    })
    .map(spec => spec.themeClass);
}
function fitImportedPackageCss(code, id) {
  const [file, query] = id.split('?');
  if (!file.endsWith('.css') || file.endsWith('.module.css') || (query && !/^(?:direct|used)(?:&|$)/.test(query)))
    return null;
  if (!file.split(/[\\/]/).includes('node_modules') || file.includes(`${path.sep}.studio-fit${path.sep}`)) return null;
  const name = packageNameOf(file);
  const themeClasses = name ? fittingClasses(name) : [];
  if (!themeClasses.length) return null;
  const fitted = fitPackageCss(code, { file, themeClasses });
  return fitted === code ? null : fitted;
}

let deploy = false;
export default function css() {
  return {
    name: 'studio-css',
    enforce: 'pre',
    configResolved(config) {
      refreshSystems();
      deploy = config.command === 'build';
    },
    handleHotUpdate(ctx) {
      if (ctx.file.endsWith('.css')) {
        const problem = validateThemes();
        if (problem) this.error(problem);
      }
    },
    transform(code, id) {
      const packageCss = fitImportedPackageCss(code, id);
      if (packageCss) return { code: packageCss, map: null };
      if (path.resolve(id.split('?')[0]) !== STYLESHEET) return null;
      const problem = validateThemes();
      if (problem) this.error(problem);
      for (const system of Object.values(SYSTEM_SPECS))
        for (const input of themeOf(system).inputs) this.addWatchFile(input);
      const themes = Object.keys(PROTOTYPE_SYSTEMS)
        .filter(id => !deploy || PROTOTYPE_SYSTEMS[id].status !== 'archived')
        .map(id => `@import "${rel(themeOf(PROTOTYPE_SYSTEMS[id]).file)}";`)
        .join('\n');
      const sources = ['prototypes', ...PROTOTYPE_DIRS.map(dir => path.basename(dir))]
        .map(name => `@source not "${rel(path.join(ROOT, 'src', name))}/**/meta.json";`)
        .join('\n');
      return {
        code: code
          .replace('/* @studio:tailwind-theme */', themeAdapter(inventories(deploy)))
          .replace('/* @studio:system-themes */', themes)
          .replace('/* @studio:data-files */', sources),
        map: null,
      };
    },
  };
}

export function scopedUtilities() {
  return {
    postcssPlugin: 'studio-system-utilities',
    Once(root) {
      let utilities = false;
      root.walkAtRules('layer', layer => {
        if (layer.params === 'utilities' && layer.nodes) utilities = true;
      });
      if (!utilities) return;
      const scoped = postcss.parse(scopeThemeUtilities(root.toString(), inventories(deploy)), {
        from: root.source?.input.file,
      });
      root.removeAll();
      root.append(scoped.nodes);
    },
  };
}
