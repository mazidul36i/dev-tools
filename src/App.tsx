import {Routes, Route} from 'react-router-dom';
import {lazy, Suspense} from 'react';
import Spinner from '@components/ui/Spinner';

const HomePage = lazy(() => import('@pages/HomePage'));
// Tool routes come from the registry in src/tools.ts.
const ToolRoute = lazy(() => import('@pages/ToolRoute'));
const NotFoundPage = lazy(() => import('@pages/NotFoundPage'));

export default function App() {
  return (
    <Suspense fallback={<Spinner/>}>
      <Routes>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/tools/:slug" element={<ToolRoute/>}/>
        <Route path="*" element={<NotFoundPage/>}/>
      </Routes>
    </Suspense>
  );
}
