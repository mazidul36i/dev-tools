import { useState } from 'react';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import InfoCard from '@components/ui/InfoCard';
import CopyButton from '@components/ui/CopyButton';
import Checkbox from '@components/ui/Checkbox';
import { SecondaryButton } from '@components/ui/Button';
import { Field, TextInput } from '@components/ui/Input';
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

/** Text input that shows the derived value unless the user is editing it. */
function SyncedInput({ id, value, onCommit, placeholder }: { id: string; value: string; onCommit: (v: string) => string | null; placeholder?: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <TextInput
        id={id}
        value={draft ?? value}
        placeholder={placeholder}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(onCommit(e.target.value));
        }}
        onBlur={() => { setDraft(null); setError(null); }}
        spellCheck={false}
        className={`font-mono text-lg! ${error ? 'border-error/60!' : ''}`}
      />
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </>
  );
}

export default function ChmodCalculatorPage() {
  const [perms, setPerms] = useState<Permissions>(() => fromOctal('755'));
  const [expr, setExpr] = useState('');
  const [exprError, setExprError] = useState<string | null>(null);
  const [path, setPath] = useState('file');

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

  const commands = [`chmod ${octal} ${path || 'file'}`, `chmod ${toChmodExpression(perms)} ${path || 'file'}`];

  return (
    <ToolLayout
      title="Chmod Calculator"
      seoTitle="Chmod Calculator – Linux File Permissions (Octal & Symbolic)"
      tagline="Work out Unix file permissions in octal (755) and symbolic (rwxr-xr-x) notation"
      metaDescription="Calculate chmod permissions with checkboxes and convert between octal (755, 644, 4755) and symbolic (rwxr-xr-x) notation, including setuid, setgid and sticky bits. Apply chmod expressions like u+x."
    >
      <Card hover={false}>
        <div className="p-6 space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted">
                  <th className="text-left font-medium py-2"></th>
                  {BITS.map((b) => <th key={b} className="font-medium py-2 px-2">{BIT_LABEL[b]} <span className="font-mono">({b})</span></th>)}
                  <th className="font-medium py-2 px-2">Octal</th>
                </tr>
              </thead>
              <tbody>
                {WHO.map((who) => (
                  <tr key={who} className="border-t border-border">
                    <td className="py-3 pr-3 font-medium text-text whitespace-nowrap">{WHO_LABEL[who]}</td>
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

          <div className="flex flex-wrap gap-5 pt-1">
            <Checkbox checked={perms.setuid} onChange={(v) => setPerms((p) => ({ ...p, setuid: v }))} label="setuid (4)" />
            <Checkbox checked={perms.setgid} onChange={(v) => setPerms((p) => ({ ...p, setgid: v }))} label="setgid (2)" />
            <Checkbox checked={perms.sticky} onChange={(v) => setPerms((p) => ({ ...p, sticky: v }))} label="sticky (1)" />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Octal" htmlFor="chmod-octal">
              <SyncedInput id="chmod-octal" value={octal} onCommit={(v) => tryParse(() => fromOctal(v))} />
            </Field>
            <Field label="Symbolic" htmlFor="chmod-symbolic">
              <SyncedInput id="chmod-symbolic" value={symbolic} onCommit={(v) => tryParse(() => fromSymbolic(v))} />
            </Field>
            <Field label="Apply chmod expression" htmlFor="chmod-expr" hint={exprError ?? 'e.g. u+x, go-w, a=r — press Enter'}>
              <TextInput
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
                className="font-mono text-lg!"
                spellCheck={false}
              />
            </Field>
          </div>

          <div className="space-y-2">
            <Field label="File or directory" htmlFor="chmod-path" className="max-w-sm">
              <TextInput id="chmod-path" value={path} onChange={(e) => setPath(e.target.value)} className="font-mono" />
            </Field>
            {commands.map((cmd) => (
              <div key={cmd} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-gray-900 dark:bg-black/40 font-mono text-sm text-green-300">
                <span className="text-gray-500 select-none">$</span>
                <span className="flex-1 min-w-0 break-all">{cmd}</span>
                <CopyButton text={cmd} label="" size="sm" className="px-2!" />
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-text-secondary mb-2">Common modes</h2>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <SecondaryButton key={p.mode} onClick={() => setPerms(fromOctal(p.mode))} title={p.use} className={octal === p.mode ? 'border-primary!' : ''}>
                  <span className="font-mono">{p.mode}</span>
                  <span className="text-xs text-text-muted hidden sm:inline">{p.use}</span>
                </SecondaryButton>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <InfoCard title="How Unix Permissions Work">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { t: 'Read, write, execute', d: 'Each digit is a sum: read = 4, write = 2, execute = 1. So 7 = rwx, 6 = rw-, 5 = r-x, 4 = r--. The three digits are for the owner, the group and everyone else.' },
            { t: 'Directories', d: 'On a directory, r lists its contents, w creates and deletes entries, and x lets you enter it or access files inside. Directories usually need x wherever they have r.' },
            { t: 'Special bits', d: 'setuid (4xxx) runs a program as its owner, setgid (2xxx) as its group or makes new files inherit the directory’s group, and sticky (1xxx) stops users deleting others’ files in shared directories like /tmp.' },
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
