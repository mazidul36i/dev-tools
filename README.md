# DevTools

A collection of free, browser-based web developer utilities built with **React + Vite**.

Everything runs in the browser. The app works like a small IDE:
- A sidebar with Favorites, Recent and every category.
- A command palette (**Ctrl/⌘ K**).
- The same input → options → output workspace in every tool.
- Shareable links: tool options are kept in the URL, and **Share** adds your input to the link on request.

### Keyboard shortcuts

| Keys | Action |
|------|--------|
| `Ctrl/⌘ K` | Command palette: jump to a tool or run an action |
| `/` | Focus search (home page, reference pages, or the sidebar filter) |
| `Ctrl/⌘ Enter` | Run / regenerate in tools that have a Run button |
| `?` | Show all shortcuts |

## Tech Stack

- **React 19** + **Vite** — Fast dev/build tooling
- **Tailwind CSS v4** — Utility-first styling; design tokens in `src/index.css`
- **Inter** + **JetBrains Mono** — self-hosted variable fonts (`@fontsource-variable`)
- **React Router DOM** — Client-side routing with lazy loading
- **Lucide React** — Beautiful, consistent icons
- **Framer Motion** — Smooth animations and transitions
- **Sonner** — Toast notifications
- **React Helmet Async** — Per-route SEO meta tags
- **Tesseract.js** — Client-side OCR for Image-to-Text
- **yaml** — YAML parsing / serialisation for YAML ↔ JSON
- **diff** (jsdiff) — Myers diff for Text Diff
- **sql-formatter** — dialect-aware SQL formatting
- **marked** + **DOMPurify** — markdown rendering and HTML sanitising
- **cronstrue** — plain-English cron descriptions
- **qrcode** + **jsQR** — QR code generation and decoding

## Available Tools

| Tool | Route | Description |
|------|-------|-------------|
| JSON Formatter | `/json-formatter` | Format, minify, stringify/parse JSON + Java DTO to JSON |
| Image to Text | `/image-to-text` | OCR-based text extraction from images |
| Encoder/Decoder | `/encoder-decoder` | Base64, URL, HTML, Hex encoding/decoding |
| URL Parser | `/url-parser` | URL parts, editable query parameters, percent-encode/decode |
| Color Picker | `/color-picker` | HEX/RGB/HSL picker with palette management |
| Network Status | `/network-status` | Real-time network monitoring with history |
| UUID Generator | `/uuid-generator` | v4 and v7 (RFC 9562) UUIDs in bulk, formatting options, UUID inspector |
| Gzip Converter | `/gzip-converter` | Gzip compress / decompress (Base64) with partial recovery |
| CSV to SQL | `/csv-to-sql` | CSV to `CREATE TABLE` / `INSERT` for MySQL, PostgreSQL and SQLite |
| HTML Preview | `/html-preview` | Online HTML editor & viewer with live/on-click rendering, device sizes and console |
| JWT Decoder | `/jwt-decoder` | Decode JWTs, show expiry, verify HS/RS/PS/ES signatures with a secret or public key |
| Unix Timestamp Converter | `/timestamp-converter` | Epoch (s/ms/µs/ns) ↔ ISO 8601, RFC 2822 and any time zone, with a live clock |
| Hash Generator | `/hash-generator` | MD5, SHA-1/256/384/512, CRC32 and HMAC for text or files, with checksum comparison |
| Regex Tester | `/regex-tester` | Live match highlighting, capture/named groups, replace preview, presets and cheat sheet |
| YAML ↔ JSON | `/yaml-json` | Two-way conversion with anchors, merge keys, multi-document streams and error locations |
| JSON to Types | `/json-to-types` | TypeScript, Go, Java, Kotlin, Python and Rust types from sample JSON (optional/nullable detection) |
| Text Diff | `/text-diff` | Side-by-side / inline diff with word or character highlights, ignore options and unified patch |
| Case Converter & Text Utils | `/text-utils` | 13 case styles, line sort/dedupe/trim/number, slugify, and live character/word/byte counts |
| Password & Lorem Ipsum Generator | `/password-generator` | Crypto-random passwords with entropy/strength meter; lorem ipsum words, sentences or paragraphs |
| Number Base Converter | `/base-converter` | Binary/octal/decimal/hex/base 2–36 with BigInt precision and two's complement views |
| SQL Formatter | `/sql-formatter` | Format (16 dialects, keyword case, tabular layouts) or minify SQL |
| Markdown Preview | `/markdown-preview` | GFM editor with sanitised live preview, light/dark, TOC copy and .md/.html export |
| Cron Expression Helper | `/cron-parser` | Plain-English cron descriptions, per-field editor, presets/macros and next run times |
| Chmod Calculator | `/chmod-calculator` | Permission checkboxes ↔ octal ↔ symbolic, special bits, chmod expressions and commands |
| Subnet / CIDR Calculator | `/cidr-calculator` | IPv4/IPv6 network, broadcast, host range, masks; subnet splitting and range → CIDR |
| HTTP Status Codes & MIME Types | `/http-reference` | Searchable status code (1xx–5xx) and Content-Type reference |
| CSS Gradient & Shadow Generator | `/css-generator` | Visual linear/radial/conic gradients and layered box shadows with CSS + Tailwind output |
| Image Compressor & Converter | `/image-converter` | Bulk compress/resize/convert to WebP, AVIF, JPEG, PNG; image ↔ Base64 data URI |
| QR Code Generator & Reader | `/qr-code` | QR codes for text/URL, Wi-Fi, email, phone, SMS, vCard (PNG/SVG); decode from image or camera |

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

