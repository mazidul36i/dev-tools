import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-text-muted">&copy; {new Date().getFullYear()} DevTools. Free & open source.</p>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-text-muted hover:text-text transition-colors">Home</Link>
          <a
            href="https://github.com/mazidul36i/dev-tools"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-text-muted hover:text-text transition-colors"
          >
            <ExternalLink size={13} />
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
