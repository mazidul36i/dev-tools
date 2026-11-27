// Infers a structural type from sample JSON and renders it as type
// definitions for several languages.

import { splitWords as words } from './text-utils';

type Prim = 'string' | 'integer' | 'number' | 'boolean' | 'null';

interface Shape {
  prims: Set<Prim>;
  object?: ObjectShape;
  array?: Shape;
  /** At least one array was seen (array may still be undefined when all were empty). */
  isArray?: boolean;
}

interface ObjectShape {
  fields: Map<string, { shape: Shape; count: number }>;
  samples: number;
}

function emptyShape(): Shape {
  return { prims: new Set() };
}

function addValue(shape: Shape, value: unknown) {
  if (value === null) shape.prims.add('null');
  else if (typeof value === 'string') shape.prims.add('string');
  else if (typeof value === 'boolean') shape.prims.add('boolean');
  else if (typeof value === 'number') shape.prims.add(Number.isInteger(value) ? 'integer' : 'number');
  else if (Array.isArray(value)) {
    shape.isArray = true;
    for (const item of value) {
      shape.array ??= emptyShape();
      addValue(shape.array, item);
    }
  } else if (typeof value === 'object') {
    shape.object ??= { fields: new Map(), samples: 0 };
    const obj = shape.object;
    obj.samples++;
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      let f = obj.fields.get(k);
      if (!f) {
        f = { shape: emptyShape(), count: 0 };
        obj.fields.set(k, f);
      }
      f.count++;
      addValue(f.shape, v);
    }
  }
}

// ── Naming ──────────────────────────────────────────────────────────────

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

export function pascalCase(key: string): string {
  const s = words(key).map(cap).join('');
  return !s ? 'Field' : /^\d/.test(s) ? `_${s}` : s;
}

export function camelCase(key: string): string {
  const p = pascalCase(key);
  return p.startsWith('_') ? p : p.charAt(0).toLowerCase() + p.slice(1);
}

export function snakeCase(key: string): string {
  const s = words(key).join('_');
  return !s ? 'field' : /^\d/.test(s) ? `_${s}` : s;
}

export function singularize(word: string): string {
  if (/ies$/i.test(word)) return word.slice(0, -3) + 'y';
  if (/(ss|us|is)$/i.test(word)) return word;
  if (/es$/i.test(word) && /(x|ch|sh|ss|z)$/i.test(word.slice(0, -2))) return word.slice(0, -2);
  if (/s$/i.test(word) && word.length > 1) return word.slice(0, -1);
  return word;
}

// ── Type model ──────────────────────────────────────────────────────────

export type TypeRef =
  | { kind: 'prim'; name: 'string' | 'integer' | 'number' | 'boolean' | 'any' }
  | { kind: 'array'; item: TypeRef }
  | { kind: 'struct'; name: string };

export interface FieldDef {
  key: string;
  type: TypeRef;
  /** Value can be null. */
  nullable: boolean;
  /** Key is missing from some samples. */
  optional: boolean;
}

export interface StructDef {
  name: string;
  fields: FieldDef[];
}

export interface TypeModel {
  root: TypeRef;
  rootNullable: boolean;
  /** In discovery order (root first). */
  structs: StructDef[];
}

