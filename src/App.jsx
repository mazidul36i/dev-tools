import {Routes, Route} from 'react-router-dom';
import {lazy, Suspense} from 'react';
import Spinner from './components/ui/Spinner';

const HomePage = lazy(() => import('./pages/HomePage'));
const JsonFormatterPage = lazy(() => import('./pages/tools/json-formatter/JsonFormatterPage'));
const ImageToTextPage = lazy(() => import('./pages/tools/ImageToTextPage'));
const EncoderDecoderPage = lazy(() => import('./pages/tools/EncoderDecoderPage'));
const UrlParserPage = lazy(() => import('./pages/tools/UrlParserPage'));
const ColorPickerPage = lazy(() => import('./pages/tools/color-picker/ColorPickerPage'));
const NetworkStatusPage = lazy(() => import('./pages/tools/network-status/NetworkStatusPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <Suspense fallback={<Spinner/>}>
      <Routes>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/tools/json-formatter" element={<JsonFormatterPage/>}/>
        <Route path="/tools/image-to-text" element={<ImageToTextPage/>}/>
        <Route path="/tools/encoder-decoder" element={<EncoderDecoderPage/>}/>
        <Route path="/tools/url-parser" element={<UrlParserPage/>}/>
        <Route path="/tools/color-picker" element={<ColorPickerPage/>}/>
        <Route path="/tools/network-status" element={<NetworkStatusPage/>}/>
        <Route path="*" element={<NotFoundPage/>}/>
      </Routes>
    </Suspense>
  );
}

