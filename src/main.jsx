import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import App from './App.jsx';
import ErrorBoundary from '@components/ErrorBoundary';
import ScrollToTop from '@components/ScrollToTop';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <ScrollToTop />
          <App />
        </ErrorBoundary>
        <Toaster position="bottom-right" richColors closeButton />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
