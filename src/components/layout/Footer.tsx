import { Link } from 'react-router-dom';

interface FooterProps {
  variant?: 'compact' | 'full';
  maxWidth?: string;
}

export default function Footer({ variant = 'compact', maxWidth = 'max-w-384' }: FooterProps) {
  const isCompact = variant === 'compact';
  const textSize = isCompact ? 'text-xs' : 'text-sm';
  const py = isCompact ? 'py-2' : 'py-6';

  return (
    <footer className={`relative z-10 shrink-0 border-t border-white/40 dark:border-gray-800 ${py}`}>
      <div className={`${maxWidth} mx-auto px-5 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-2`}>
        <p className={`${textSize} text-gray-500 dark:text-gray-400`}>
          &copy; {new Date().getFullYear()} DevTools{!isCompact && '. All tools are free to use.'}
        </p>
        <div className={`flex items-center gap-2 ${textSize} text-gray-500 dark:text-gray-400`}>
          <Link to="/" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Home</Link>
          <span>|</span>
          <a href="https://github.com/mazidul36i/dev-tools" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}


