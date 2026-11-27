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
