import { describe, expect, it } from 'vitest';
import { formatSql, minifySql } from './sql-format-utils';

describe('formatSql', () => {
  it('formats with keyword case and indent', () => {
    const out = formatSql('select id, name from users where active = 1 and age > 18 order by name', {
      dialect: 'postgresql', indent: 2, keywordCase: 'upper',
    });
    expect(out).toBe(`SELECT
  id,
  name
FROM
  users
WHERE
  active = 1
  AND age > 18
ORDER BY
  name`);
  });

  it('supports tabs and lowercase', () => {
    expect(formatSql('SELECT 1', { dialect: 'sql', indent: 'tab', keywordCase: 'lower' })).toBe('select\n\t1');
  });

  it('reports parse errors', () => {
    expect(() => formatSql("select 'unterminated", { dialect: 'sql', indent: 2, keywordCase: 'upper' })).toThrow();
  });
});

describe('minifySql', () => {
  it('removes comments and whitespace but keeps strings intact', () => {
    const sql = `-- get users
SELECT  id,   name /* display */
FROM users
WHERE note = 'a  --  b' AND x = "y  z" -- trailing
;`;
    expect(minifySql(sql)).toBe(`SELECT id,name FROM users WHERE note = 'a  --  b' AND x = "y  z";`);
  });

  it('handles escaped quotes and brackets', () => {
    expect(minifySql("SELECT 'it''s'  ,  [my  col]\n FROM t")).toBe("SELECT 'it''s',[my  col] FROM t");
  });
});
