import { describe, expect, it } from 'vitest';
import { jsonToYaml, yamlToJson } from './yaml-utils';

describe('yamlToJson', () => {
  it('converts mappings, sequences, anchors and scalars', () => {
    const yaml = `
defaults: &defaults
  adapter: postgres
  port: 5432
dev:
  <<: *defaults
  debug: true
tags: [a, b]
empty: ~
`;
    expect(JSON.parse(yamlToJson(yaml))).toEqual({
      defaults: { adapter: 'postgres', port: 5432 },
      dev: { adapter: 'postgres', port: 5432, debug: true },
      tags: ['a', 'b'],
      empty: null,
    });
  });

  it('turns multi-document streams into an array', () => {
    expect(JSON.parse(yamlToJson('a: 1\n---\nb: 2\n'))).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('reports errors with a line number', () => {
    expect(() => yamlToJson('a: 1\n  b: 2\n')).toThrow(/^Line \d+, column \d+: /);
  });

  it('returns an empty string for empty input', () => {
    expect(yamlToJson('')).toBe('');
  });
});

describe('jsonToYaml', () => {
  it('converts JSON with options', () => {
    expect(jsonToYaml('{"b":1,"a":[1,"x"]}')).toBe('b: 1\na:\n  - 1\n  - x\n');
    expect(jsonToYaml('{"b":1,"a":2}', { sortKeys: true })).toBe('a: 2\nb: 1\n');
    expect(jsonToYaml('[{"a":1},{"b":2}]', { splitArray: true })).toBe('a: 1\n---\nb: 2\n');
  });

  it('round-trips', () => {
    const obj = { name: 'x', nested: { list: [1, 2, { k: 'yes' }], s: 'multi\nline' } };
    expect(JSON.parse(yamlToJson(jsonToYaml(JSON.stringify(obj))))).toEqual(obj);
  });

  it('reports JSON errors with a line number', () => {
    expect(() => jsonToYaml('{\n  "a": 1,\n}')).toThrow(/^Line 3/);
  });
});
