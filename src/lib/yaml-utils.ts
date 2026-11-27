import { parseAllDocuments, stringify, YAMLParseError } from 'yaml';

function describeYamlError(e: unknown): string {
  if (e instanceof YAMLParseError) {
    const pos = e.linePos?.[0];
    const msg = e.message.split('\n')[0].replace(/ at line \d+, column \d+:?$/, '');
    return pos ? `Line ${pos.line}, column ${pos.col}: ${msg}` : msg;
  }
  return e instanceof Error ? e.message : String(e);
}

/**
 * Converts YAML to JSON. A stream with several documents (separated by
 * `---`) becomes a JSON array.
 */
export function yamlToJson(text: string, indent: number | '\t' = 2): string {
  // merge: true enables '<<' merge keys, widely used in Compose and CI files.
  const docs = parseAllDocuments(text, { merge: true });
  if (!Array.isArray(docs)) return ''; // empty stream
  const values: unknown[] = [];
  for (const doc of docs) {
    if (doc.errors.length) throw new Error(describeYamlError(doc.errors[0]));
    values.push(doc.toJS({ maxAliasCount: 1000 }));
  }
  if (values.length === 0) return '';
  return JSON.stringify(values.length === 1 ? values[0] : values, null, indent);
}

function describeJsonError(text: string, e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  const m = msg.match(/position (\d+)/);
  if (!m) return msg;
  const pos = Number(m[1]);
  const before = text.slice(0, pos);
  const line = before.split('\n').length;
  const col = pos - before.lastIndexOf('\n');
  return `Line ${line}, column ${col}: ${msg.replace(/ in JSON at position \d+.*$/, '').replace(/ \(line \d+ column \d+\)$/, '')}`;
}

export interface JsonToYamlOptions {
  indent?: number;
  sortKeys?: boolean;
  /** Emit a document per element when the input is a top-level array. */
  splitArray?: boolean;
}

export function jsonToYaml(text: string, { indent = 2, sortKeys = false, splitArray = false }: JsonToYamlOptions = {}): string {
  if (!text.trim()) return '';
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (e) {
    throw new Error(describeJsonError(text, e));
  }
  const opts = { indent, sortMapEntries: sortKeys, lineWidth: 0 };
  if (splitArray && Array.isArray(value)) {
    return value.map((v) => stringify(v, opts)).join('---\n');
  }
  return stringify(value, opts);
}