export function buildModel(json: unknown, rootName = 'Root'): TypeModel {
  const shape = emptyShape();
  addValue(shape, json);
  const structs: StructDef[] = [];
  const bySignature = new Map<string, string>();
  const usedNames = new Set<string>();

  function uniqueName(base: string) {
    let name = base || 'Item';
    for (let i = 2; usedNames.has(name); i++) name = `${base}${i}`;
    usedNames.add(name);
    return name;
  }

  function resolve(s: Shape, nameHint: string): { type: TypeRef; nullable: boolean } {
    const nullable = s.prims.has('null');
    const kinds = new Set<string>([...s.prims].filter((p) => p !== 'null'));
    if (s.object) kinds.add('object');
    if (s.isArray) kinds.add('array');
    if (kinds.has('integer') && kinds.has('number')) kinds.delete('integer');

    if (kinds.size !== 1) return { type: { kind: 'prim', name: 'any' }, nullable };
    const [kind] = kinds;
    if (kind === 'array') {
      const item = s.array ? resolve(s.array, singularize(nameHint)) : { type: { kind: 'prim', name: 'any' } as TypeRef };
      return { type: { kind: 'array', item: item.type }, nullable };
    }
    if (kind === 'object') return { type: { kind: 'struct', name: defineStruct(s.object!, nameHint) }, nullable };
    return { type: { kind: 'prim', name: kind as 'string' | 'integer' | 'number' | 'boolean' }, nullable };
  }

  function defineStruct(obj: ObjectShape, nameHint: string): string {
    const def: StructDef = { name: '', fields: [] };
    structs.push(def);
    for (const [key, f] of obj.fields) {
      const r = resolve(f.shape, pascalCase(key));
      def.fields.push({ key, type: r.type, nullable: r.nullable, optional: f.count < obj.samples });
    }
    const signature = JSON.stringify(def.fields);
    const existing = bySignature.get(signature);
    if (existing) {
      structs.splice(structs.indexOf(def), 1);
      return existing;
    }
    def.name = uniqueName(pascalCase(nameHint));
    bySignature.set(signature, def.name);
    return def.name;
  }

  const root = resolve(shape, rootName);
  return { root: root.type, rootNullable: root.nullable, structs };
}

// ── Emitters ────────────────────────────────────────────────────────────

export type TargetLanguage = 'typescript' | 'go' | 'java' | 'kotlin' | 'python' | 'rust';

export const TARGET_LANGUAGES: { id: TargetLanguage; label: string; ext: string }[] = [
  { id: 'typescript', label: 'TypeScript', ext: 'ts' },
  { id: 'go', label: 'Go', ext: 'go' },
  { id: 'java', label: 'Java', ext: 'java' },
  { id: 'kotlin', label: 'Kotlin', ext: 'kt' },
  { id: 'python', label: 'Python', ext: 'py' },
  { id: 'rust', label: 'Rust', ext: 'rs' },
];

export interface GenerateOptions {
  rootName?: string;
  /** TypeScript: `type` aliases instead of interfaces. */
  tsTypeAlias?: boolean;
  /** Mark every field optional/nullable regardless of the sample. */
  allOptional?: boolean;
}

const isIdent = (s: string) => /^[A-Za-z_$][\w$]*$/.test(s);

const RESERVED: Record<string, Set<string>> = {
  java: new Set('abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static super switch synchronized this throw throws transient try void volatile while record var'.split(' ')),
  kotlin: new Set('as break class continue do else false for fun if in interface is null object package return super this throw true try typealias typeof val var when while'.split(' ')),
  python: new Set('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'.split(' ')),
  rust: new Set('as break const continue crate else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while async await dyn'.split(' ')),
};

function safe(name: string, lang: string) {
  return RESERVED[lang]?.has(name) ? `${name}_` : name;
}

function tsType(t: TypeRef): string {
  if (t.kind === 'array') {
    const inner = tsType(t.item);
    return inner.includes(' ') ? `(${inner})[]` : `${inner}[]`;
  }
  if (t.kind === 'struct') return t.name;
  return { string: 'string', integer: 'number', number: 'number', boolean: 'boolean', any: 'unknown' }[t.name];
}

function emitTypeScript(m: TypeModel, o: GenerateOptions): string {
  const out: string[] = [];
  if (m.root.kind !== 'struct') {
    out.push(`export type ${pascalCase(o.rootName || 'Root')} = ${tsType(m.root)}${m.rootNullable ? ' | null' : ''};`);
  }
  for (const s of m.structs) {
    const body = s.fields.map((f) => {
      const key = isIdent(f.key) ? f.key : JSON.stringify(f.key);
      const opt = f.optional || o.allOptional ? '?' : '';
      return `  ${key}${opt}: ${tsType(f.type)}${f.nullable ? ' | null' : ''};`;
    });
    out.push(o.tsTypeAlias
      ? `export type ${s.name} = {\n${body.join('\n')}\n};`
      : `export interface ${s.name} {\n${body.join('\n')}\n}`);
  }
  return out.join('\n\n') + '\n';
}

