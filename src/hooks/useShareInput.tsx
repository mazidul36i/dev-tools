import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { decodeShare, encodeShare, MAX_SHARE_LENGTH, shareTokenFromHash } from '@lib/url-state';

type ShareFn = () => void;

interface ShareRegistry {
  share: ShareFn | null;
  setShare: (fn: ShareFn | null) => void;
}

const ShareContext = createContext<ShareRegistry>({ share: null, setShare: () => {} });

/** Holds the "copy share link" action of the tool on screen, if it has one. */
export function ShareProvider({ children }: { children: ReactNode }) {
  const [share, setShareState] = useState<ShareFn | null>(null);
  // Functions must be wrapped, or React treats them as state updaters.
  const setShare = (fn: ShareFn | null) => setShareState(() => fn);
  return <ShareContext.Provider value={{ share, setShare }}>{children}</ShareContext.Provider>;
}

/** The current tool's share action, or null when it doesn't support sharing. */
export function useShareRegistry(): ShareFn | null {
  return useContext(ShareContext).share;
}

/** Registers `fn` as the share action while the calling component is mounted. */
export function useRegisterShare(fn: ShareFn | null) {
  const { setShare } = useContext(ShareContext);
  useEffect(() => {
    setShare(fn);
    return () => setShare(null);
    // setShare is stable enough for this purpose; re-register when fn changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn]);
}

interface ShareInputOptions {
  /** Turn sharing off (e.g. while the input is empty). Default true. */
  enabled?: boolean;
}

/**
 * Lets the user share their input: registers a "Copy share link" action that
 * puts `fields` (compressed) into the URL hash, and on load applies a shared
 * payload once through `apply`, then removes it from the address bar.
 *
 * Never pass secrets (keys, tokens, passwords) in `fields`.
 */
export function useShareInput(fields: Record<string, string>, apply: (data: Record<string, string>) => void, { enabled = true }: ShareInputOptions = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const fieldsRef = useRef(fields);
  const applyRef = useRef(apply);
  useEffect(() => {
    fieldsRef.current = fields;
    applyRef.current = apply;
  });

  // Apply an incoming payload once.
  useEffect(() => {
    const token = shareTokenFromHash(location.hash);
    if (!token) return;
    let cancelled = false;
    navigate({ pathname: location.pathname, search: location.search, hash: '' }, { replace: true });
    decodeShare(token).then((data) => {
      if (cancelled) return;
      if (data) {
        applyRef.current(data);
        toast.success('Loaded the shared input');
      } else {
        toast.error('This share link is damaged or from a newer version');
      }
    });
    return () => {
      cancelled = true;
    };
    // Only on first load of the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const share = useCallback(async () => {
    const token = await encodeShare(fieldsRef.current);
    if (token.length > MAX_SHARE_LENGTH) {
      toast.error('The input is too large to share in a link. Copy it instead.');
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}#s=${token}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success('Share link copied', { description: 'Anyone with the link will see your input.' }),
      () => toast.error('Could not copy the link'),
    );
  }, []);

  useRegisterShare(enabled ? share : null);
}
