# New Tools Roadmap

> **Instructions**: Review, reorder or strike tools as needed. When ready, ask to implement them one at a time (one tool = one branch = one PR, as with #10–#12).
> Status: ⬜ Todo | 🔄 In Progress | ✅ Done
>
> **Progress**: every task below is implemented (one commit per tool) on branch `ccr-87de8c4e-o89lnj`. All tools have unit tests for their logic in `src/lib/*.test.ts` (Vitest), and CI runs them on pull requests.

---

## How a tool is added today

Every existing tool touches the same places:

1. `src/lib/<tool>-utils.ts` — pure logic (no React), easy to unit-test later
2. `src/pages/tools/<tool>/<Tool>Page.tsx` (+ sub-components) — built on `ToolLayout`, `Card`, `InfoCard`, `TextAreaInput/Output`, `CopyButton`, `SegmentedControl`, `Button`s, `sonner` toasts
3. `src/App.tsx` — a `lazy()` import and a `<Route>`
4. `src/pages/HomePage.tsx` — an entry in the `tools` array (icon, colours, title, description)
5. `README.md` — a row in the "Available Tools" table

**Rules for every new tool**
- 100% client-side; nothing is uploaded anywhere.
- Prefer no new dependency. When one is needed, keep it small and only imported inside the lazy-loaded page so the home bundle doesn't grow.
- Works in light and dark mode and on mobile widths.
- Has `metaDescription` (and `seoTitle` when useful) for SEO, and an `InfoCard` explaining usage.
- `npm run build` passes with no TypeScript errors.

---

## Phase 0: Groundwork (do first — makes 15+ new tools manageable)

### Task 0.1 ✅ — Central tool registry
- **What**: Tool metadata is duplicated between `App.tsx` and `HomePage.tsx`, and the README table is already stale (UUID Generator, Gzip Converter and CSV to SQL are missing).
- **Action**: Create `src/tools.ts` exporting one array `{ slug, title, desc, icon, color, bg, category, component: lazy(...) }`. `App.tsx` maps it to routes; `HomePage.tsx` maps it to cards. Adding a tool then means 1 registry entry + the page itself. Bring the README table up to date.

### Task 0.2 ✅ — Search + category filter on the home page
- **What**: At 25+ tools a flat grid gets hard to scan.
- **Action**: Add a search box (matches title/description) and category chips: *Formatters*, *Encoders & Crypto*, *Converters*, *Generators*, *Text*, *Web & Network*, *Images*. Optional: `/` keyboard shortcut to focus search.

### Task 0.3 ✅ — Reusable `ToolIO` panel (optional)
- **What**: Most text tools are "input → action buttons → output" with Clear/Paste/Copy/Download (see `GzipConverterPage`).
- **Action**: Extract that shell into `src/components/ui/ToolIO.tsx` so simple tools are ~50 lines.

---

## Phase 1: Quick wins (no new dependencies, high everyday use)

### Task 1.1 ✅ — JWT Decoder — `/tools/jwt-decoder`
- Decode header & payload into pretty JSON (reuse `HighlightedOutput`), show `exp`/`iat`/`nbf` as human dates with an "expired / valid for X" badge.
- Optional HS256/384/512 signature verification with a user-entered secret via WebCrypto.

### Task 1.2 ✅ — Hash Generator — `/tools/hash-generator`
- SHA-1/256/384/512 via `crypto.subtle.digest`, for text and dropped files; HMAC mode with a key.
- MD5 needs a tiny inline implementation (not in WebCrypto) — show it but label it "not secure".

### Task 1.3 ✅ — Unix Timestamp Converter — `/tools/timestamp-converter`
- Live "now" clock; seconds ↔ milliseconds auto-detect; convert to ISO 8601, UTC, local, relative ("3 hours ago"); date picker → timestamp. All via `Intl`/`Date`.

### Task 1.4 ✅ — Regex Tester — `/tools/regex-tester`
- Pattern + flags (`g i m s u y`), live match highlighting, capture-group table, replace preview, a small cheat-sheet in the `InfoCard`.

### Task 1.5 ✅ — Case Converter & Text Utilities — `/tools/text-utils`
- camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, Title Case, slugify; sort/dedupe/trim lines; character/word/line/byte counts.

### Task 1.6 ✅ — Password & Lorem Ipsum Generator — `/tools/password-generator`
- `crypto.getRandomValues`, length & character-set options, entropy/strength meter, bulk generation. Lorem ipsum as a second tab (or a separate tool).

### Task 1.7 ✅ — Number Base Converter — `/tools/base-converter`
- Binary / octal / decimal / hex / custom base, using `BigInt` for big numbers; bit-length and two's-complement view.

---

## Phase 2: Format converters & formatters (small, well-known deps)

### Task 2.1 ✅ — YAML ↔ JSON — `/tools/yaml-json` — dep: `yaml`
- Two-way conversion with error line numbers; reuse JSON indent options.

### Task 2.2 ✅ — JSON → Types — `/tools/json-to-types` — no dep
- Generate TypeScript interfaces, Go structs, Java classes / Kotlin data classes, Python dataclasses from sample JSON. Natural inverse of the existing "Java DTO → JSON" tab; builds on `src/lib/json-utils.ts`.

### Task 2.3 ✅ — Text Diff — `/tools/text-diff` — dep: `diff`
- Side-by-side and inline views, word/line granularity, ignore whitespace/case. Reuse `ResizablePanels`.

### Task 2.4 ✅ — SQL Formatter — `/tools/sql-formatter` — dep: `sql-formatter`
- Dialect selector shared with CSV to SQL (MySQL, PostgreSQL, SQLite…), keyword case, indent, minify.

### Task 2.5 ✅ — Markdown Preview — `/tools/markdown-preview` — deps: `marked`, `dompurify`
- Live split view reusing `PreviewFrame` from HTML Preview; export rendered HTML.

### Task 2.6 ✅ — Cron Expression Helper — `/tools/cron-parser` — dep: `cronstrue` (or hand-written)
- Plain-English description, next 10 run times in local/UTC, a field-by-field builder.

---

## Phase 3: Richer / visual tools

### Task 3.1 ✅ — QR Code Generator & Reader — `/tools/qr-code` — dep: `qrcode` (+ `jsqr` fallback)
- Generate (size, error-correction, colours, PNG/SVG download); read from image/paste/camera via `BarcodeDetector` where supported.

### Task 3.2 ✅ — Image Compressor & Converter — `/tools/image-converter` — no dep
- Canvas-based resize, quality slider, PNG/JPEG/WebP output, before/after size; also "image ↔ Base64 data URI" (pairs with Encoder/Decoder).

### Task 3.3 ✅ — CSS Gradient & Box-Shadow Generator — `/tools/css-generator` — no dep
- Visual editors with live preview and copyable CSS/Tailwind output; reuse `color-utils.ts` and the Color Picker's palette.

### Task 3.4 ✅ — Subnet / CIDR Calculator — `/tools/cidr-calculator` — no dep
- Network/broadcast address, host range, mask, host count; IPv4 first, IPv6 later. Fits next to Network Status.

### Task 3.5 ✅ — Chmod Calculator — `/tools/chmod-calculator` — no dep
- Checkbox grid ↔ octal ↔ symbolic (`rwxr-xr-x`).

### Task 3.6 ✅ — HTTP Status Codes & MIME Reference — `/tools/http-reference` — no dep
- Searchable static tables with short explanations.

---

## Suggested order

1. Phase 0.1 (registry) — small, removes friction for everything after it.
2. JWT Decoder → Timestamp Converter → Hash Generator → Regex Tester (most-searched dev utilities).
3. YAML ↔ JSON, JSON → Types, Text Diff.
4. Phase 0.2 (search/categories) once the tool count passes ~20.
5. Remaining tools by interest.

## Decisions taken

- All listed tools were built; small, well-known dependencies were used where noted (`yaml`, `diff`, `sql-formatter`, `marked` + `dompurify`, `cronstrue`, `qrcode` + `jsqr`) and are only loaded by their own lazy page.
- Vitest was added in Phase 0 and runs in the PR workflow.
- Tool routing is a single `/tools/:slug` route resolved from `src/tools.ts`, loaded lazily so the registry and its icons stay out of the first-load bundle.