const GO_INITIALISMS = new Set(['id', 'url', 'uri', 'http', 'https', 'api', 'json', 'uuid', 'ip', 'sql', 'html', 'xml', 'cpu', 'tcp', 'udp', 'tls', 'ttl', 'ui', 'utf8']);

/** Go exported field name with idiomatic initialisms (UserID, AvatarURL). */
export function goFieldName(key: string): string {
  const name = words(key).map((w) => (GO_INITIALISMS.has(w) ? w.toUpperCase() : cap(w))).join('');
  return !name ? 'Field' : /^\d/.test(name) ? `X${name}` : name;
}

function goType(t: TypeRef, nullable: boolean): string {
  if (t.kind === 'array') return `[]${goType(t.item, false)}`;
  if (t.kind === 'struct') return nullable ? `*${t.name}` : t.name;
  const base = { string: 'string', integer: 'int64', number: 'float64', boolean: 'bool', any: 'any' }[t.name];
  return nullable && base !== 'any' ? `*${base}` : base;
}

function emitGo(m: TypeModel, o: GenerateOptions): string {
  const out: string[] = [];
  if (m.root.kind !== 'struct') out.push(`type ${pascalCase(o.rootName || 'Root')} ${goType(m.root, false)}`);
  for (const s of m.structs) {
    const used = new Set<string>();
    const rows = s.fields.map((f) => {
      let name = goFieldName(f.key);
      for (let i = 2; used.has(name); i++) name = `${goFieldName(f.key)}${i}`;
      used.add(name);
      const optional = f.optional || !!o.allOptional;
      return [name, goType(f.type, f.nullable || optional), `\`json:"${f.key}${optional ? ',omitempty' : ''}"\``];
    });
    const w0 = Math.max(0, ...rows.map((r) => r[0].length));
    const w1 = Math.max(0, ...rows.map((r) => r[1].length));
    const body = rows.map(([n, t, tag]) => `\t${n.padEnd(w0)} ${t.padEnd(w1)} ${tag}`);
    out.push(`type ${s.name} struct {\n${body.join('\n')}\n}`);
  }
  return out.join('\n\n') + '\n';
}

function javaType(t: TypeRef): string {
  if (t.kind === 'array') return `List<${javaType(t.item)}>`;
  if (t.kind === 'struct') return t.name;
  return { string: 'String', integer: 'Long', number: 'Double', boolean: 'Boolean', any: 'Object' }[t.name];
}

function emitJava(m: TypeModel): string {
  const usesList = JSON.stringify(m).includes('"array"');
  const needsProp = m.structs.some((s) => s.fields.some((f) => safe(camelCase(f.key), 'java') !== f.key));
  const imports = [
    usesList && 'import java.util.List;',
    needsProp && 'import com.fasterxml.jackson.annotation.JsonProperty;',
  ].filter(Boolean);
  const out: string[] = imports.length ? [imports.join('\n')] : [];
  for (const s of m.structs) {
    const body = s.fields.map((f) => {
      const name = safe(camelCase(f.key), 'java');
      const ann = name !== f.key ? `    @JsonProperty("${f.key}")\n` : '';
      return `${ann}    private ${javaType(f.type)} ${name};`;
    });
    out.push(`public class ${s.name} {\n${body.join('\n')}\n}`);
  }
  if (m.root.kind !== 'struct') out.unshift(`// Top-level type: ${javaType(m.root)}`);
  return out.join('\n\n') + '\n';
}

function kotlinType(t: TypeRef): string {
  if (t.kind === 'array') return `List<${kotlinType(t.item)}>`;
  if (t.kind === 'struct') return t.name;
  return { string: 'String', integer: 'Long', number: 'Double', boolean: 'Boolean', any: 'Any' }[t.name];
}

