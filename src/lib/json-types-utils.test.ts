import { describe, expect, it } from 'vitest';
import { buildModel, camelCase, generateTypes, goFieldName, pascalCase, singularize, snakeCase } from './json-types-utils';

const sample = JSON.stringify({
  id: 1,
  userName: 'jane',
  'is-active': true,
  score: 9.5,
  address: { city: 'Oslo', zip: null },
  tags: ['a', 'b'],
  orders: [
    { id: 10, total: 5 },
    { id: 11, total: 7.25, note: 'gift' },
  ],
  extra: [],
});

describe('naming', () => {
  it('converts keys', () => {
    expect(pascalCase('user_name')).toBe('UserName');
    expect(pascalCase('HTTPServer')).toBe('HttpServer');
    expect(camelCase('is-active')).toBe('isActive');
    expect(snakeCase('userName')).toBe('user_name');
    expect(pascalCase('1st')).toBe('_1st');
    expect(singularize('orders')).toBe('order');
    expect(singularize('categories')).toBe('category');
    expect(singularize('boxes')).toBe('box');
    expect(singularize('status')).toBe('status');
    expect(singularize('addresses')).toBe('address');
    expect(singularize('matches')).toBe('match');
    expect(singularize('items')).toBe('item');
    expect(goFieldName('user_id')).toBe('UserID');
    expect(goFieldName('avatarUrl')).toBe('AvatarURL');
  });
});

describe('buildModel', () => {
  it('merges array elements and detects optional and nullable fields', () => {
    const m = buildModel(JSON.parse(sample));
    expect(m.structs.map((s) => s.name)).toEqual(['Root', 'Address', 'Order']);
    const order = m.structs[2].fields;
    expect(order.find((f) => f.key === 'total')!.type).toEqual({ kind: 'prim', name: 'number' });
    expect(order.find((f) => f.key === 'note')!.optional).toBe(true);
    expect(m.structs[1].fields.find((f) => f.key === 'zip')!.nullable).toBe(true);
  });

  it('reuses identical structures and handles array roots', () => {
    const m = buildModel([{ a: { x: 1 }, b: { x: 2 } }], 'Root');
    expect(m.root).toEqual({ kind: 'array', item: { kind: 'struct', name: 'Root' } });
    expect(m.structs.map((s) => s.name)).toEqual(['Root', 'A']);
  });
});

describe('generateTypes', () => {
  it('emits TypeScript', () => {
    expect(generateTypes(sample, 'typescript')).toBe(`export interface Root {
  id: number;
  userName: string;
  "is-active": boolean;
  score: number;
  address: Address;
  tags: string[];
  orders: Order[];
  extra: unknown[];
}

export interface Address {
  city: string;
  zip: null;
}

export interface Order {
  id: number;
  total: number;
  note?: string;
}
`.replace('  zip: null;', '  zip: unknown | null;'));
  });

  it('emits Go with json tags', () => {
    const go = generateTypes(sample, 'go');
    expect(go).toContain('type Order struct {');
    expect(go).toMatch(/Note\s+\*string\s+`json:"note,omitempty"`/);
    expect(go).toMatch(/IsActive\s+bool\s+`json:"is-active"`/);
    expect(go).toMatch(/Zip\s+any\s+`json:"zip"`/);
  });

  it('emits Java, Kotlin, Python and Rust', () => {
    expect(generateTypes(sample, 'java')).toContain('@JsonProperty("is-active")\n    private Boolean isActive;');
    expect(generateTypes(sample, 'kotlin')).toContain('val note: String? = null');
    const py = generateTypes(sample, 'python');
    expect(py.indexOf('class Order')).toBeLessThan(py.indexOf('class Root'));
    expect(py).toContain('    note: str | None = None');
    const rs = generateTypes(sample, 'rust');
    expect(rs).toContain('#[serde(rename = "userName")]\n    pub user_name: String,');
    expect(rs).toContain('pub note: Option<String>,');
  });

  it('rejects invalid JSON', () => {
    expect(() => generateTypes('{', 'go')).toThrow(/Invalid JSON/);
  });
});
