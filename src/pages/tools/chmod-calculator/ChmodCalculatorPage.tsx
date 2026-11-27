import { useMemo, useState } from 'react';
import ToolLayout from '@components/layout/ToolLayout';
import CopyButton from '@components/ui/CopyButton';
import Checkbox from '@components/ui/Checkbox';
import { Panel } from '@components/workspace';
import { opt } from '@lib/url-state';
import useUrlOptions from '@hooks/useUrlOptions';
import {
  BITS, WHO, applyChmodExpression, fromOctal, fromSymbolic, toChmodExpression, toOctal, toSymbolic,
  type Bit, type Permissions, type Who,
} from '@lib/chmod-utils';

const WHO_LABEL: Record<Who, string> = { owner: 'Owner (u)', group: 'Group (g)', other: 'Others (o)' };
const BIT_LABEL: Record<Bit, string> = { r: 'Read', w: 'Write', x: 'Execute' };

const PRESETS = [
  { mode: '644', use: 'Regular files' },
  { mode: '755', use: 'Scripts, directories' },
  { mode: '600', use: 'Private files (SSH keys)' },
  { mode: '700', use: 'Private directories' },
  { mode: '664', use: 'Group-editable files' },
  { mode: '775', use: 'Group-shared directories' },
  { mode: '400', use: 'Read-only secrets' },
  { mode: '1777', use: 'Shared /tmp-style dirs' },
];

const fieldClass =
  'w-full h-10 px-2.5 rounded-md bg-surface-alt border border-border-strong font-mono text-lg text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 aria-invalid:border-error';

/** Text input that shows the derived value unless the user is editing it. */
function SyncedInput({ id, label, value, onCommit }: { id: string; label: string; value: string; onCommit: (v: string) => string | null }) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <label htmlFor={id} className="block mb-1.5 text-xs font-medium text-text-secondary">{label}</label>
      <input
        id={id}
        value={draft ?? value}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(onCommit(e.target.value));
        }}
        onBlur={() => { setDraft(null); setError(null); }}
        spellCheck={false}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldClass}
      />
      {error && <p id={`${id}-error`} className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}

const schema = {
  m: opt.str('755', 4),
  path: opt.str('file', 200),
};

