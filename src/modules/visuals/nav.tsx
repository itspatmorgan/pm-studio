// A project's navigation: the prototype file tree with Visuals' policy on top (ModuleApp.sectionItem). The pieces come
// first, in the project's order, each a folder of its versions; the project's own files follow, and exports/ last. A
// piece's folder is declared in meta.json, so it can't be renamed or moved from the tree. In each piece, every version
// shows its status, the selected one first, rejected ones last.
import type { FileNode } from '#studio/data';
import type { FileTreeContext, FileTreePolicy } from '#studio/ui';
import { cn } from '#studio/runtime';
import { data } from './shared.tsx';
import type { Status, VisualEntry } from './visuals.ts';

const EXPORTS = 'exports';
// Selected first, then the ones still in the running, newest first, then the rejected ones.
const RANK: Record<Status, number> = { selected: 0, shortlisted: 1, exploring: 1, rejected: 2 };

const piecesOf = ({ proto, manifest }: FileTreeContext): VisualEntry[] =>
  data(manifest)?.visuals.filter(v => v.project === proto.id) ?? [];

const statusOf = (pieces: VisualEntry[], path: string) =>
  pieces.flatMap(p => p.versions).find(v => v.path === path)?.status;

function arrange(nodes: FileNode[], context: FileTreeContext): FileNode[] {
  const pieces = piecesOf(context);
  const isPiece = (node: FileNode) => pieces.some(p => p.piece === node.path);
  const rank = (n: FileNode) => RANK[statusOf(pieces, n.path) ?? 'exploring'];
  const ordered = pieces.flatMap(p => nodes.filter(n => n.path === p.piece));
  const own = nodes.filter(n => !isPiece(n) && n.path !== EXPORTS);
  return [...ordered, ...own, ...nodes.filter(n => n.path === EXPORTS)].map(node =>
    isPiece(node) && node.children
      ? { ...node, children: [...node.children].sort((a, b) => rank(a) - rank(b) || b.name.localeCompare(a.name)) }
      : node,
  );
}

const LABEL: Partial<Record<Status, string>> = { selected: 'Selected', shortlisted: 'Shortlisted', rejected: 'Rejected' };

function badge(item: { path: string }, context: FileTreeContext) {
  const status = statusOf(piecesOf(context), item.path);
  const label = status && LABEL[status];
  if (!label) return null;
  return (
    <span
      className={cn(
        'ml-auto shrink-0 rounded-full px-1.5 text-[11px] leading-[18px] font-medium',
        status === 'selected' && 'bg-primary/10 text-primary',
        status === 'shortlisted' && 'bg-muted text-foreground',
        status === 'rejected' && 'text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}

// exports/ and each piece's folder (a top-level folder holding versions) stay where they are.
const standard = (node: FileNode) =>
  node.path === EXPORTS || (!node.path.includes('/') && Boolean(node.children?.some(c => VERSION.test(c.name))));
const VERSION = /^v\d{2,}\.tsx$/;

export const visualPolicy = (base: FileTreePolicy): FileTreePolicy => ({
  ...base,
  // The pieces' order is the project's, and a piece's is its version numbers and statuses, not a hand-made one.
  reorder: false,
  fixed: node => standard(node) || (base.fixed?.(node) ?? false),
  movable: node => !standard(node) && (base.movable?.(node) ?? true),
  arrange,
  badge,
});
