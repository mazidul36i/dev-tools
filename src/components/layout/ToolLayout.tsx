import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { ChevronDown, Link as LinkIcon, Share2, Star } from 'lucide-react';
import { type ReactNode } from 'react';
import { tools, toolPath } from '../../tools';
import { useCurrentTool } from '@hooks/useCurrentTool';
import { useToolPrefs } from '@hooks/useToolPrefs';
import { useShareRegistry } from '@hooks/useShareInput';

interface ToolLayoutProps {
  /** Falls back to the registry title. */
  title?: string;
  /** Optional longer, keyword-rich title for the browser tab / OG tags. Defaults to `title`. */
  seoTitle?: string;
  /** One-line description under the title. Falls back to the registry description. */
  tagline?: string;
  metaDescription?: string;
  /**
   * `page`: centred, max-width, scrolls (forms, calculators, generators).
   * `workspace`: full width and, on large screens, fills the viewport (editors, split panes).
   * `wide`: full width with natural height (long side-by-side results such as diffs).
   */
  variant?: 'page' | 'workspace' | 'wide';
  /** Extra header actions, rendered before the standard ones. */
  actions?: ReactNode;
  /** "About this tool" content, shown in a collapsible section below the tool. */
  about?: ReactNode;
  children: ReactNode;
}

const headerButton =
  'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm text-text-secondary hover:text-text hover:bg-surface-hover transition-colors focus-ring';

/** Frame for a tool page: header with actions, the tool, About, related tools. */
export default function ToolLayout({ title, seoTitle, tagline, metaDescription, variant = 'page', actions, about, children }: ToolLayoutProps) {
  const tool = useCurrentTool();
  const { isFavorite, toggleFavorite } = useToolPrefs();
  const share = useShareRegistry();

  const heading = tool?.title ?? title ?? 'Tool';
  const description = tagline ?? tool?.desc;
  const pageTitle = `${seoTitle || title || heading} | DevTools`;
  const metaDesc = metaDescription ?? tool?.desc;
  const fav = tool ? isFavorite(tool.slug) : false;
  const related = tool ? tools.filter((t) => t.category === tool.category && t.slug !== tool.slug).slice(0, 4) : [];

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(
      () => toast.success('Link copied'),
      () => toast.error('Could not copy the link'),
    );
  };

  const header = (
    <header className="flex items-start justify-between gap-3 mb-4 shrink-0">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {tool && (
          <span className={`grid place-items-center w-9 h-9 rounded-md shrink-0 ${tool.bg}`}>
            <tool.icon size={18} aria-hidden="true" className={tool.color} />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold leading-tight tracking-tight text-text">{heading}</h1>
          {description && <p className="mt-0.5 text-sm text-text-muted max-w-3xl">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1 -mr-1 shrink-0">
        {actions}
        {share && (
          <button type="button" onClick={share} className={headerButton} title="Copy a link that includes your input">
            <Share2 size={15} aria-hidden="true" />
            <span className="hidden sm:inline">Share</span>
            <span className="sr-only sm:hidden">Share link with input</span>
          </button>
        )}
        <button type="button" onClick={copyLink} className={headerButton} title="Copy a link to this tool with the current options">
          <LinkIcon size={15} aria-hidden="true" />
          <span className="hidden sm:inline">Copy link</span>
          <span className="sr-only sm:hidden">Copy link</span>
        </button>
        {tool && (
          <button
            type="button"
            onClick={() => toggleFavorite(tool.slug)}
            aria-pressed={fav}
            aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
            title={fav ? 'Remove from favorites' : 'Add to favorites'}
            className={`${headerButton} px-2`}
          >
            <Star size={16} aria-hidden="true" className={fav ? 'fill-amber-400 text-amber-500' : ''} />
          </button>
        )}
      </div>
    </header>
  );

  const footer = (
    <>
      {about && (
        <details className="group mt-6 rounded-lg border border-border bg-surface">
          <summary className="flex items-center justify-between gap-3 h-11 px-4 rounded-lg text-sm font-medium text-text list-none [&::-webkit-details-marker]:hidden focus-ring">
            About {heading}
            <ChevronDown size={16} aria-hidden="true" className="text-text-muted transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4 pt-1 text-sm leading-relaxed text-text-secondary border-t border-border">{about}</div>
        </details>
      )}
      {related.length > 0 && (
        <section aria-labelledby="related-tools" className="mt-6">
          <h2 id="related-tools" className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            Related tools
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {related.map((t) => (
              <li key={t.slug}>
                <Link
                  to={toolPath(t)}
                  className="flex items-center gap-2.5 h-11 px-3 rounded-md border border-border bg-surface text-sm text-text-secondary hover:text-text hover:border-border-strong hover:bg-surface-hover transition-colors focus-ring"
                >
                  <t.icon size={16} aria-hidden="true" className={`shrink-0 ${t.color}`} />
                  <span className="truncate">{t.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        {metaDesc && <meta name="description" content={metaDesc} />}
        <meta property="og:title" content={pageTitle} />
        {metaDesc && <meta property="og:description" content={metaDesc} />}
      </Helmet>

      {variant === 'workspace' ? (
        <div className="w-full px-4 sm:px-6 pb-8">
          {/* On large screens the header + tool fill the viewport; About/Related sit below the fold. */}
          <div className="flex flex-col pt-5 lg:h-[calc(100dvh-var(--spacing-topbar))] lg:min-h-[34rem]">
            {header}
            <div className="flex flex-col flex-1 min-h-0">{children}</div>
          </div>
          {footer}
        </div>
      ) : (
        <div className={`w-full px-4 sm:px-6 pt-5 pb-10 ${variant === 'wide' ? '' : 'max-w-6xl mx-auto'}`}>
          {header}
          {children}
          {footer}
        </div>
      )}
    </>
  );
}
