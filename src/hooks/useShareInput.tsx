import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

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
