import { Link } from 'react-router-dom';

interface FooterProps {
  variant?: 'compact' | 'full';
  maxWidth?: string;
}

export default function Footer({ variant = 'compact', maxWidth = 'max-w-384' }: FooterProps) {
  const isCompact = variant === 'compact';
  const textSize = isCompact ? 'text-xs' : 'text-sm';
  const py = isCompact ? 'py-1.5' : 'py-6';
  const linkClass = 'px-1.5 py-1 rounded hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus-ring';

  return (
    <footer className={`relative z-10 shrink-0 border-t border-white/40 dark:border-gray-800 ${py}`}>
      <div className={`${maxWidth} mx-auto px-5 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-2`}>
        <p className={`${textSize} text-gray-600 dark:text-gray-400`}>
          &copy; {new Date().getFullYear()} DevTools{!isCompact && '. All tools are free to use.'}
        </p>
        <nav aria-label="Footer" className={`flex items-center gap-1 ${textSize} text-gray-600 dark:text-gray-400`}>
          <Link to="/" className={linkClass}>Home</Link>
          <span aria-hidden="true">|</span>
          <a href="https://github.com/mazidul36i/dev-tools" target="_blank" rel="noopener noreferrer" className={linkClass}>
            GitHub<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </nav>
      </div>
    </footer>
  );
}


