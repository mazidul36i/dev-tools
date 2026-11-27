import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Clipboard, Eraser, KeyRound, ShieldCheck, ShieldAlert, ShieldQuestion, Sparkles, Clock, AlertCircle } from 'lucide-react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import InfoCard from '@components/ui/InfoCard';
import CodeBlock from '@components/ui/CodeBlock';
import Badge from '@components/ui/Badge';
import Checkbox from '@components/ui/Checkbox';
import { SmallButton } from '@components/ui/Button';
import { TextAreaInput } from '@components/ui/TextArea';
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
      title="JWT Decoder"
      seoTitle="JWT Decoder & Verifier – Decode JSON Web Tokens Online"
      tagline="Decode, inspect and verify JSON Web Tokens — entirely in your browser"
      metaDescription="Decode JWT header and payload, see expiry in human time, and verify HS256/384/512, RS256, PS256 and ES256 signatures with a secret or public key. Nothing leaves your browser."
    >
      <Card hover={false}>
        <div className="p-6 space-y-5">
          <div>
            <label htmlFor="jwt-input" className="block text-sm font-medium text-text-secondary mb-2">Encoded token:</label>
            <TextAreaInput
              id="jwt-input"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste a JWT (eyJhbGciOi...) — a leading 'Bearer ' is ignored"
              spellCheck={false}
              className="min-h-28!"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <SmallButton onClick={() => setToken('')}><Eraser size={12} /> Clear</SmallButton>
              <SmallButton onClick={handlePaste}><Clipboard size={12} /> Paste</SmallButton>
              <SmallButton onClick={handleSample}><Sparkles size={12} /> Load sample</SmallButton>
            </div>
          </div>

          {result.error && (
            <div className="flex items-start gap-2 p-3.5 rounded-lg border border-error/30 bg-error/5 text-error text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {result.error}
            </div>
          )}

          {decoded && (
            <>
              {/* Colour-coded token */}
              <div className="p-3.5 rounded-lg border border-border bg-surface-alt font-mono text-xs break-all leading-relaxed">
                <span className="text-rose-500">{decoded.parts[0]}</span>
                <span className="text-text-muted">.</span>
                <span className="text-violet-500">{decoded.parts[1]}</span>
                <span className="text-text-muted">.</span>
                <span className="text-sky-500">{decoded.parts[2] || '(no signature)'}</span>
              </div>

              {/* Status */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="primary">alg: {String(alg ?? 'unknown')}</Badge>
                {status?.state === 'expired' && (
                  <Badge tone="error"><Clock size={12} /> Expired {formatRelative(status.expiredAt, now)}</Badge>
                )}
                {status?.state === 'not-yet-valid' && (
                  <Badge tone="warning"><Clock size={12} /> Not valid until {status.validFrom.toLocaleString()}</Badge>
                )}
                {status?.state === 'valid' && (
                  <Badge tone="success">
                    <Clock size={12} />
                    {status.expiresAt
                      ? `Valid · expires in ${formatDuration(status.expiresAt.getTime() - now)}`
                      : 'Valid · no expiry (exp) set'}
                  </Badge>
                )}
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <CodeBlock
                  title={<span className="text-rose-500">Header</span>}
                  code={JSON.stringify(decoded.header, null, 2)}
                  preClassName="max-h-96"
                />
                <CodeBlock
                  title={<span className="text-violet-500">Payload</span>}
                  code={JSON.stringify(decoded.payload, null, 2)}
                  preClassName="max-h-96"
                />
              </div>
            </>
          )}
        </div>
      </Card>

      {decoded && (
        <Card hover={false}>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound size={16} className="text-sky-500" />
              <h2 className="font-semibold text-text">Verify signature</h2>
            </div>
            {isHmac || isAsym ? (
              <>
                <TextAreaInput
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder={isHmac
                    ? 'Enter the shared secret used to sign the token'
                    : 'Paste the public key: PEM (-----BEGIN PUBLIC KEY-----) or a single JWK object'}
                  spellCheck={false}
                  className="min-h-20!"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {isHmac ? (
                    <Checkbox checked={secretIsBase64} onChange={setSecretIsBase64} label="Secret is base64 encoded" />
                  ) : <span />}
                  <VerifyBadge state={verify} />
                </div>
              </>
            ) : (
              <p className="text-sm text-text-muted">
                {alg === 'none'
                  ? 'This token is unsigned (alg "none") — anyone can create it, so never trust it.'
                  : `Signature verification for "${String(alg)}" is not supported. Supported: HS256/384/512, RS256/384/512, PS256/384/512, ES256/384/512.`}
              </p>
            )}
          </div>
        </Card>
      )}

      {claims.length > 0 && (
        <Card hover={false}>
          <div className="p-6">
            <h2 className="font-semibold text-text mb-4">Claims</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-muted border-b border-border">
                    <th className="py-2 pr-4 font-medium">Claim</th>
                    <th className="py-2 pr-4 font-medium">Value</th>
                    <th className="py-2 font-medium hidden md:table-cell">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map(([name, value]) => {
                    const date = TIME_CLAIMS.has(name) ? claimDate(value) : null;
                    return (
                      <tr key={name} className="border-b border-border last:border-0 align-top">
                        <td className="py-2 pr-4 font-mono text-violet-500 whitespace-nowrap">{name}</td>
                        <td className="py-2 pr-4 font-mono text-text-secondary break-all">
                          {formatClaimValue(value)}
                          {date && (
                            <div className="font-sans text-xs text-text-muted mt-0.5">
                              {date.toLocaleString()} · {formatRelative(date, now)}
                            </div>
                          )}
                        </td>
                        <td className="py-2 text-text-muted hidden md:table-cell">{CLAIM_DESCRIPTIONS[name] ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      <InfoCard title="About JSON Web Tokens">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { t: 'Structure', d: 'A JWT is three base64url parts joined by dots: a header (algorithm, type), a payload (claims) and a signature over the first two.' },
            { t: 'Decoding ≠ trusting', d: 'Anyone can read a JWT — the payload is only encoded, not encrypted. Only a valid signature proves the token was issued by the key holder and not modified.' },
            { t: 'Private by design', d: 'Decoding and verification happen locally with the Web Crypto API. Tokens, secrets and keys are never sent anywhere or stored.' },
          ].map(({ t, d }) => (
            <div key={t} className="bg-surface-alt rounded-lg p-5 border border-border">
              <h3 className="font-medium text-text-secondary mb-2">{t}</h3>
              <p className="text-sm text-text-muted">{d}</p>
            </div>
          ))}
        </div>
      </InfoCard>
    </ToolLayout>
  );
}

function VerifyBadge({ state }: { state: VerifyState }) {
  switch (state.kind) {
    case 'idle':
      return <Badge><ShieldQuestion size={12} /> Enter a key to verify</Badge>;
    case 'checking':
      return <Badge><ShieldQuestion size={12} /> Checking…</Badge>;
    case 'valid':
      return <Badge tone="success"><ShieldCheck size={12} /> Signature verified</Badge>;
    case 'invalid':
      return <Badge tone="error"><ShieldAlert size={12} /> Invalid signature</Badge>;
    case 'error':
      return <Badge tone="error"><ShieldAlert size={12} /> {state.message}</Badge>;
  }
}
