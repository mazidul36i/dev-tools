import { motion } from 'framer-motion';

export default function Card({ children, className = '', hover = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { boxShadow: '0 10px 25px rgba(0,0,0,0.12)' } : undefined}
      className={`bg-white rounded-xl shadow-md border border-black/5 overflow-hidden mb-8 ${className}`}
    >
      {children}
    </motion.div>
  );
}

