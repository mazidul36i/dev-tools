import { format, type SqlLanguage } from 'sql-formatter';

export const SQL_DIALECTS: { id: SqlLanguage; label: string }[] = [
  { id: 'sql', label: 'Standard SQL' },
  { id: 'mysql', label: 'MySQL' },
  { id: 'mariadb', label: 'MariaDB' },
  { id: 'postgresql', label: 'PostgreSQL' },
  { id: 'sqlite', label: 'SQLite' },
  { id: 'transactsql', label: 'SQL Server (T-SQL)' },
  { id: 'plsql', label: 'Oracle PL/SQL' },
  { id: 'bigquery', label: 'BigQuery' },
  { id: 'snowflake', label: 'Snowflake' },
  { id: 'redshift', label: 'Redshift' },
  { id: 'duckdb', label: 'DuckDB' },
  { id: 'clickhouse', label: 'ClickHouse' },
  { id: 'spark', label: 'Spark SQL' },
  { id: 'trino', label: 'Trino / Presto' },
  { id: 'db2', label: 'IBM Db2' },
  { id: 'hive', label: 'Hive' },
];

export type Case = 'preserve' | 'upper' | 'lower';

export interface SqlFormatOptions {
  dialect: SqlLanguage;
  indent: number | 'tab';
  keywordCase: Case;
  functionCase?: Case;
  dataTypeCase?: Case;
  linesBetweenQueries?: number;
  denseOperators?: boolean;
  /** "tabularLeft" lines keywords up in a column. */
  indentStyle?: 'standard' | 'tabularLeft' | 'tabularRight';
  logicalOperatorNewline?: 'before' | 'after';
}

export function formatSql(sql: string, o: SqlFormatOptions): string {
  if (!sql.trim()) return '';
  try {
    return format(sql, {
      language: o.dialect,
      tabWidth: o.indent === 'tab' ? 4 : o.indent,
      useTabs: o.indent === 'tab',
      keywordCase: o.keywordCase,
      functionCase: o.functionCase ?? o.keywordCase,
      dataTypeCase: o.dataTypeCase ?? o.keywordCase,
      linesBetweenQueries: o.linesBetweenQueries ?? 1,
      denseOperators: o.denseOperators ?? false,
      indentStyle: o.indentStyle ?? 'standard',
      logicalOperatorNewline: o.logicalOperatorNewline ?? 'before',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(msg.split('\n').slice(0, 3).join('\n'));
  }
}

/**
 * Removes comments and collapses whitespace outside string literals and
 * quoted identifiers, producing a single-line statement list.
 */
export function minifySql(sql: string): string {
  let out = '';
  let i = 0;
  const n = sql.length;
  let pendingSpace = false;
  const emit = (s: string) => {
    if (pendingSpace && out && !/[\s(,;]$/.test(out) && !/^[),;]/.test(s)) out += ' ';
    pendingSpace = false;
    out += s;
  };
  while (i < n) {
    const c = sql[i];
    const next = sql[i + 1];
    if (c === '-' && next === '-') {
      while (i < n && sql[i] !== '\n') i++;
      pendingSpace = true;
    } else if (c === '#' && /^#\s/.test(sql.slice(i, i + 2))) {
      // MySQL "# comment"
      while (i < n && sql[i] !== '\n') i++;
      pendingSpace = true;
    } else if (c === '/' && next === '*') {
      const end = sql.indexOf('*/', i + 2);
      i = end < 0 ? n : end + 2;
      pendingSpace = true;
    } else if (/\s/.test(c)) {
      i++;
      pendingSpace = true;
    } else if (c === "'" || c === '"' || c === '`' || c === '[') {
      const close = c === '[' ? ']' : c;
      let j = i + 1;
      while (j < n) {
        if (sql[j] === close) {
          if (sql[j + 1] === close && close !== ']') { j += 2; continue; } // doubled quote escape
          break;
        }
        if (sql[j] === '\\' && c !== '[') j++;
        j++;
      }
      emit(sql.slice(i, j + 1));
      i = j + 1;
    } else {
      let j = i;
      while (j < n && !/[\s'"`[]/.test(sql[j]) && !(sql[j] === '-' && sql[j + 1] === '-') && !(sql[j] === '/' && sql[j + 1] === '*')) j++;
      if (j === i) j = i + 1;
      emit(sql.slice(i, j));
      i = j;
    }
  }
  return out.trim();
}
