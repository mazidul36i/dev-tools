import { Helmet } from 'react-helmet-async';
import Header from './Header';
import Footer from './Footer';
import { motion } from 'framer-motion';

export default function ToolLayout({ title, tagline, metaDescription, children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>{title} | DevTools Hub</title>
        {metaDescription && <meta name="description" content={metaDescription} />}
        <meta property="og:title" content={`${title} | DevTools Hub`} />
        {metaDescription && <meta property="og:description" content={metaDescription} />}
      </Helmet>
      <Header title={title} tagline={tagline} backLink />
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="flex-1 py-10"
      >
        <div className="max-w-6xl mx-auto px-5">{children}</div>
      </motion.main>
      <Footer />
    </div>
  );
}

