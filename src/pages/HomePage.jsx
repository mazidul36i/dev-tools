import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';
import {
  FileJson2, Image, RefreshCw, Link2, Palette, Wifi,
} from 'lucide-react';

const tools = [
  { path: '/tools/json-formatter', icon: FileJson2, title: 'JSON Formatter', desc: 'Format, validate and beautify JSON data with a modern interface' },
  { path: '/tools/image-to-text', icon: Image, title: 'Image to Text Converter', desc: 'Extract text from images using OCR technology. Supports multiple formats with drag & drop, paste, or upload.' },
  { path: '/tools/encoder-decoder', icon: RefreshCw, title: 'Encoder/Decoder', desc: 'Convert data between various encoding formats including Base64, URL, HTML, and Hex' },
  { path: '/tools/url-parser', icon: Link2, title: 'URL Parser', desc: 'Encode and decode URLs with a modern interface. Handle complex URLs with special characters safely.' },
  { path: '/tools/color-picker', icon: Palette, title: 'Color Picker', desc: 'Pick colors and convert between formats (HEX, RGB, HSL) with live preview' },
  { path: '/tools/network-status', icon: Wifi, title: 'Network Status Monitor', desc: 'Monitor your network connection status in real-time with visual indicators and connection quality metrics' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>DevTools Hub - Web Developer Utilities</title>
        <meta name="description" content="A collection of useful web development tools" />
      </Helmet>

      <Header title="DevTools Hub" tagline="Your essential toolkit for web development tasks" />

      <main className="flex-1 py-10">
        <div className="max-w-6xl mx-auto px-5">
          {/* Intro */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-14"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">Web Developer Utilities</h2>
            <p className="text-slate-500 text-lg leading-relaxed">
              Welcome to DevTools Hub, a collection of free, browser-based tools designed to streamline your web development workflow. No downloads or installations required — just the tools you need, when you need them.
            </p>
          </motion.section>

          {/* Tool Grid */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-2 border-b border-slate-200 pb-3">Available Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 mt-8">
              {tools.map((tool, i) => (
                <motion.div
                  key={tool.path}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                >
                  <Link
                    to={tool.path}
                    className="group block p-7 bg-white rounded-xl shadow-md border border-black/5
                               hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
                  >
                    <tool.icon className="w-10 h-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-primary text-xl font-semibold mb-3">{tool.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{tool.desc}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