export default function ChmodCalculatorPage() {
  const [o, setO] = useUrlOptions(schema);
  const perms = useMemo(() => {
    try {
      return fromOctal(o.m);
    } catch {
      return fromOctal('755');
    }
  }, [o.m]);
  const setPerms = (next: Permissions | ((p: Permissions) => Permissions)) =>
    setO({ m: toOctal(typeof next === 'function' ? next(perms) : next) });
  const [expr, setExpr] = useState('');
  const [exprError, setExprError] = useState<string | null>(null);

  const octal = toOctal(perms);
  const symbolic = toSymbolic(perms);
  const toggle = (who: Who, bit: Bit) => setPerms((p) => ({ ...p, [who]: { ...p[who], [bit]: !p[who][bit] } }));

  const tryParse = (fn: () => Permissions) => {
    try {
      setPerms(fn());
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  };

  const target = o.path || 'file';
  const commands = [`chmod ${octal} ${target}`, `chmod ${toChmodExpression(perms)} ${target}`];

  return (
    <ToolLayout
      seoTitle="Chmod Calculator – Linux File Permissions (Octal & Symbolic)"
      tagline="Work out Unix file permissions in octal (755) and symbolic (rwxr-xr-x) notation"
      metaDescription="Calculate chmod permissions with checkboxes and convert between octal (755, 644, 4755) and symbolic (rwxr-xr-x) notation, including setuid, setgid and sticky bits. Apply chmod expressions like u+x."
      about={
        <ul className="grid gap-3 md:grid-cols-3">
          <li><strong className="text-text">Read, write, execute.</strong> Each digit is a sum: read 4, write 2, execute 1, so 7 = rwx, 6 = rw-, 5 = r-x. The digits are for owner, group and others.</li>
          <li><strong className="text-text">Directories.</strong> r lists contents, w creates and deletes entries, x lets you enter. Directories usually need x wherever they have r.</li>
          <li><strong className="text-text">Special bits.</strong> setuid (4xxx) runs as the owner, setgid (2xxx) as the group or makes new files inherit it, sticky (1xxx) stops users deleting others’ files in shared dirs like /tmp.</li>
        </ul>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-start">
        <Panel title="Permissions" bodyClassName="p-4 space-y-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-text-muted">
                  <th scope="col" className="text-left font-medium py-2"><span className="sr-only">Who</span></th>
                  {BITS.map((b) => <th key={b} scope="col" className="font-medium py-2 px-2">{BIT_LABEL[b]} <span className="font-mono">({b})</span></th>)}
                  <th scope="col" className="font-medium py-2 px-2">Octal</th>
                </tr>
              </thead>
              <tbody>
                {WHO.map((who) => (
                  <tr key={who} className="border-t border-border">
                    <th scope="row" className="py-2.5 pr-3 text-left font-medium text-text whitespace-nowrap">{WHO_LABEL[who]}</th>
                    {BITS.map((b) => (
                      <td key={b} className="text-center px-2">
                        <input
                          type="checkbox"
                          aria-label={`${WHO_LABEL[who]} ${BIT_LABEL[b]}`}
                          checked={perms[who][b]}
                          onChange={() => toggle(who, b)}
                          className="accent-primary w-5 h-5 cursor-pointer"
                        />
                      </td>
                    ))}
                    <td className="text-center font-mono text-lg text-primary">{octal.slice(-3)[WHO.indexOf(who)]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-5" role="group" aria-label="Special bits">
            <Checkbox checked={perms.setuid} onChange={(v) => setPerms((p) => ({ ...p, setuid: v }))} label="setuid (4)" />
            <Checkbox checked={perms.setgid} onChange={(v) => setPerms((p) => ({ ...p, setgid: v }))} label="setgid (2)" />
            <Checkbox checked={perms.sticky} onChange={(v) => setPerms((p) => ({ ...p, sticky: v }))} label="sticky (1)" />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <SyncedInput id="chmod-octal" label="Octal" value={octal} onCommit={(v) => tryParse(() => fromOctal(v))} />
            <SyncedInput id="chmod-symbolic" label="Symbolic" value={symbolic} onCommit={(v) => tryParse(() => fromSymbolic(v))} />
            <div>
              <label htmlFor="chmod-expr" className="block mb-1.5 text-xs font-medium text-text-secondary">Apply expression</label>
              <input
                id="chmod-expr"
                value={expr}
                onChange={(e) => { setExpr(e.target.value); setExprError(null); }}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  try {
                    setPerms((p) => applyChmodExpression(p, expr));
                    setExpr('');
                  } catch (err) {
                    setExprError(err instanceof Error ? err.message : String(err));
                  }
                }}
                placeholder="u+x"
                spellCheck={false}
                aria-invalid={!!exprError}
                aria-describedby="chmod-expr-hint"
                className={fieldClass}
              />
              <p id="chmod-expr-hint" className={`mt-1 text-xs ${exprError ? 'text-error' : 'text-text-muted'}`}>{exprError ?? 'e.g. u+x, go-w, a=r, then Enter'}</p>
            </div>
          </div>
        </Panel>

        <div className="space-y-4 min-w-0">
          <Panel title="Command" bodyClassName="p-4 space-y-2">
            <label htmlFor="chmod-path" className="block text-xs font-medium text-text-secondary">File or directory</label>
            <input id="chmod-path" value={o.path} onChange={(e) => setO({ path: e.target.value })} spellCheck={false} className="w-full h-8 px-2.5 rounded-md bg-surface-alt border border-border-strong font-mono text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25" />
            {commands.map((cmd) => (
              <div key={cmd} className="flex items-center gap-3 px-3 py-2 rounded-md border border-border bg-surface-alt font-mono text-[13px] text-text">
                <span aria-hidden="true" className="text-text-muted select-none">$</span>
                <span className="flex-1 min-w-0 break-all">{cmd}</span>
                <CopyButton text={cmd} label="" size="sm" className="px-2!" />
              </div>
            ))}
          </Panel>

          <Panel title="Common modes" bodyClassName="p-2">
            <ul>
              {PRESETS.map((p) => (
                <li key={p.mode}>
                  <button
                    type="button"
                    onClick={() => setPerms(fromOctal(p.mode))}
                    aria-pressed={octal === p.mode}
                    className={`flex w-full items-center gap-3 h-9 px-2 rounded-md text-left text-sm transition-colors focus-ring ${octal === p.mode ? 'bg-primary-subtle text-text' : 'text-text-secondary hover:bg-surface-hover hover:text-text'}`}
                  >
                    <span className="w-12 font-mono text-text">{p.mode}</span>
                    <span className="flex-1">{p.use}</span>
                    <span className="font-mono text-xs text-text-muted">{toSymbolic(fromOctal(p.mode))}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </ToolLayout>
  );
}
