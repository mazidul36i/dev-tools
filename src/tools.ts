import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import {
  FileJson2, Image, RefreshCw, Link2, Palette, Wifi, Fingerprint, FileArchive, Table, Code2,
  ShieldCheck, Clock, Hash, Regex, FileCode2, Braces, GitCompare, CaseSensitive, KeyRound, Binary, Database, FileText, Timer,
  type LucideIcon,
} from 'lucide-react';

export type ToolCategory =
  | 'Formatters'
  | 'Encoders & Crypto'
  | 'Converters'
  | 'Generators'
  | 'Text'
  | 'Web & Network'
  | 'Images';

export const toolCategories: ToolCategory[] = [
  'Formatters',
  'Encoders & Crypto',
  'Converters',
  'Generators',
  'Text',
  'Web & Network',
  'Images',
];

export interface ToolDefinition {
  /** URL segment under `/tools/`. */
  slug: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  /** Tailwind text colour class for the icon. */
  color: string;
  /** Tailwind background classes for the icon tile. */
  bg: string;
  category: ToolCategory;
  /** Extra words matched by the home page search. */
  keywords?: string[];
  component: LazyExoticComponent<ComponentType>;
}

/**
 * Single source of truth for every tool: `App.tsx` builds routes from it and
 * `HomePage.tsx` builds the tool grid from it. To add a tool, create its page
 * and add one entry here.
 */
