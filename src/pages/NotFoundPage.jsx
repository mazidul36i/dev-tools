import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Home } from 'lucide-react';
import { motion } from 'framer-motion';
import Footer from '../components/layout/Footer';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet><title>404 - Page Not Found | DevTools Hub</title></Helmet>
      <main className="flex-1 flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <h1 className="text-7xl font-bold text-primary mb-4">404</h1>
          <p className="text-xl text-slate-500 mb-8">Page not found</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-hover transition-colors"
          >
            <Home size={18} />
            Back to Home
          </Link>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}