```bash
npm run e2e       # Playwright: builds, serves dist and runs Chromium
```

The end-to-end suite in `e2e/` runs on every pull request. It checks:

- **Accessibility:** axe-core (WCAG 2.2 AA plus best practice) on every route, in light and dark.
- **Console:** no console errors on any route.
- **Flows:** the command palette, keyboard shortcuts, favourites and recents, URL options, share links, and that secrets never reach the URL.
- **Phone layout:** no horizontal overflow at phone width.

Routes come from `src/tools.ts`, so a new tool is covered automatically. Run `npx playwright install chromium` once before the first local run.

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
├── App.tsx                     # Routes inside the AppShell layout (/:slug resolved via tools.ts)
├── tools.ts                    # Tool registry: metadata, category, lazy page
├── index.css                   # Tailwind imports + design tokens (light/dark)
├── components/
│   ├── shell/                  # AppShell, SidebarNav, Topbar, CommandPalette, ShortcutsDialog
│   ├── layout/                 # ToolLayout: tool header, actions, About, related tools
│   ├── workspace/              # Panel, Toolbar, SplitPane, EditorPanel, OutputPanel, ResultRows, …
│   └── ui/                     # Button, Badge, Checkbox, CodeBlock, CopyButton, Dialog, …
├── hooks/                      # useUrlOptions, useShareInput, useToolPrefs, useHotkeys, useTheme, …
├── lib/                        # Pure logic per tool (*-utils.ts), url-state, prefs + tests
└── pages/
    ├── HomePage.tsx
    ├── NotFoundPage.tsx
    └── tools/                  # One folder (or file) per tool page
```

## Adding a Tool

1. Put the logic in `src/lib/<tool>-utils.ts` (no React) and test it in `src/lib/<tool>-utils.test.ts`.
2. Add one entry to `src/tools.ts`. The route, sidebar entry, palette entry and home card all come from it.
3. Build the page in `src/pages/tools/<tool>/<Tool>Page.tsx`:
   - Wrap it in `ToolLayout`. Title, icon and description come from the registry; pass `about` for the "About" section.
   - Pick a variant that matches the tool:
     - `workspace`: editors and split panes; fills the screen.
     - `page`: calculators, generators and references.
     - `wide`: long side-by-side results.
   - Compose it from `@components/workspace`:
     - `Toolbar` for options.
     - `SplitPane` with `EditorPanel` / `OutputPanel` for text → text tools.
     - `Panel` + `ResultRows` for labelled results.
     - Errors go in `ErrorNotice`, inline, not as toasts.
   - Declare options with `opt.*` from `@lib/url-state` and read them with `useUrlOptions(schema)`. They stay in the query string, so **Copy link** reproduces the setup.
   - To let users share their input, call `useShareInput({ input }, apply)`. **Never put secrets (keys, tokens, passwords) in either the URL schema or the share fields.**
4. Add a row to the table above.
