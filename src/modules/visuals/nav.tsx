// A project's navigation, under the heading Pieces. First All pieces, the project's own page (VisualPage.tsx), then the
// pieces in the project's order, one row each: a piece is a folder of versions, and its row opens its lead version (the
// selected one, or the newest) and stays lit on any of them, while the page's versions panel shows the versions
// themselves. The project's own files follow, and exports/ last. A piece's folder is declared in meta.json, so it can't
// be renamed or moved from the tree. This is the prototype file tree with Visuals' policy (ModuleApp.sectionItem).
import { Link } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { GridViewIcon } from '@hugeicons/core-free-icons';
import { artifactLabel, type Artifact, type FileNode } from '#studio/data';
import { navLinkClass, navLinkStyle, type FileTreeContext, type FileTreePolicy } from '#studio/ui';
import { StatusGlyph, data, projectHref, versionName } from './shared.tsx';
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

// A piece's row ends with whether it's decided: a quiet picked glyph, or the open one, which stands out, while no
// version is picked.
function badge(item: Artifact, context: FileTreeContext) {
  const piece = piecesOf(context).find(p => p.versions.some(v => v.path === item.path));
  if (!piece) return null;
  const label = piece.selected ? `Picked ${versionName(piece.selected)}` : 'No pick yet';
  return (
    <span title={label} aria-label={label} className='ml-auto flex shrink-0 items-center pl-1'>
      <StatusGlyph status={piece.selected ? 'selected' : 'exploring'} size={11} className={piece.selected ? 'opacity-50' : undefined} />
    </span>
  );
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
  Leading: AllPieces,
  fixed: node => standard(node) || (base.fixed?.(node) ?? false),
  movable: node => !standard(node) && (base.movable?.(node) ?? true),
  arrange,
  bundleItem,
  badge,
  // A piece's row is named for its folder, as on disk.
  bundleLabel: node => artifactLabel(node.name),
});

// The list's first row, All pieces (FileTreePolicy.Leading): the project's own page, a contact sheet of every piece at
// its pick. A project of one piece has no such page, so no row.
function AllPieces(context: FileTreeContext) {
  const pieces = piecesOf(context).filter(p => p.versions.length);
  if (pieces.length < 2) return null;
  const open = pieces.filter(p => !p.selected).length;
  return (
    <Link
      to={projectHref(context.proto.id) as never}
      activeOptions={{ exact: true }}
      className={navLinkClass}
      style={navLinkStyle}
    >
      <HugeiconsIcon icon={GridViewIcon} size={14} className='shrink-0 text-muted-foreground' />
      <span className='min-w-0 flex-1 truncate'>All pieces</span>
      {open > 0 && (
        <span className='shrink-0 text-[11px] text-muted-foreground tabular-nums' title={`${open} without a pick`}>
          {open} open
        </span>
      )}
    </Link>
  );
}
