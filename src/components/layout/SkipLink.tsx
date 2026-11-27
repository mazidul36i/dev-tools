/** First focusable element on the page: lets keyboard users jump past the header. */
export default function SkipLink({ target = 'main-content' }: { target?: string }) {
  return (
    <a
      href={`#${target}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:px-4 focus:py-2 focus:rounded-lg
        focus:bg-gray-900 focus:text-white dark:focus:bg-white dark:focus:text-gray-900 focus:text-sm focus:font-medium focus:shadow-lg focus-ring"
    >
      Skip to main content
    </a>
  );
}
