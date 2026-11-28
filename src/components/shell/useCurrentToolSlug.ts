import { useMatch } from 'react-router-dom';
import { tools } from '../../tools';

const known = new Set(tools.map((t) => t.slug));

/** Slug of the tool at the current URL, or null on non-tool pages. */
export function useCurrentToolSlug(): string | null {
  const match = useMatch('/:slug');
  const slug = match?.params.slug;
  return slug && known.has(slug) ? slug : null;
}
