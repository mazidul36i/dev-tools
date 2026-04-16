import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-dark-bg text-slate-300 py-8 text-center mt-auto">
      <div className="max-w-6xl mx-auto px-5">
        <p className="text-sm">&copy; {new Date().getFullYear()} DevTools Hub. All tools are free to use.</p>
        <p className="mt-3 text-sm flex items-center justify-center gap-3 flex-wrap">
          <Link to="/" className="text-slate-400 hover:text-slate-200 transition-colors">Home</Link>
          <span className="text-slate-600">|</span>
          <a
            href="https://github.com/mazidul36i/dev-tools"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ExternalLink size={14} />
            GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