export const tools: ToolDefinition[] = [
  {
    slug: 'json-formatter',
    title: 'JSON Formatter',
    desc: 'Format, validate and beautify JSON data with a modern interface',
    icon: FileJson2, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30',
    category: 'Formatters',
    keywords: ['beautify', 'minify', 'validate', 'dto', 'tree'],
    component: lazy(() => import('@pages/tools/json-formatter/JsonFormatterPage')),
  },
  {
    slug: 'image-to-text',
    title: 'Image to Text Convert',
    desc: 'Extract text from images using OCR technology. Supports multiple formats with drag & drop, paste, or upload.',
    icon: Image, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    category: 'Images',
    keywords: ['ocr', 'tesseract', 'extract'],
    component: lazy(() => import('@pages/tools/ImageToTextPage')),
  },
  {
    slug: 'encoder-decoder',
    title: 'Encoder/Decoder',
    desc: 'Convert data between various encoding formats including Base64, URL, HTML, and Hex',
    icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30',
    category: 'Encoders & Crypto',
    keywords: ['base64', 'hex', 'html entities', 'url encode'],
    component: lazy(() => import('@pages/tools/EncoderDecoderPage')),
  },
  {
    slug: 'url-parser',
    title: 'URL Parser',
    desc: 'Encode and decode URLs with a modern interface. Handle complex URLs with special characters safely.',
    icon: Link2, color: 'text-violet-500', bg: 'bg-violet-100 dark:bg-violet-900/30',
    category: 'Encoders & Crypto',
    keywords: ['url encode', 'url decode', 'percent encoding'],
    component: lazy(() => import('@pages/tools/UrlParserPage')),
  },
  {
    slug: 'color-picker',
    title: 'Color Picker',
    desc: 'Pick colors and convert between formats (HEX, RGB, HSL) with live preview',
    icon: Palette, color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-900/30',
    category: 'Converters',
    keywords: ['hex', 'rgb', 'hsl', 'palette'],
    component: lazy(() => import('@pages/tools/color-picker/ColorPickerPage')),
  },
  {
    slug: 'network-status',
    title: 'Network Status',
    desc: 'Monitor your network connection status in real-time with visual indicators and connection quality metrics',
    icon: Wifi, color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    category: 'Web & Network',
    keywords: ['online', 'offline', 'latency', 'speed'],
    component: lazy(() => import('@pages/tools/network-status/NetworkStatusPage')),
  },
  {
    slug: 'uuid-generator',
    title: 'UUID Generator',
    desc: 'Generate universally unique identifiers (v4 random & v1-like time-based) with customizable formatting options',
    icon: Fingerprint, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30',
    category: 'Generators',
    keywords: ['guid', 'unique id', 'random'],
    component: lazy(() => import('@pages/tools/uuid-generator/UuidGeneratorPage')),
  },
  {
    slug: 'gzip-converter',
    title: 'Gzip Converter',
    desc: 'Compress text to gzip or decompress base64-encoded gzip data with partial recovery support',
    icon: FileArchive, color: 'text-teal-500', bg: 'bg-teal-100 dark:bg-teal-900/30',
    category: 'Encoders & Crypto',
    keywords: ['compress', 'decompress', 'gunzip', 'deflate'],
    component: lazy(() => import('@pages/tools/gzip-converter/GzipConverterPage')),
  },
  {
    slug: 'csv-to-sql',
    title: 'CSV to SQL',
    desc: 'Convert CSV data to SQL statements with dialect support for MySQL, PostgreSQL, and SQLite',
    icon: Table, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    category: 'Converters',
    keywords: ['insert', 'create table', 'mysql', 'postgres', 'sqlite'],
    component: lazy(() => import('@pages/tools/csv-to-sql/CsvToSqlPage')),
  },
  {
    slug: 'html-preview',
    title: 'HTML Preview',
    desc: 'Online HTML editor & viewer with live or on-demand rendering, responsive device sizes and a built-in console',
    icon: Code2, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30',
    category: 'Web & Network',
    keywords: ['html editor', 'viewer', 'playground', 'css', 'javascript'],
    component: lazy(() => import('@pages/tools/html-preview/HtmlPreviewPage')),
  },
  {
    slug: 'jwt-decoder',
    title: 'JWT Decoder',
    desc: 'Decode JSON Web Tokens, check expiry and verify HMAC, RSA and ECDSA signatures locally',
    icon: ShieldCheck, color: 'text-fuchsia-500', bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
    category: 'Encoders & Crypto',
    keywords: ['json web token', 'bearer', 'oauth', 'claims', 'verify', 'hs256', 'rs256'],
    component: lazy(() => import('@pages/tools/jwt-decoder/JwtDecoderPage')),
  },
  {
    slug: 'timestamp-converter',
    title: 'Unix Timestamp Converter',
    desc: 'Convert Unix epoch timestamps to readable dates and back, in any time zone',
    icon: Clock, color: 'text-sky-500', bg: 'bg-sky-100 dark:bg-sky-900/30',
    category: 'Converters',
    keywords: ['epoch', 'unix time', 'date', 'iso 8601', 'timezone', 'milliseconds'],
    component: lazy(() => import('@pages/tools/timestamp-converter/TimestampConverterPage')),
  },
  {
    slug: 'hash-generator',
    title: 'Hash Generator',
    desc: 'Compute MD5, SHA-1, SHA-256/384/512 and CRC32 hashes or HMACs of text and files',
    icon: Hash, color: 'text-lime-600', bg: 'bg-lime-100 dark:bg-lime-900/30',
    category: 'Encoders & Crypto',
    keywords: ['md5', 'sha1', 'sha256', 'sha512', 'crc32', 'checksum', 'hmac', 'digest'],
    component: lazy(() => import('@pages/tools/hash-generator/HashGeneratorPage')),
  },
  {
    slug: 'regex-tester',
    title: 'Regex Tester',
    desc: 'Test JavaScript regular expressions with live highlighting, capture groups and replace preview',
    icon: Regex, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30',
    category: 'Text',
    keywords: ['regular expression', 'regexp', 'pattern', 'match', 'replace', 'capture group'],
    component: lazy(() => import('@pages/tools/regex-tester/RegexTesterPage')),
  },
  {
    slug: 'yaml-json',
    title: 'YAML ↔ JSON',
    desc: 'Convert YAML to JSON and back, with anchors, merge keys and multi-document support',
    icon: FileCode2, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    category: 'Converters',
    keywords: ['yml', 'convert', 'docker compose', 'kubernetes', 'config'],
    component: lazy(() => import('@pages/tools/yaml-json/YamlJsonPage')),
  },
  {
    slug: 'json-to-types',
    title: 'JSON to Types',
    desc: 'Generate TypeScript, Go, Java, Kotlin, Python or Rust types from sample JSON',
    icon: Braces, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30',
    category: 'Converters',
    keywords: ['typescript interface', 'go struct', 'java class', 'kotlin data class', 'python dataclass', 'rust serde', 'quicktype', 'dto'],
    component: lazy(() => import('@pages/tools/json-to-types/JsonToTypesPage')),
  },
  {
    slug: 'text-diff',
    title: 'Text Diff',
    desc: 'Compare two texts side by side or inline with word and character highlighting',
    icon: GitCompare, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30',
    category: 'Text',
    keywords: ['compare', 'difference', 'diff checker', 'patch', 'merge', 'changes'],
    component: lazy(() => import('@pages/tools/text-diff/TextDiffPage')),
  },
  {
    slug: 'text-utils',
    title: 'Case Converter & Text Utils',
    desc: 'Convert between camelCase, snake_case, kebab-case and more; sort, dedupe and count lines and words',
    icon: CaseSensitive, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30',
    category: 'Text',
    keywords: ['camelcase', 'snake case', 'kebab case', 'pascal case', 'title case', 'uppercase', 'lowercase', 'slug', 'word count', 'character count', 'sort lines', 'remove duplicates'],
    component: lazy(() => import('@pages/tools/text-utils/TextUtilsPage')),
  },
  {
    slug: 'password-generator',
    title: 'Password & Lorem Ipsum Generator',
    desc: 'Generate secure random passwords with a strength meter, or lorem ipsum placeholder text',
    icon: KeyRound, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    category: 'Generators',
    keywords: ['random password', 'secure', 'entropy', 'passphrase', 'lorem ipsum', 'placeholder text', 'dummy text'],
    component: lazy(() => import('@pages/tools/password-generator/PasswordGeneratorPage')),
  },
  {
    slug: 'base-converter',
    title: 'Number Base Converter',
    desc: 'Convert integers between binary, octal, decimal, hex and any base 2–36, with two’s complement',
    icon: Binary, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-200 dark:bg-slate-700/40',
    category: 'Converters',
    keywords: ['binary', 'octal', 'decimal', 'hexadecimal', 'hex to decimal', 'radix', 'twos complement', 'bigint'],
    component: lazy(() => import('@pages/tools/base-converter/BaseConverterPage')),
  },
  {
    slug: 'sql-formatter',
    title: 'SQL Formatter',
    desc: 'Format or minify SQL for MySQL, PostgreSQL, SQL Server, Oracle, BigQuery and more',
    icon: Database, color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    category: 'Formatters',
    keywords: ['sql beautifier', 'pretty print', 'mysql', 'postgres', 't-sql', 'query', 'minify sql'],
    component: lazy(() => import('@pages/tools/sql-formatter/SqlFormatterPage')),
  },
  {
    slug: 'markdown-preview',
    title: 'Markdown Preview',
    desc: 'Write GitHub-flavoured markdown with a live, sanitised preview and HTML export',
    icon: FileText, color: 'text-gray-700 dark:text-gray-200', bg: 'bg-gray-200 dark:bg-gray-700/40',
    category: 'Formatters',
    keywords: ['md', 'readme', 'editor', 'gfm', 'markdown to html', 'live preview'],
    component: lazy(() => import('@pages/tools/markdown-preview/MarkdownPreviewPage')),
  },
  {
    slug: 'cron-parser',
    title: 'Cron Expression Helper',
    desc: 'Explain cron schedules in plain English, edit fields and preview the next run times',
    icon: Timer, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30',
    category: 'Generators',
    keywords: ['crontab', 'schedule', 'cron job', 'next run', 'cron generator', 'cron explain'],
    component: lazy(() => import('@pages/tools/cron-parser/CronParserPage')),
  },
];

export const toolPath = (tool: Pick<ToolDefinition, 'slug'>) => `/tools/${tool.slug}`;
