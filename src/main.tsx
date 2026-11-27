import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from '@hooks/useTheme';
import App from './App';
import ErrorBoundary from '@components/ErrorBoundary';
import ScrollToTop from '@components/ScrollToTop';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider>
          {/* Honour the OS "reduce motion" setting for every Framer Motion animation. */}
          <MotionConfig reducedMotion="user">
            <ErrorBoundary>
              <ScrollToTop />
              <App />
            </ErrorBoundary>
          </MotionConfig>
          <Toaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
