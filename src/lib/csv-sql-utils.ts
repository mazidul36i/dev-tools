// ── Types ──────────────────────────────────────────────────────────────────────

export type SqlDialect = 'mysql' | 'postgresql' | 'sqlite';
export type SqlAction = 'create' | 'insert' | 'batch-insert' | 'upsert' | 'update';
export type Delimiter = ',' | '\t' | ';' | '|';
export type ColumnType = 'INTEGER' | 'REAL' | 'TEXT' | 'BOOLEAN';

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

/** Shared value-escaping options */
export interface ValueOptions {
  treatEmptyAsNull: boolean;
  treatNullStringAsNull: boolean;
}

// ── Delimiter Auto-Detection ───────────────────────────────────────────────────

const CANDIDATE_DELIMITERS: Delimiter[] = [',', '\t', ';', '|'];

/**
 * Sniff the first 5 non-empty lines and pick the delimiter whose column count
 * is most consistent (lowest variance) and greater than 1.
 */
export function detectDelimiter(input: string): Delimiter {
  const lines = input.split(/\r?\n/).filter((l) => l.trim().length > 0).slice(0, 5);
  if (lines.length === 0) return ',';

  let bestDelimiter: Delimiter = ',';
  let bestScore = -1;

  for (const d of CANDIDATE_DELIMITERS) {
    const counts = lines.map((line) => splitRow(line, d, '"').length);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    if (avg <= 1) continue; // delimiter not present
    const variance = counts.reduce((sum, c) => sum + (c - avg) ** 2, 0) / counts.length;
    // Score: prefer high avg column count with low variance
    const score = avg / (1 + variance);
    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = d;
    }
  }
  return bestDelimiter;
}

// ── CSV Parsing ────────────────────────────────────────────────────────────────

/**
 * Split a single CSV row respecting quoted fields.
 */
