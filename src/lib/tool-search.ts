import type { ToolCategory, ToolDefinition } from '../tools';

type Searchable = Pick<ToolDefinition, 'title' | 'desc' | 'category' | 'keywords'>;

/** Relevance of `tool` for `query` (0 = no match). Every query word must match somewhere. */
export function scoreTool(tool: Searchable, query: string): number {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return 1;
  const title = tool.title.toLowerCase();
  const keywords = (tool.keywords ?? []).join(' ').toLowerCase();
  const rest = `${tool.desc} ${tool.category}`.toLowerCase();
  let score = 0;
  for (const w of words) {
    if (title.startsWith(w) || title.split(/[\s/↔-]+/).some((t) => t.startsWith(w))) score += 10;
    else if (title.includes(w)) score += 6;
    else if (keywords.includes(w)) score += 4;
    else if (rest.includes(w)) score += 1;
    else return 0;
  }
  return score;
}

/** Tools in `category` (or all) matching `query`, best matches first. */
export function filterTools<T extends Searchable>(tools: T[], query: string, category: ToolCategory | 'All'): T[] {
  const inCategory = category === 'All' ? tools : tools.filter((t) => t.category === category);
  if (!query.trim()) return inCategory;
  return inCategory
    .map((t, i) => ({ t, i, s: scoreTool(t, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.t);
}
