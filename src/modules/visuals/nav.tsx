// A project's navigation: first a row for the project's own page, Selected, which gathers the version picked for each
// piece (VisualPage.tsx), then the prototype file tree with Visuals' policy on top (ModuleApp.sectionItem). The pieces come
// first, in the project's order, one row each: a piece is a folder of versions, and its row opens its lead version (the
// selected one, or the newest) and stays lit on any of them, while the page's film strip shows the versions themselves.
// The project's own files follow, and exports/ last. A piece's folder is declared in meta.json, so it can't be renamed or
// moved from the tree.
import { Link } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { artifactLabel, useManifest, type Artifact, type FileNode, type Prototype } from '#studio/data';
import { navLinkClass, navLinkStyle, type FileTreeContext, type FileTreePolicy } from '#studio/ui';
import { data, projectHref } from './shared.tsx';
import type { VisualEntry } from './visuals.ts';

const EXPORTS = 'exports';

const piecesOf = ({ proto, manifest }: FileTreeContext): VisualEntry[] =>
  data(manifest)?.visuals.filter(v => v.project === proto.id) ?? [];

function arrange(nodes: FileNode[], context: FileTreeContext): FileNode[] {
  const pieces = piecesOf(context);
  const isPiece = (node: FileNode) => pieces.some(p => p.piece === node.path);
  const ordered = pieces.flatMap(p => nodes.filter(n => n.path === p.piece));
  const own = nodes.filter(n => !isPiece(n) && n.path !== EXPORTS);
  return [...ordered, ...own, ...nodes.filter(n => n.path === EXPORTS)];
}

// A piece's row opens its lead version.
function bundleItem(node: FileNode, items: Map<string, Artifact>, context: FileTreeContext) {
  const piece = node.path.includes('/') ? undefined : piecesOf(context).find(p => p.piece === node.path);
  const lead = piece && (piece.selected ?? piece.versions.at(-1));
  return lead ? items.get(lead.path) : undefined;
}

// exports/ and each piece's folder (a top-level folder holding versions) stay where they are.
const standard = (node: FileNode) =>
  node.path === EXPORTS || (!node.path.includes('/') && Boolean(node.children?.some(c => VERSION.test(c.name))));
const VERSION = /^v\d{2,}\.tsx$/;

export const visualPolicy = (base: FileTreePolicy): FileTreePolicy => ({
  ...base,
  // The pieces' order is the project's, not a hand-made one.
  reorder: false,
  heading: 'Pieces',
  fixed: node => standard(node) || (base.fixed?.(node) ?? false),
  movable: node => !standard(node) && (base.movable?.(node) ?? true),
  arrange,
  bundleItem,
  // A piece's row is named for its folder, as on disk.
  bundleLabel: node => artifactLabel(node.name),
});

// The row for the project's page, above its files (ModuleApp.sectionItem.navTop): the selected version of each piece,
// with how many pieces have one. A project of one piece has no such page, so no row.
export function SelectedRow({ proto }: { proto: Prototype; current: Artifact | undefined }) {
  const pieces = piecesOf({ proto, manifest: useManifest() }).filter(p => p.versions.length);
  if (pieces.length < 2) return null;
  const decided = pieces.filter(p => p.selected).length;
  return (
    <div className='px-2 pt-3'>
      <Link
        to={projectHref(proto.id) as never}
        activeOptions={{ exact: true }}
        className={navLinkClass}
        style={navLinkStyle}
      >
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className='shrink-0 text-muted-foreground' />
        <span className='min-w-0 flex-1 truncate'>Selected</span>
        <span className='shrink-0 text-[11px] text-muted-foreground tabular-nums' title={`${decided} of ${pieces.length} pieces have a selected version`}>
          {decided}/{pieces.length}
        </span>
      </Link>
    </div>
  );
}
