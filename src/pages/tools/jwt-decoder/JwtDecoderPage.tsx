import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Clipboard, Eraser, KeyRound, ShieldCheck, ShieldAlert, ShieldQuestion, Sparkles, Clock } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import CodeBlock from '@components/ui/CodeBlock';
import Badge from '@components/ui/Badge';
import Checkbox from '@components/ui/Checkbox';
import { EmptyState, ErrorNotice, Panel } from '@components/workspace';
import {
  CLAIM_DESCRIPTIONS, claimDate, decodeJwt, getTokenStatus, isAsymmetricAlgorithm, isHmacAlgorithm,
  secretBytes, signHmacJwt, verifyJwt, type DecodedJwt,
} from '@lib/jwt-utils';
import { formatDuration, formatRelative } from '@lib/time-utils';

const TIME_CLAIMS = new Set(['exp', 'nbf', 'iat', 'auth_time', 'updated_at']);
const SAMPLE_SECRET = 'devtools-sample-secret';

type VerifyState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'valid' }
  | { kind: 'invalid' }
  | { kind: 'error'; message: string };

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function formatClaimValue(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export default function JwtDecoderPage() {
  const [token, setToken] = useState('');
  const [key, setKey] = useState('');
  const [secretIsBase64, setSecretIsBase64] = useState(false);
  const [verify, setVerify] = useState<VerifyState>({ kind: 'idle' });
  const now = useNow();

  const result = useMemo<{ decoded?: DecodedJwt; error?: string }>(() => {
    if (!token.trim()) return {};
    try {
      return { decoded: decodeJwt(token) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [token]);

  const decoded = result.decoded;
  const alg = decoded?.header.alg;
  const isHmac = isHmacAlgorithm(alg);
  const isAsym = isAsymmetricAlgorithm(alg);
  const status = decoded ? getTokenStatus(decoded.payload, now) : null;

  // Verify automatically whenever the token or key changes.
  useEffect(() => {
    if (!decoded || !key.trim() || !(isHmac || isAsym)) {
      setVerify({ kind: 'idle' });
      return;
    }
    let cancelled = false;
    setVerify({ kind: 'checking' });
    const timer = setTimeout(() => {
      verifyJwt(token, key, secretIsBase64)
        .then((ok) => !cancelled && setVerify({ kind: ok ? 'valid' : 'invalid' }))
        .catch((e) => !cancelled && setVerify({ kind: 'error', message: e instanceof Error ? e.message : String(e) }));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [decoded, token, key, secretIsBase64, isHmac, isAsym]);

  const handlePaste = useCallback(async () => {
    try {
      setToken(await navigator.clipboard.readText());
    } catch {
      toast.error('Unable to paste');
    }
  }, []);

  const handleSample = useCallback(async () => {
    const iat = Math.floor(Date.now() / 1000);
    const sample = await signHmacJwt(
      { sub: '1234567890', name: 'Jane Developer', email: 'jane@example.com', role: 'admin', iat, exp: iat + 3600 },
      secretBytes(SAMPLE_SECRET, false),
    );
    setToken(sample);
    setKey(SAMPLE_SECRET);
    setSecretIsBase64(false);
  }, []);

  const claims = decoded ? Object.entries(decoded.payload) : [];

  return (
    <ToolLayout
      seoTitle="JWT Decoder & Verifier – Decode JSON Web Tokens Online"
      tagline="Decode, inspect and verify JSON Web Tokens, entirely in your browser"
      metaDescription="Decode JWT header and payload, see expiry in human time, and verify HS256/384/512, RS256, PS256 and ES256 signatures with a secret or public key. Nothing leaves your browser."
      about={
        <ul className="grid gap-3 md:grid-cols-3">
          <li><strong className="text-text">Structure.</strong> A JWT is three base64url parts joined by dots: a header (algorithm, type), a payload (claims) and a signature over the first two.</li>
          <li><strong className="text-text">Decoding ≠ trusting.</strong> Anyone can read a JWT; the payload is only encoded, not encrypted. Only a valid signature proves who issued it and that it wasn’t modified.</li>
          <li><strong className="text-text">Private by design.</strong> Decoding and verification run locally with the Web Crypto API. Tokens, secrets and keys are never sent, stored or put in links.</li>
        </ul>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start">
        <div className="space-y-4 min-w-0">
          <Panel
            title={<label htmlFor="jwt-input">Encoded token</label>}
            bodyClassName="p-3"
            actions={
              <>
                <button type="button" onClick={handlePaste} className={action}><Clipboard size={13} aria-hidden="true" /> Paste</button>
                <button type="button" onClick={handleSample} className={action}><Sparkles size={13} aria-hidden="true" /> Sample</button>
                <button type="button" onClick={() => setToken('')} disabled={!token} className={action}><Eraser size={13} aria-hidden="true" /> Clear</button>
              </>
            }
          >
            <textarea
              id="jwt-input"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste a JWT (eyJhbGciOi…). A leading 'Bearer ' is ignored."
              spellCheck={false}
              autoComplete="off"
              className="w-full min-h-40 p-2.5 rounded-md bg-surface-alt border border-border-strong font-mono text-[13px] leading-relaxed text-text break-all resize-y
                placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
            />
            {decoded && (
              <div className="mt-3 p-2.5 rounded-md border border-border bg-surface-alt font-mono text-xs break-all leading-relaxed" aria-label="Token parts">
                <span className="text-rose-600 dark:text-rose-400">{decoded.parts[0]}</span>
                <span className="text-text-muted">.</span>
                <span className="text-violet-600 dark:text-violet-400">{decoded.parts[1]}</span>
                <span className="text-text-muted">.</span>
                <span className="text-sky-700 dark:text-sky-400">{decoded.parts[2] || '(no signature)'}</span>
              </div>
            )}
          </Panel>

          {decoded && (
            <Panel
              title={<span className="inline-flex items-center gap-1.5"><KeyRound size={13} aria-hidden="true" /> Verify signature</span>}
              bodyClassName="p-3 space-y-3"
            >
              {isHmac || isAsym ? (
                <>
                  <textarea
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    aria-label={isHmac ? 'Shared secret' : 'Public key'}
                    placeholder={isHmac ? 'Shared secret used to sign the token' : 'Public key: PEM (-----BEGIN PUBLIC KEY-----) or one JWK object'}
                    spellCheck={false}
                    autoComplete="off"
                    className="w-full min-h-20 p-2.5 rounded-md bg-surface-alt border border-border-strong font-mono text-[13px] text-text resize-y
                      placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {isHmac ? <Checkbox checked={secretIsBase64} onChange={setSecretIsBase64} label="Secret is Base64" className="text-xs" /> : <span />}
                    <span role="status"><VerifyBadge state={verify} /></span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-text-muted">
                  {alg === 'none'
                    ? 'This token is unsigned (alg "none"): anyone can create it, so never trust it.'
                    : `Signature verification for "${String(alg)}" is not supported. Supported: HS256/384/512, RS256/384/512, PS256/384/512, ES256/384/512.`}
                </p>
              )}
            </Panel>
          )}
        </div>

        <div className="space-y-4 min-w-0">
          {!token.trim() && (
            <EmptyState icon={ShieldCheck} title="Paste a token to decode it" className="rounded-lg border border-dashed border-border bg-surface">
              Or load a signed sample to see how verification works.
            </EmptyState>
          )}
          {result.error && <ErrorNotice title="Not a valid JWT">{result.error}</ErrorNotice>}
          {decoded && (
            <>
              <div className="flex flex-wrap items-center gap-2" role="status">
                <Badge tone="primary">alg: {String(alg ?? 'unknown')}</Badge>
                {status?.state === 'expired' && <Badge tone="error"><Clock size={12} aria-hidden="true" /> Expired {formatRelative(status.expiredAt, now)}</Badge>}
                {status?.state === 'not-yet-valid' && <Badge tone="warning"><Clock size={12} aria-hidden="true" /> Not valid until {status.validFrom.toLocaleString()}</Badge>}
                {status?.state === 'valid' && (
                  <Badge tone="success">
                    <Clock size={12} aria-hidden="true" />
                    {status.expiresAt ? `Valid · expires in ${formatDuration(status.expiresAt.getTime() - now)}` : 'Valid · no expiry (exp) set'}
                  </Badge>
                )}
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <CodeBlock title={<span className="text-rose-600 dark:text-rose-400">Header</span>} code={JSON.stringify(decoded.header, null, 2)} preClassName="max-h-96" />
                <CodeBlock title={<span className="text-violet-600 dark:text-violet-400">Payload</span>} code={JSON.stringify(decoded.payload, null, 2)} preClassName="max-h-96" />
              </div>
            </>
          )}
          {claims.length > 0 && (
            <Panel title="Claims" bodyClassName="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-text-muted border-b border-border">
                    <th scope="col" className="px-3 py-2 font-medium">Claim</th>
                    <th scope="col" className="px-3 py-2 font-medium">Value</th>
                    <th scope="col" className="px-3 py-2 font-medium hidden md:table-cell">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map(([name, value]) => {
                    const date = TIME_CLAIMS.has(name) ? claimDate(value) : null;
                    return (
                      <tr key={name} className="border-b border-border last:border-0 align-top">
                        <td className="px-3 py-2 font-mono text-[13px] text-violet-600 dark:text-violet-400 whitespace-nowrap">{name}</td>
                        <td className="px-3 py-2 font-mono text-[13px] text-text break-all">
                          {formatClaimValue(value)}
                          {date && <div className="font-sans text-xs text-text-muted mt-0.5">{date.toLocaleString()} · {formatRelative(date, now)}</div>}
                        </td>
                        <td className="px-3 py-2 text-text-muted hidden md:table-cell">{CLAIM_DESCRIPTIONS[name] ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Panel>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}

const action =
  'inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs text-text-secondary hover:text-text hover:bg-surface-hover transition-colors focus-ring disabled:opacity-40 disabled:pointer-events-none';

function VerifyBadge({ state }: { state: VerifyState }) {
  switch (state.kind) {
    case 'idle':
      return <Badge><ShieldQuestion size={12} aria-hidden="true" /> Enter a key to verify</Badge>;
    case 'checking':
      return <Badge><ShieldQuestion size={12} aria-hidden="true" /> Checking…</Badge>;
    case 'valid':
      return <Badge tone="success"><ShieldCheck size={12} aria-hidden="true" /> Signature verified</Badge>;
    case 'invalid':
      return <Badge tone="error"><ShieldAlert size={12} aria-hidden="true" /> Invalid signature</Badge>;
    case 'error':
      return <Badge tone="error"><ShieldAlert size={12} aria-hidden="true" /> {state.message}</Badge>;
  }
}