function emitKotlin(m: TypeModel, o: GenerateOptions): string {
  const out: string[] = [];
  if (m.root.kind !== 'struct') out.push(`typealias ${pascalCase(o.rootName || 'Root')} = ${kotlinType(m.root)}`);
  for (const s of m.structs) {
    const params = s.fields.map((f) => {
      const name = safe(camelCase(f.key), 'kotlin');
      const ann = name !== f.key ? `@SerialName("${f.key}") ` : '';
      const nullable = f.nullable || f.optional || o.allOptional;
      const type = kotlinType(f.type) + (nullable ? '?' : '');
      return `    ${ann}val ${name}: ${type}${nullable ? ' = null' : ''}`;
    });
    out.push(`@Serializable\ndata class ${s.name}(\n${params.join(',\n')}\n)`);
  }
  return out.join('\n\n') + '\n';
}

function pyType(t: TypeRef): string {
  if (t.kind === 'array') return `list[${pyType(t.item)}]`;
  if (t.kind === 'struct') return t.name;
  return { string: 'str', integer: 'int', number: 'float', boolean: 'bool', any: 'Any' }[t.name];
}

function emitPython(m: TypeModel, o: GenerateOptions): string {
  const text = JSON.stringify(m);
  const header = ['from __future__ import annotations', '', 'from dataclasses import dataclass'];
  if (text.includes('"any"')) header.push('from typing import Any');
  const out: string[] = [header.join('\n')];
  // Dependencies first so names are defined before use.
  for (const s of [...m.structs].reverse()) {
    const fields = s.fields.map((f) => {
      const optional = f.optional || !!o.allOptional;
      let type = pyType(f.type);
      if (f.nullable || optional) type += ' | None';
      const name = safe(snakeCase(f.key), 'python');
      const comment = name !== f.key ? `  # "${f.key}"` : '';
      return { line: `    ${name}: ${type}${optional ? ' = None' : ''}${comment}`, optional };
    });
    // Fields with defaults must follow fields without.
    fields.sort((a, b) => Number(a.optional) - Number(b.optional));
    out.push(`@dataclass\nclass ${s.name}:\n${fields.map((f) => f.line).join('\n') || '    pass'}`);
  }
  if (m.root.kind !== 'struct') out.push(`${pascalCase(o.rootName || 'Root')} = ${pyType(m.root)}`);
  return out.join('\n\n\n') + '\n';
}

function rustType(t: TypeRef): string {
  if (t.kind === 'array') return `Vec<${rustType(t.item)}>`;
  if (t.kind === 'struct') return t.name;
  return { string: 'String', integer: 'i64', number: 'f64', boolean: 'bool', any: 'serde_json::Value' }[t.name];
}

function emitRust(m: TypeModel, o: GenerateOptions): string {
  const out: string[] = ['use serde::{Deserialize, Serialize};'];
  if (m.root.kind !== 'struct') out.push(`pub type ${pascalCase(o.rootName || 'Root')} = ${rustType(m.root)};`);
  for (const s of m.structs) {
    const body = s.fields.map((f) => {
      const name = safe(snakeCase(f.key), 'rust');
      const optional = f.optional || !!o.allOptional;
      const attrs: string[] = [];
      if (name !== f.key) attrs.push(`    #[serde(rename = "${f.key}")]`);
      if (optional) attrs.push('    #[serde(default, skip_serializing_if = "Option::is_none")]');
      let type = rustType(f.type);
      if (f.nullable || optional) type = `Option<${type}>`;
      return [...attrs, `    pub ${name}: ${type},`].join('\n');
    });
    out.push(`#[derive(Debug, Clone, Serialize, Deserialize)]\npub struct ${s.name} {\n${body.join('\n')}\n}`);
  }
  return out.join('\n\n') + '\n';
}

export function generateTypes(jsonText: string, lang: TargetLanguage, options: GenerateOptions = {}): string {
  let value: unknown;
  try {
    value = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }
  const model = buildModel(value, options.rootName || 'Root');
  switch (lang) {
    case 'typescript': return emitTypeScript(model, options);
    case 'go': return emitGo(model, options);
    case 'java': return emitJava(model);
    case 'kotlin': return emitKotlin(model, options);
    case 'python': return emitPython(model, options);
    case 'rust': return emitRust(model, options);
  }
}
