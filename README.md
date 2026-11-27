# DevTools

A collection of free, browser-based web developer utilities built with **React + Vite**.

## Tech Stack

- **React 19** + **Vite** — Fast dev/build tooling
- **Tailwind CSS v4** — Utility-first styling
- **React Router DOM** — Client-side routing with lazy loading
- **Lucide React** — Beautiful, consistent icons
- **Framer Motion** — Smooth animations and transitions
- **Sonner** — Toast notifications
- **React Helmet Async** — Per-route SEO meta tags
- **Tesseract.js** — Client-side OCR for Image-to-Text
- **Recharts** — Charts for Network Status statistics
- **yaml** — YAML parsing / serialisation for YAML ↔ JSON
- **diff** (jsdiff) — Myers diff for Text Diff
- **sql-formatter** — dialect-aware SQL formatting
- **marked** + **DOMPurify** — markdown rendering and HTML sanitising
- **cronstrue** — plain-English cron descriptions

## Available Tools

| Tool | Route | Description |
|------|-------|-------------|
| JSON Formatter | `/tools/json-formatter` | Format, minify, stringify/parse JSON + Java DTO to JSON |
| Image to Text | `/tools/image-to-text` | OCR-based text extraction from images |
| Encoder/Decoder | `/tools/encoder-decoder` | Base64, URL, HTML, Hex encoding/decoding |
| URL Parser | `/tools/url-parser` | URL encode/decode |
| Color Picker | `/tools/color-picker` | HEX/RGB/HSL picker with palette management |
| Network Status | `/tools/network-status` | Real-time network monitoring with history |
| UUID Generator | `/tools/uuid-generator` | v4 and time-based UUIDs with formatting options |
| Gzip Converter | `/tools/gzip-converter` | Gzip compress / decompress (Base64) with partial recovery |
| CSV to SQL | `/tools/csv-to-sql` | CSV to `CREATE TABLE` / `INSERT` for MySQL, PostgreSQL and SQLite |
| HTML Preview | `/tools/html-preview` | Online HTML editor & viewer with live/on-click rendering, device sizes and console |
| JWT Decoder | `/tools/jwt-decoder` | Decode JWTs, show expiry, verify HS/RS/PS/ES signatures with a secret or public key |
| Unix Timestamp Converter | `/tools/timestamp-converter` | Epoch (s/ms/µs/ns) ↔ ISO 8601, RFC 2822 and any time zone, with a live clock |
| Hash Generator | `/tools/hash-generator` | MD5, SHA-1/256/384/512, CRC32 and HMAC for text or files, with checksum comparison |
| Regex Tester | `/tools/regex-tester` | Live match highlighting, capture/named groups, replace preview, presets and cheat sheet |
| YAML ↔ JSON | `/tools/yaml-json` | Two-way conversion with anchors, merge keys, multi-document streams and error locations |
| JSON to Types | `/tools/json-to-types` | TypeScript, Go, Java, Kotlin, Python and Rust types from sample JSON (optional/nullable detection) |
| Text Diff | `/tools/text-diff` | Side-by-side / inline diff with word or character highlights, ignore options and unified patch |
| Case Converter & Text Utils | `/tools/text-utils` | 13 case styles, line sort/dedupe/trim/number, slugify, and live character/word/byte counts |
| Password & Lorem Ipsum Generator | `/tools/password-generator` | Crypto-random passwords with entropy/strength meter; lorem ipsum words, sentences or paragraphs |
| Number Base Converter | `/tools/base-converter` | Binary/octal/decimal/hex/base 2–36 with BigInt precision and two's complement views |
| SQL Formatter | `/tools/sql-formatter` | Format (16 dialects, keyword case, tabular layouts) or minify SQL |
| Markdown Preview | `/tools/markdown-preview` | GFM editor with sanitised live preview, light/dark, TOC copy and .md/.html export |
| Cron Expression Helper | `/tools/cron-parser` | Plain-English cron descriptions, per-field editor, presets/macros and next run times |
| Chmod Calculator | `/tools/chmod-calculator` | Permission checkboxes ↔ octal ↔ symbolic, special bits, chmod expressions and commands |
| Subnet / CIDR Calculator | `/tools/cidr-calculator` | IPv4/IPv6 network, broadcast, host range, masks; subnet splitting and range → CIDR |
| HTTP Status Codes & MIME Types | `/tools/http-reference` | Searchable status code (1xx–5xx) and Content-Type reference |
| CSS Gradient & Shadow Generator | `/tools/css-generator` | Visual linear/radial/conic gradients and layered box shadows with CSS + Tailwind output |

## Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Testing

```bash
npm test          # run once
npm run test:watch
```

Unit tests (Vitest) live next to the pure logic in `src/lib/*.test.ts`.

## Building

```bash
npm run build
```

Creates a `dist` directory with production-optimized assets.

## Deployment

```bash
npm run deploy
```

Builds and deploys to Firebase Hosting.

### First-time Firebase setup

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting` (set `dist` as public directory)

## Project Structure

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Routes, generated from tools.ts
├── tools.ts                    # Tool registry: metadata, category, lazy page
├── index.css                   # Tailwind imports + theme
├── components/
│   ├── layout/                 # Footer, ToolLayout
│   └── ui/                     # Card, Button, TextArea, Tabs, CopyButton, ...
├── hooks/                      # useLocalStorage, useTheme
├── lib/                        # Pure logic per tool (*-utils.ts) + tests
└── pages/
    ├── HomePage.tsx
    ├── NotFoundPage.tsx
    └── tools/                  # One folder (or file) per tool page
```

## Adding a Tool

1. Put the logic in `src/lib/<tool>-utils.ts` (no React) and test it in `src/lib/<tool>-utils.test.ts`.
2. Build the page in `src/pages/tools/<tool>/<Tool>Page.tsx` using `ToolLayout` and the shared UI components.
3. Add one entry to `src/tools.ts` — the route and the home page card come from it.
4. Add a row to the table above.
