import { motion } from 'framer-motion';

export default function Card({ children, className = '', hover = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`bg-surface rounded-2xl border border-border overflow-hidden mb-6
        ${hover ? 'hover:border-primary/20 hover:shadow-glow transition-all duration-300' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
}
