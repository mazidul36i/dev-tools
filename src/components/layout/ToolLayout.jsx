import { Helmet } from 'react-helmet-async';
import Header from './Header';
import Footer from './Footer';
import { motion } from 'framer-motion';

export default function ToolLayout({ title, tagline, metaDescription, children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>{title} | DevTools</title>
        {metaDescription && <meta name="description" content={metaDescription} />}
        <meta property="og:title" content={`${title} | DevTools`} />
        {metaDescription && <meta property="og:description" content={metaDescription} />}
      </Helmet>
      <Header title={title} tagline={tagline} backLink />
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="flex-1 py-8"
      >
        <div className="max-w-7xl mx-auto px-5">
          {/* Page title area */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-text">{title}</h1>
            {tagline && <p className="text-text-muted mt-1.5 text-sm md:text-base">{tagline}</p>}
          </div>
          {children}
        </div>
      </motion.main>
      <Footer />
    </div>
  );
}
