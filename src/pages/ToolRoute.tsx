import { lazy, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { tools } from '../tools';
import { CurrentToolContext } from '@hooks/useCurrentTool';
import { useToolPrefs } from '@hooks/useToolPrefs';

const NotFoundPage = lazy(() => import('@pages/NotFoundPage'));

/** Renders the tool for /:slug and records the visit in "Recent". */
export default function ToolRoute() {
  const { slug } = useParams();
  const tool = tools.find((t) => t.slug === slug);
  const { recordVisit } = useToolPrefs();

  useEffect(() => {
    if (tool) recordVisit(tool.slug);
  }, [tool, recordVisit]);

  if (!tool) return <NotFoundPage />;
  const Page = tool.component;
  return (
    <CurrentToolContext.Provider value={tool}>
      <Page />
    </CurrentToolContext.Provider>
  );
}
