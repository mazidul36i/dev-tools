import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { ThemeProvider, useTheme } from '@hooks/useTheme';
import App from './App';
import ErrorBoundary from '@components/ErrorBoundary';
import ScrollToTop from '@components/ScrollToTop';
import './index.css';

function ThemedToaster() {
  const { isDark } = useTheme();
  return <Toaster position="bottom-right" richColors closeButton theme={isDark ? 'dark' : 'light'} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider>
          <ErrorBoundary>
            <ScrollToTop />
            <App />
          </ErrorBoundary>
          <ThemedToaster />
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
