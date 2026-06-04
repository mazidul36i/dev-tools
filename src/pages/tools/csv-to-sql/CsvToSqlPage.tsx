import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Eraser, ChevronDown, Download, Upload, Table, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import CopyButton from '@components/ui/CopyButton';
import Button, { SecondaryButton } from '@components/ui/Button';
import Checkbox from '@components/ui/Checkbox';
import SegmentedControl from '@components/ui/SegmentedControl';
import ResizablePanels from '@components/ui/ResizablePanels';
import { downloadFile } from '@lib/download-utils';
import {
  parseCsv,
  detectDelimiter,
  generateSql,
  type SqlDialect,
  type SqlAction,
  type Delimiter,
  type ParsedCsv,
} from '@lib/csv-sql-utils';
import CsvPreviewTable from './CsvPreviewTable';

const MAX_ROWS_WARNING = 10000;

const actionLabels: Record<SqlAction, string> = {
  create: 'CREATE TABLE',
  insert: 'INSERT',
  'batch-insert': 'BATCH INSERT',
  upsert: 'UPSERT',
  update: 'UPDATE',
};

const dialectLabels: { id: SqlDialect; label: string }[] = [
  { id: 'mysql', label: 'MySQL' },
  { id: 'postgresql', label: 'PostgreSQL' },
  { id: 'sqlite', label: 'SQLite' },
];

const delimiterOptions: { value: Delimiter | 'auto'; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: ',', label: 'Comma (,)' },
  { value: '\t', label: 'Tab (\\t)' },
  { value: ';', label: 'Semicolon (;)' },
  { value: '|', label: 'Pipe (|)' },
];

const inputClass =
  'w-full h-full flex-1 p-4 bg-white/30 dark:bg-gray-900/30 border border-white/50 dark:border-gray-700/50 rounded-xl font-mono text-sm text-gray-900 dark:text-gray-100 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15 dark:focus:ring-white/15 focus:border-transparent transition-all';
const outputClass =
  'w-full h-full flex-1 p-4 bg-white/20 dark:bg-gray-900/20 border border-white/50 dark:border-gray-700/50 rounded-xl font-mono text-sm text-gray-700 dark:text-gray-300 resize-none cursor-default';

const selectClass =
  'border border-white/60 dark:border-gray-700/60 rounded-lg px-2.5 py-1.5 text-xs bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 focus:outline-none';

const sampleCsv = `id,name,email,age,active
1,John Doe,john@example.com,30,true
2,Jane Smith,jane@example.com,25,true
3,Bob Wilson,bob@example.com,35,false`;

