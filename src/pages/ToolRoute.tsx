import { lazy } from 'react';
import { useParams } from 'react-router-dom';
import { tools } from '../tools';

const NotFoundPage = lazy(() => import('@pages/NotFoundPage'));

/**
 * Renders the tool for /:slug. Lazy-loaded from App so the registry
 * (and its icons) stays out of the initial bundle.
 */
export default function ToolRoute() {
  const { slug } = useParams();
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) return <NotFoundPage />;
  const Page = tool.component;
  return <Page />;
}
