import {Routes, Route} from 'react-router-dom';
import {lazy, Suspense} from 'react';
import Spinner from '@components/ui/Spinner';
import {tools, toolPath} from './tools';

const HomePage = lazy(() => import('@pages/HomePage'));
const NotFoundPage = lazy(() => import('@pages/NotFoundPage'));

export default function App() {
  return (
    <Suspense fallback={<Spinner/>}>
      <Routes>
        <Route path="/" element={<HomePage/>}/>
        {tools.map(({slug, component: Page}) => (
          <Route key={slug} path={toolPath({slug})} element={<Page/>}/>
        ))}
        <Route path="*" element={<NotFoundPage/>}/>
      </Routes>
    </Suspense>
  );
}
