import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { lazy } from 'react';
import AppShell from '@components/shell/AppShell';

const HomePage = lazy(() => import('@pages/HomePage'));
// Tool routes come from the registry in src/tools.ts.
const ToolRoute = lazy(() => import('@pages/ToolRoute'));
const NotFoundPage = lazy(() => import('@pages/NotFoundPage'));

/** Old links used /tools/:slug; send them to /:slug, keeping query and hash. */
function LegacyToolRedirect() {
  const { slug } = useParams();
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: `/${slug}`, search, hash }} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/tools/:slug" element={<LegacyToolRedirect />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/:slug" element={<ToolRoute />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