export default function CsvToSqlPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [action, setAction] = useState<SqlAction>('insert');
  const [dialect, setDialect] = useState<SqlDialect>('postgresql');
  const [delimiter, setDelimiter] = useState<Delimiter | 'auto'>('auto');
  const [hasHeaders, setHasHeaders] = useState(true);
  const [treatEmptyAsNull, setTreatEmptyAsNull] = useState(true);
  const [treatNullStringAsNull, setTreatNullStringAsNull] = useState(true);
  const [quoteIdentifiers, setQuoteIdentifiers] = useState(false);
  const [tableName, setTableName] = useState('my_table');
  const [schemaName, setSchemaName] = useState('');
  const [batchSize, setBatchSize] = useState(100);
  const [conflictColumn, setConflictColumn] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV on input change
  const parsed: ParsedCsv = useMemo(() => {
    if (!input.trim()) return { headers: [], rows: [] };
    try {
      return parseCsv(input, delimiter, '"', hasHeaders);
    } catch {
      return { headers: [], rows: [] };
    }
  }, [input, delimiter, hasHeaders]);

  // Detected delimiter for display
  const detectedDelimiter = useMemo(() => {
    if (delimiter !== 'auto' || !input.trim()) return null;
    const d = detectDelimiter(input);
    const labelMap: Record<string, string> = { ',': 'comma', '\t': 'tab', ';': 'semicolon', '|': 'pipe' };
    return labelMap[d] || d;
  }, [input, delimiter]);

  // Auto-select first header as conflict column
  useEffect(() => {
    if (parsed.headers.length > 0 && !parsed.headers.includes(conflictColumn)) {
      setConflictColumn(parsed.headers[0]);
    }
  }, [parsed.headers]);

  // Warn on large CSV
  useEffect(() => {
    if (parsed.rows.length > MAX_ROWS_WARNING) {
      toast.warning(`CSV has ${parsed.rows.length.toLocaleString()} rows. This may be slow.`);
    }
  }, [parsed.rows.length]);

  const handleGenerate = useCallback(() => {
    if (!input.trim()) {
      toast.error('Please enter CSV data');
      return;
    }
    if (parsed.headers.length === 0) {
      toast.error('Could not parse CSV headers');
      return;
    }
    if ((action === 'upsert' || action === 'update') && !conflictColumn) {
      toast.error('Please select a key column');
      return;
    }

    try {
      const sql = generateSql({
        action,
        table: tableName || 'my_table',
        schema: schemaName,
        headers: parsed.headers,
        rows: parsed.rows,
        dialect,
        treatEmptyAsNull,
        treatNullStringAsNull,
        batchSize,
        conflictColumn,
        quoteIdentifiers,
      });
      setOutput(sql);
      toast.success(`${actionLabels[action]} generated!`);
    } catch (e) {
      toast.error('Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  }, [input, parsed, action, tableName, schemaName, dialect, treatEmptyAsNull, treatNullStringAsNull, batchSize, conflictColumn, quoteIdentifiers]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
  }, []);

  const handleDownload = useCallback(() => {
    if (!output) {
      toast.error('Nothing to download');
      return;
    }
    downloadFile(output, `${tableName || 'output'}.sql`, 'application/sql');
  }, [output, tableName]);

  const handleLoadSample = useCallback(() => {
    setInput(sampleCsv);
    toast.success('Sample CSV loaded');
  }, []);

  // File upload handler
  const handleFile = useCallback((file: File) => {
    if (!file.name.match(/\.(csv|tsv|txt)$/i)) {
      toast.error('Please upload a CSV, TSV, or TXT file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInput(text);
      toast.success(`Loaded ${file.name}`);
    };
    reader.onerror = () => toast.error('Failed to read file');
    reader.readAsText(file);
  }, []);

  // Drag-and-drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  const handleDragLeave = useCallback(() => setIsDragOver(false), []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  // Ctrl+Enter shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleGenerate]);

  const needsKeyColumn = action === 'upsert' || action === 'update';

  return (
    <ToolLayout
      title="CSV to SQL"
      tagline="Convert CSV data to SQL statements with dialect support"
      metaDescription="Convert CSV data to SQL INSERT, CREATE TABLE, UPSERT, and UPDATE statements. Supports MySQL, PostgreSQL, and SQLite dialects."
    >
      <Card hover={false} className="h-[calc(100vh-210px)] min-h-152 flex flex-col">
        {/* Toolbar */}
        <div className="shrink-0 px-4 pt-3 pb-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Action buttons */}
            {(Object.keys(actionLabels) as SqlAction[]).map((a) => (
              <Button
                key={a}
                variant={action === a ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setAction(a)}
              >
                {actionLabels[a]}
              </Button>
            ))}

            <div className="hidden sm:block w-px h-6 bg-gray-300/50 dark:bg-gray-600/50 mx-0.5" />

            {/* Schema + Table name */}
            <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <input
                value={schemaName}
                onChange={(e) => setSchemaName(e.target.value)}
                placeholder="schema"
                className={`${selectClass} w-20 font-mono`}
              />
              .
              <input
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="table_name"
                className={`${selectClass} w-28 font-mono`}
              />
            </label>

            {/* Dialect */}
            <SegmentedControl
              options={dialectLabels}
              value={dialect}
              onChange={(v) => setDialect(v as SqlDialect)}
              variant="glass"
            />

            <div className="hidden sm:block w-px h-6 bg-gray-300/50 dark:bg-gray-600/50 mx-0.5" />

            {/* Delimiter */}
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value as Delimiter | 'auto')}
              className={selectClass}
            >
              {delimiterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {detectedDelimiter && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                (detected: {detectedDelimiter})
              </span>
            )}

            {/* Checkboxes */}
            <Checkbox
              checked={hasHeaders}
              onChange={setHasHeaders}
              label="Headers"
              className="text-xs text-gray-500 dark:text-gray-400 gap-1.5"
            />
            <Checkbox
              checked={treatEmptyAsNull}
              onChange={setTreatEmptyAsNull}
              label="Empty = NULL"
              className="text-xs text-gray-500 dark:text-gray-400 gap-1.5"
            />
            <Checkbox
              checked={treatNullStringAsNull}
              onChange={setTreatNullStringAsNull}
              label="NULL → NULL"
              className="text-xs text-gray-500 dark:text-gray-400 gap-1.5"
            />
            <Checkbox
              checked={quoteIdentifiers}
              onChange={setQuoteIdentifiers}
              label="Quote names"
              className="text-xs text-gray-500 dark:text-gray-400 gap-1.5"
            />

            {/* Batch size (only for batch insert) */}
            {action === 'batch-insert' && (
              <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                Batch:
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={batchSize}
                  onChange={(e) => setBatchSize(Math.max(1, parseInt(e.target.value) || 1))}
                  className={`${selectClass} w-16 font-mono`}
                />
              </label>
            )}

            {/* Conflict/key column (for upsert & update) */}
            {needsKeyColumn && parsed.headers.length > 0 && (
              <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                Key:
                <select
                  value={conflictColumn}
                  onChange={(e) => setConflictColumn(e.target.value)}
                  className={selectClass}
                >
                  {parsed.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="hidden sm:block w-px h-6 bg-gray-300/50 dark:bg-gray-600/50 mx-0.5" />

            {/* Generate */}
            <Button size="sm" onClick={handleGenerate} title="Generate SQL (Ctrl+Enter)">
              Generate
            </Button>

            {/* Utility buttons */}
            <CopyButton text={output} label="Copy" size="sm" />
            <SecondaryButton onClick={handleDownload} title="Download .sql">
              <Download size={14} />
            </SecondaryButton>
            <SecondaryButton onClick={handleLoadSample} title="Load sample CSV">
              <Table size={14} />
            </SecondaryButton>
            <SecondaryButton onClick={handleClear}>
              <Eraser size={14} />
            </SecondaryButton>
          </div>
        </div>

        {/* Editor panels */}
        <div className="p-4 flex-1 min-h-0 flex flex-col">
          <ResizablePanels
            left={
              <div className="flex flex-col min-h-0 h-full gap-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    CSV Input
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <Upload size={11} /> Upload file
                    </button>
                    <button
                      onClick={() => setShowPreview((v) => !v)}
                      className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title={showPreview ? 'Hide preview' : 'Show preview'}
                    >
                      {showPreview ? <EyeOff size={11} /> : <Eye size={11} />}
                      Preview
                    </button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                    e.target.value = '';
                  }}
                />
                <div
                  className={`flex-1 min-h-0 flex flex-col ${isDragOver ? 'ring-2 ring-blue-400 rounded-xl' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Paste CSV data here, upload a file, or drag & drop...\n\nExample:\nid,name,email,age\n1,John,john@example.com,30\n2,Jane,jane@example.com,25`}
                    className={`${inputClass} ${showPreview && parsed.headers.length > 0 ? 'flex-2' : 'flex-1'}`}
                  />
                </div>
                {/* CSV Preview */}
                {showPreview && parsed.headers.length > 0 && (
                  <div className="shrink-0">
                    <CsvPreviewTable headers={parsed.headers} rows={parsed.rows} />
                  </div>
                )}
              </div>
            }
            right={
              <div className="flex flex-col min-h-0 h-full">
                <label className="shrink-0 block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  SQL Output
                </label>
                <textarea value={output} readOnly className={outputClass} />
              </div>
            }
          />
        </div>
      </Card>

      {/* Collapsible info */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-2 ml-1"
      >
        <Table size={14} />
        About this tool
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${showInfo ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card hover={false}>
              <div className="p-5">
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div>
                    <p className="mb-3 leading-relaxed">
                      Convert CSV (Comma-Separated Values) data into SQL statements. Supports multiple SQL dialects
                      with auto-type inference, delimiter detection, and batch operations.
                    </p>
                    <ul className="space-y-1.5">
                      {[
                        'CREATE TABLE with auto-type detection',
                        'Single & batch INSERT statements',
                        'UPSERT (ON CONFLICT / ON DUPLICATE KEY)',
                        'UPDATE with WHERE clause',
                        'MySQL, PostgreSQL & SQLite dialects',
                        'Schema-qualified table names',
                        'Optional identifier quoting',
                        'NULL literal recognition',
                        'Delimiter auto-detection',
                        'Drag & drop CSV file upload',
                        'CSV data preview table',
                        'Download as .sql file',
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="text-green-500 text-xs">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/30 dark:bg-gray-900/30 rounded-lg p-3 border border-white/50 dark:border-gray-700/50">
                      <h4 className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">CSV Input</h4>
                      <pre className="text-[10px] font-mono text-gray-500 dark:text-gray-400 leading-relaxed">{`id,name,age
1,John,30
2,Jane,25`}</pre>
                    </div>
                    <div className="bg-white/30 dark:bg-gray-900/30 rounded-lg p-3 border border-white/50 dark:border-gray-700/50">
                      <h4 className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">SQL Output</h4>
                      <pre className="text-[10px] font-mono text-gray-500 dark:text-gray-400 break-all leading-relaxed">{`INSERT INTO users
  (id, name, age)
VALUES
  ('1', 'John', '30');`}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </ToolLayout>
  );
}


