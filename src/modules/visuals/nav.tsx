// A visual's navigation: the prototype file tree with Visuals' policy on top (ModuleApp.sectionItem). Working files sit
// at the top as in any prototype; iterations/ and exports/ are the visual's standard folders, so they can't be renamed
// or moved; and in iterations/ each version shows its status, the selected one first, rejected ones last.
import type { FileNode } from '#studio/data';
import type { FileTreeContext, FileTreePolicy } from '#studio/ui';
import { cn } from '#studio/runtime';
import { data } from './shared.tsx';
import type { Status, VisualEntry } from './visuals.ts';

const STANDARD = ['iterations', 'exports'];
// Selected first, then the ones still in the running, newest first, then the rejected ones.
const RANK: Record<Status, number> = { selected: 0, shortlisted: 1, exploring: 1, rejected: 2 };

const visualOf = ({ proto, manifest }: FileTreeContext): VisualEntry | undefined =>
  data(manifest)?.visuals.find(v => v.id === proto.id);

const statusOf = (visual: VisualEntry | undefined, path: string) => visual?.versions.find(v => v.path === path)?.status;

function arrange(nodes: FileNode[], context: FileTreeContext): FileNode[] {
  const visual = visualOf(context);
  // Working files keep the prototype's order; the standard folders follow them, iterations/ then exports/.
  const top = [
    ...nodes.filter(n => !STANDARD.includes(n.path)),
    ...STANDARD.flatMap(path => nodes.filter(n => n.path === path)),
  ];
  return top.map(node => {
    if (node.path !== 'iterations' || !node.children) return node;
    const rank = (n: FileNode) => RANK[statusOf(visual, n.path) ?? 'exploring'];
    const children = [...node.children].sort((a, b) => rank(a) - rank(b) || b.name.localeCompare(a.name));
    return { ...node, children };
  });
}

const LABEL: Partial<Record<Status, string>> = { selected: 'Selected', shortlisted: 'Shortlisted', rejected: 'Rejected' };

function badge(item: { path: string }, context: FileTreeContext) {
  const status = statusOf(visualOf(context), item.path);
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

export const visualPolicy = (base: FileTreePolicy): FileTreePolicy => ({
  ...base,
  // The order of iterations/ is its version numbers and statuses, not a hand-made one.
  reorder: false,
  fixed: node => STANDARD.includes(node.path) || (base.fixed?.(node) ?? false),
  movable: node => !STANDARD.includes(node.path) && (base.movable?.(node) ?? true),
  arrange,
  badge,
});
