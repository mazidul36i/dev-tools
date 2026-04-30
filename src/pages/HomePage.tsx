import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Eye, Star, FileJson2, Image, RefreshCw, Link2, Palette, Wifi, Fingerprint, type LucideIcon } from 'lucide-react';
import heroGearImg from '@assets/img/hero-gear.png';
import BackgroundBlobs from '@components/ui/BackgroundBlobs';
import ThemeToggleButton from '@components/ui/ThemeToggleButton';
import Footer from '@components/layout/Footer';

interface Tool {
  path: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  title: string;
  desc: string;
}

const tools: Tool[] = [
  { path: '/tools/json-formatter', icon: FileJson2, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30', title: 'JSON Formatter', desc: 'Format, validate and beautify JSON data with a modern interface' },
  { path: '/tools/image-to-text', icon: Image, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', title: 'Image to Text Convert', desc: 'Extract text from images using OCR technology. Supports multiple formats with drag & drop, paste, or upload.' },
  { path: '/tools/encoder-decoder', icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', title: 'Encoder/Decoder', desc: 'Convert data between various encoding formats including Base64, URL, HTML, and Hex' },
  { path: '/tools/url-parser', icon: Link2, color: 'text-violet-500', bg: 'bg-violet-100 dark:bg-violet-900/30', title: 'URL Parser', desc: 'Encode and decode URLs with a modern interface. Handle complex URLs with special characters safely.' },
  { path: '/tools/color-picker', icon: Palette, color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-900/30', title: 'Color Picker', desc: 'Pick colors and convert between formats (HEX, RGB, HSL) with live preview' },
  { path: '/tools/network-status', icon: Wifi, color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30', title: 'Network Status', desc: 'Monitor your network connection status in real-time with visual indicators and connection quality metrics' },
  { path: '/tools/uuid-generator', icon: Fingerprint, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', title: 'UUID Generator', desc: 'Generate universally unique identifiers (v4 random & v1-like time-based) with customizable formatting options' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.07, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function HomePage() {
  const scrollToTools = () => {
    document.getElementById('tools-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-[#f5f0ed] dark:bg-gray-950">
      <BackgroundBlobs />

      <Helmet>
        <title>DevTools - Developer Utilities</title>
        <meta name="description" content="A collection of free, browser-based web development tools" />
      </Helmet>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 bg-white/60 dark:bg-gray-900/80 backdrop-blur-2xl rounded-2xl border border-white/40 dark:border-gray-700/60 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg text-gray-900 dark:text-white">
            DevTools
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {['PACKAGES', 'TOOLS', 'BLOG', 'ABOUT'].map((item) => (
              <button
                key={item}
                onClick={item === 'TOOLS' ? scrollToTools : undefined}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggleButton />
            <button className="px-5 py-2 text-sm font-medium rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
              CONTACT US
            </button>
          </div>
        </div>
      </motion.header>

      <main className="flex-1 relative z-10 pt-24">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] text-gray-900 dark:text-white">
                  DEVTOOLS
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg mt-6 max-w-md leading-relaxed">
                  Your essential toolkit for web development tasks, combining modern aesthetics with professional utility.
                </p>
                <button
                  onClick={scrollToTools}
                  className="mt-8 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-lg"
                >
                  <Eye size={16} />
                  EXPLORE TOOLS
                </button>

                {/* Stats */}
                <div className="mt-10 flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/70 dark:bg-gray-800/70 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">10k+</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">Developers<br/>Supported</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xl font-bold text-gray-900 dark:text-white">4.7</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">from 4,500+ reviews</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <Star size={14} className="text-green-600 fill-green-600" />
                      <span className="font-bold text-green-700 dark:text-green-400 text-sm">Trustpilot</span>
                    </div>
                    <div className="flex gap-0.5 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-5 h-5 bg-green-500 rounded-sm flex items-center justify-center">
                          <Star size={10} className="text-white fill-white" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Right - Decorative Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="hidden lg:flex justify-center items-center"
              >
                <div className="relative w-full max-w-md">
                  <img
                    src={heroGearImg}
                    alt="DevTools Hub"
                    className="w-full h-auto drop-shadow-2xl"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Tools Grid */}
        <section id="tools-section" className="pb-20 md:pb-32">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-900 dark:text-white mb-8"
            >
              Available Tools
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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
                    className="group flex flex-col p-5 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/60 dark:border-gray-700/60
                               hover:border-white/80 dark:hover:border-gray-600 hover:shadow-lg hover:bg-white/70
                               transition-all duration-300 h-full"
                  >
                    <div className={`w-10 h-10 rounded-xl ${tool.bg} flex items-center justify-center mb-4`}>
                      <tool.icon size={20} className={tool.color} />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug">
                      {tool.title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 leading-relaxed">{tool.desc}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer variant="full" maxWidth="max-w-7xl" />
    </div>
  );
}
