import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider, useTheme } from '@hooks/useTheme';
import App from './App';
import ErrorBoundary from '@components/ErrorBoundary';
import { ToolPrefsProvider } from '@hooks/useToolPrefs';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './index.css';

/** Toasts follow the app theme rather than the OS setting. */
function ThemedToaster() {
  const { isDark } = useTheme();
  return <Toaster position="bottom-right" theme={isDark ? 'dark' : 'light'} richColors closeButton />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider>
          {/* Honour the OS "reduce motion" setting for every Framer Motion animation. */}
          <MotionConfig reducedMotion="user">
            <ToolPrefsProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </ToolPrefsProvider>
          </MotionConfig>
          <ThemedToaster />
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
