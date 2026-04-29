import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Home, SearchX } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet><title>404 - Page Not Found | DevTools</title></Helmet>
      <Header />
      <main className="flex-1 flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <SearchX size={28} className="text-primary" />
          </div>
          <h1 className="text-6xl font-bold gradient-text mb-2">404</h1>
          <p className="text-lg text-text-muted mb-8">This page doesn't exist</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-linear-to-r from-primary to-accent text-white px-5 py-2.5 rounded-lg font-medium
              hover:opacity-90 transition-all duration-200 active:scale-[0.97]"
          >
            <Home size={16} />
            Back to Home
          </Link>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