function splitRow(line: string, delimiter: string, quoteChar: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === quoteChar) {
        if (i + 1 < line.length && line[i + 1] === quoteChar) {
          current += quoteChar;
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === quoteChar) {
        inQuotes = true;
      } else if (ch === delimiter) {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Parse raw CSV text into headers + data rows.
 */
export function parseCsv(
  input: string,
  delimiter: Delimiter | 'auto' = 'auto',
  quoteChar: string = '"',
  hasHeaders: boolean = true,
): ParsedCsv {
  if (!input.trim()) return { headers: [], rows: [] };

  const effectiveDelimiter = delimiter === 'auto' ? detectDelimiter(input) : delimiter;
  const lines = input.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const allRows = lines.map((line) => splitRow(line, effectiveDelimiter, quoteChar));

  if (hasHeaders) {
    const headers = allRows[0].map((h) => h.trim());
    return { headers, rows: allRows.slice(1) };
  }

  // Generate column names: col1, col2, ...
  const colCount = allRows[0].length;
  const headers = Array.from({ length: colCount }, (_, i) => `col${i + 1}`);
  return { headers, rows: allRows };
}

// ── Type Inference ─────────────────────────────────────────────────────────────

const INT_RE = /^-?\d+$/;
const FLOAT_RE = /^-?\d+\.\d+$/;
const BOOL_RE = /^(true|false)$/i;
const NULL_RE = /^null$/i;

/**
 * Infer SQL column types by sampling all data rows.
 */
export function inferColumnTypes(headers: string[], rows: string[][]): ColumnType[] {
  return headers.map((_, colIdx) => {
    let hasInt = false;
    let hasFloat = false;
    let hasBool = false;
    let hasText = false;

    for (const row of rows) {
      const val = (row[colIdx] ?? '').trim();
      if (val === '' || NULL_RE.test(val)) continue; // skip empty and NULL
      if (INT_RE.test(val)) {
        hasInt = true;
      } else if (FLOAT_RE.test(val)) {
        hasFloat = true;
      } else if (BOOL_RE.test(val)) {
        hasBool = true;
      } else {
        hasText = true;
      }
    }

    if (hasText) return 'TEXT';
    if (hasFloat) return 'REAL';
    if (hasInt && hasBool) return 'TEXT';
    if (hasBool) return 'BOOLEAN';
    if (hasInt) return 'INTEGER';
    return 'TEXT';
  });
}

/**
 * Map generic ColumnType to a dialect-specific SQL type string.
 */
function dialectType(type: ColumnType, dialect: SqlDialect): string {
  switch (dialect) {
    case 'mysql':
      switch (type) {
        case 'INTEGER': return 'INT';
        case 'REAL': return 'DOUBLE';
        case 'BOOLEAN': return 'TINYINT(1)';
        case 'TEXT': return 'VARCHAR(255)';
      }
      break;
    case 'postgresql':
      switch (type) {
        case 'INTEGER': return 'INTEGER';
        case 'REAL': return 'DOUBLE PRECISION';
        case 'BOOLEAN': return 'BOOLEAN';
        case 'TEXT': return 'TEXT';
      }
      break;
    case 'sqlite':
      switch (type) {
        case 'INTEGER': return 'INTEGER';
        case 'REAL': return 'REAL';
        case 'BOOLEAN': return 'INTEGER'; // SQLite has no boolean
        case 'TEXT': return 'TEXT';
      }
      break;
  }
  return 'TEXT';
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Quote an identifier (table/column name) based on dialect.
 * When `quote` is false, the raw name is returned as-is.
 */
export function quoteIdentifier(name: string, dialect: SqlDialect, quote: boolean = true): string {
  if (!quote) return name;
  if (dialect === 'mysql') return '`' + name.replace(/`/g, '``') + '`';
  return '"' + name.replace(/"/g, '""') + '"';
}

/**
 * Build a fully-qualified table reference, optionally with schema prefix.
 */
function qualifiedTable(table: string, schema: string, dialect: SqlDialect, quote: boolean): string {
  const qTable = quoteIdentifier(table, dialect, quote);
  if (!schema.trim()) return qTable;
  return `${quoteIdentifier(schema.trim(), dialect, quote)}.${qTable}`;
}

/**
 * Escape a cell value for use in a SQL statement.
 * - If `treatNullStringAsNull` is true, the literal text "NULL" (case-insensitive) becomes SQL NULL.
 * - If `treatEmptyAsNull` is true, empty/whitespace-only values become SQL NULL.
 */
export function escapeValue(val: string, opts: ValueOptions): string {
  if (opts.treatNullStringAsNull && NULL_RE.test(val.trim())) return 'NULL';
  if (opts.treatEmptyAsNull && val.trim() === '') return 'NULL';
  // Escape single quotes
  return "'" + val.replace(/'/g, "''") + "'";
}

function formatRow(
  row: string[],
  headers: string[],
  opts: ValueOptions,
): string {
  return headers
    .map((_, i) => escapeValue(row[i] ?? '', opts))
    .join(', ');
}

// ── SQL Generators ─────────────────────────────────────────────────────────────

export function generateCreateTable(
  table: string,
  schema: string,
  headers: string[],
  rows: string[][],
  dialect: SqlDialect,
  quote: boolean,
): string {
  const types = inferColumnTypes(headers, rows);
  const qTable = qualifiedTable(table, schema, dialect, quote);
  const columns = headers.map((h, i) => `  ${quoteIdentifier(h, dialect, quote)} ${dialectType(types[i], dialect)}`);
  return `CREATE TABLE ${qTable} (\n${columns.join(',\n')}\n);`;
}

export function generateInserts(
  table: string,
  schema: string,
  headers: string[],
  rows: string[][],
  dialect: SqlDialect,
  opts: ValueOptions,
  quote: boolean,
): string {
  const qTable = qualifiedTable(table, schema, dialect, quote);
  const cols = headers.map((h) => quoteIdentifier(h, dialect, quote)).join(', ');
  return rows
    .map((row) => `INSERT INTO ${qTable} (${cols}) VALUES (${formatRow(row, headers, opts)});`)
    .join('\n');
}

export function generateBatchInserts(
  table: string,
  schema: string,
  headers: string[],
  rows: string[][],
  dialect: SqlDialect,
  batchSize: number,
  opts: ValueOptions,
  quote: boolean,
): string {
  const qTable = qualifiedTable(table, schema, dialect, quote);
  const cols = headers.map((h) => quoteIdentifier(h, dialect, quote)).join(', ');
  const statements: string[] = [];

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values = batch
      .map((row) => `  (${formatRow(row, headers, opts)})`)
      .join(',\n');
    statements.push(`INSERT INTO ${qTable} (${cols}) VALUES\n${values};`);
  }

  return statements.join('\n\n');
}

export function generateUpsert(
  table: string,
  schema: string,
  headers: string[],
  rows: string[][],
  dialect: SqlDialect,
  conflictColumn: string,
  opts: ValueOptions,
  quote: boolean,
): string {
  const qTable = qualifiedTable(table, schema, dialect, quote);
  const cols = headers.map((h) => quoteIdentifier(h, dialect, quote)).join(', ');
  const updateCols = headers.filter((h) => h !== conflictColumn);

  return rows
    .map((row) => {
      const values = formatRow(row, headers, opts);

      switch (dialect) {
        case 'mysql': {
          const updates = updateCols
            .map((h) => `${quoteIdentifier(h, dialect, quote)} = VALUES(${quoteIdentifier(h, dialect, quote)})`)
            .join(', ');
          return `INSERT INTO ${qTable} (${cols}) VALUES (${values})\nON DUPLICATE KEY UPDATE ${updates};`;
        }
        case 'postgresql': {
          const updates = updateCols
            .map((h) => `${quoteIdentifier(h, dialect, quote)} = EXCLUDED.${quoteIdentifier(h, dialect, quote)}`)
            .join(', ');
          return `INSERT INTO ${qTable} (${cols}) VALUES (${values})\nON CONFLICT (${quoteIdentifier(conflictColumn, dialect, quote)}) DO UPDATE SET ${updates};`;
        }
        case 'sqlite': {
          const updates = updateCols
            .map((h) => `${quoteIdentifier(h, dialect, quote)} = excluded.${quoteIdentifier(h, dialect, quote)}`)
            .join(', ');
          return `INSERT INTO ${qTable} (${cols}) VALUES (${values})\nON CONFLICT (${quoteIdentifier(conflictColumn, dialect, quote)}) DO UPDATE SET ${updates};`;
        }
      }
    })
    .join('\n\n');
}

export function generateUpdate(
  table: string,
  schema: string,
  headers: string[],
  rows: string[][],
  dialect: SqlDialect,
  whereColumn: string,
  opts: ValueOptions,
  quote: boolean,
): string {
  const qTable = qualifiedTable(table, schema, dialect, quote);
  const setCols = headers.filter((h) => h !== whereColumn);
  const whereIdx = headers.indexOf(whereColumn);

  return rows
    .map((row) => {
      const sets = setCols
        .map((h) => {
          const idx = headers.indexOf(h);
          return `${quoteIdentifier(h, dialect, quote)} = ${escapeValue(row[idx] ?? '', opts)}`;
        })
        .join(', ');
      const whereVal = escapeValue(row[whereIdx] ?? '', { treatEmptyAsNull: false, treatNullStringAsNull: false }); // never NULL the WHERE column
      return `UPDATE ${qTable} SET ${sets} WHERE ${quoteIdentifier(whereColumn, dialect, quote)} = ${whereVal};`;
    })
    .join('\n');
}

// ── Facade ─────────────────────────────────────────────────────────────────────

export interface GenerateSqlOptions {
  action: SqlAction;
  table: string;
  schema: string;
  headers: string[];
  rows: string[][];
  dialect: SqlDialect;
  treatEmptyAsNull: boolean;
  treatNullStringAsNull: boolean;
  batchSize: number;
  conflictColumn: string;
  quoteIdentifiers: boolean;
}

export function generateSql(opts: GenerateSqlOptions): string {
  const { action, table, schema, headers, rows, dialect, treatEmptyAsNull, treatNullStringAsNull, batchSize, conflictColumn, quoteIdentifiers } = opts;
  const valOpts: ValueOptions = { treatEmptyAsNull, treatNullStringAsNull };

  switch (action) {
    case 'create':
      return generateCreateTable(table, schema, headers, rows, dialect, quoteIdentifiers);
    case 'insert':
      return generateInserts(table, schema, headers, rows, dialect, valOpts, quoteIdentifiers);
    case 'batch-insert':
      return generateBatchInserts(table, schema, headers, rows, dialect, batchSize, valOpts, quoteIdentifiers);
    case 'upsert':
      return generateUpsert(table, schema, headers, rows, dialect, conflictColumn, valOpts, quoteIdentifiers);
    case 'update':
      return generateUpdate(table, schema, headers, rows, dialect, conflictColumn, valOpts, quoteIdentifiers);
  }
}

