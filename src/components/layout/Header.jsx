import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Header({ title, tagline, backLink = false }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-primary text-white py-10 text-center shadow-md"
    >
      <div className="max-w-6xl mx-auto px-5">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">{title}</h1>
        {tagline && <p className="text-lg opacity-90 mt-2">{tagline}</p>}
        {backLink && (
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 mt-5 text-white/80 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back to DevTools Hub
          </Link>
        )}
      </div>
    </motion.header>
  );
}

