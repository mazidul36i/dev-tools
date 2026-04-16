# DevTools Hub

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

## Available Tools

| Tool | Route | Description |
|------|-------|-------------|
| JSON Formatter | `/tools/json-formatter` | Format, minify, stringify/parse JSON + Java DTO to JSON |
| Image to Text | `/tools/image-to-text` | OCR-based text extraction from images |
| Encoder/Decoder | `/tools/encoder-decoder` | Base64, URL, HTML, Hex encoding/decoding |
| URL Parser | `/tools/url-parser` | URL encode/decode |
| Color Picker | `/tools/color-picker` | HEX/RGB/HSL picker with palette management |
| Network Status | `/tools/network-status` | Real-time network monitoring with history |

## Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

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
├── main.jsx                    # Entry point
├── App.jsx                     # Route definitions (lazy loaded)
├── index.css                   # Tailwind imports + theme
├── components/
│   ├── layout/                 # Header, Footer, ToolLayout
│   └── ui/                     # Card, Tabs, CopyButton, Spinner
├── hooks/                      # useLocalStorage
├── lib/                        # Pure utility functions
│   ├── json-utils.js           # JSON format/minify/DTO parsing
│   ├── color-utils.js          # HEX/RGB/HSL conversions
│   └── encoder-utils.js        # Base64/URL/HTML/Hex encoding
└── pages/
    ├── HomePage.jsx
    ├── NotFoundPage.jsx
    └── tools/
        ├── json-formatter/     # JsonFormatterPage + JsonTreeView
        ├── color-picker/       # ColorPickerPage
        ├── network-status/     # NetworkStatusPage
        ├── EncoderDecoderPage.jsx
        ├── ImageToTextPage.jsx
        └── UrlParserPage.jsx
```
