import { motion } from 'framer-motion';

export default function Card({ children, className = '', hover = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/60 dark:border-gray-700/60 overflow-hidden mb-3
        ${hover ? 'hover:border-white/80 dark:hover:border-gray-600 hover:shadow-lg hover:bg-white/70 transition-all duration-300' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
}
