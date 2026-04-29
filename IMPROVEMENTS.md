# Dev-Tools Codebase Improvements

> **Instructions**: Review and modify tasks as needed. When ready, ask to implement tasks one by one.
> Status: ⬜ Todo | 🔄 In Progress | ✅ Done

---

## Phase 1: Duplicate Code → Extract into Components

### Task 1 ✅ — Extract `BackgroundBlobs` component
- **What**: The identical 7-div gradient blob markup (light + dark mode) is copy-pasted in two files.
- **Files**: `HomePage.tsx` (L47–58), `ToolLayout.tsx` (L24–36)
- **Action**: Create `src/components/ui/BackgroundBlobs.tsx` and replace both copies with `<BackgroundBlobs />`.

### Task 2 ✅ — Extract `ThemeToggleButton` component
- **What**: The same `themeIcons` map, `useTheme()` call, and toggle `<button>` are repeated 3 times.
- **Files**: `HomePage.tsx` (L37–38, 88–94), `ToolLayout.tsx` (L9, 19–20, 73–79), `Header.tsx` (L7, 15–16, 53–60)
- **Action**: Create `src/components/ui/ThemeToggleButton.tsx` with optional `className`/`size` props; replace all 3 usages.

### Task 3 ✅ — Consolidate Footer into shared component
- **What**: 3 different inline footer variants with the same structure (copyright year + Home/GitHub links).
- **Files**: `Footer.tsx`, `ToolLayout.tsx` (L100–111), `HomePage.tsx` (L217–230)
- **Action**: Consolidate into one `Footer.tsx` with a `variant` prop (`compact` | `full`) to handle styling differences (text size, max-width, link set).

### Task 4 ✅ — Extract `InfoCard` wrapper component
- **What**: Every tool page has an identical info/about section wrapper: `<Card hover={false}><div className="p-7"><h2 className="...">title</h2>...`.
- **Files**: `EncoderDecoderPage.tsx`, `ImageToTextPage.tsx`, `UrlParserPage.tsx`, `ColorPickerPage.tsx`, `NetworkStatusPage.tsx`
- **Action**: Create `src/components/ui/InfoCard.tsx` with `title` + `children` props.

### Task 5 ✅ — Extract `Checkbox` component
- **What**: The same `<label><input type="checkbox" .../>` pattern is repeated ~10 times across pages.
- **Files**: `EncoderDecoderPage.tsx` (L125–136), `NetworkStatusPage.tsx` (L256–259), `JsonFormatterPage.tsx` (L377–382)
- **Action**: Create `src/components/ui/Checkbox.tsx` with `checked`, `onChange`, `label`, optional `className` props.

---

## Phase 2: Unused Code → Remove

### Task 7 ✅ — Migrate `NotFoundPage` to use shared components; delete standalone `Header.tsx`
- **What**: `Header.tsx` and `Footer.tsx` are only used by `NotFoundPage.tsx`. Every other page uses `ToolLayout` or inline layout.
- **Files**: `Header.tsx`, `Footer.tsx`, `NotFoundPage.tsx`
- **Action**: Refactor `NotFoundPage` to use `BackgroundBlobs` + `ThemeToggleButton` + `Footer`. Delete `Header.tsx`.

### Task 8 ✅ — Remove unused `ReactNode` import from `Spinner.tsx`
- **What**: `Spinner.tsx` imports `type ReactNode` but never uses it.
- **Files**: `src/components/ui/Spinner.tsx` (L2)
- **Action**: Remove `import { type ReactNode } from 'react';`.

### Task 9 ✅ — Merge duplicate `lucide-react` imports
- **What**: Two separate import statements from `lucide-react` in the same file.
- **Files**: `ToolLayout.tsx` (L4 + L7), `Header.tsx` (L2 + L5)
- **Action**: Merged into single imports; resolved as part of Tasks 2 & 7.

---

## Phase 3: Optimizations

### Task 10 ✅ — Extract `SegmentedControl` component for toggle buttons
- **What**: The same active/inactive toggle button group pattern is repeated 5 times with nearly identical styling.
- **Files**: `EncoderDecoderPage.tsx` (L79–91), `JsonFormatterPage.tsx` (L270–272, L351–353), `ColorPickerPage.tsx` (L196–198)
- **Action**: Create `src/components/ui/SegmentedControl.tsx` with `options`, `value`, `onChange`, `variant` props.

### Task 11 ✅ — Add `navigator.connection` type augmentation
- **What**: `navigator.connection` and `webkitAudioContext` lack TypeScript definitions, causing implicit `any`.
- **Files**: `NetworkStatusPage.tsx` (L72–80, L90)
- **Action**: Create `src/types/navigator.d.ts` with `NetworkInformation` interface and `Navigator`/`Window` augmentation.

### Task 12 ✅ — Wrap handlers in `useCallback` / `useMemo`
- **What**: Event handlers and derived values are recreated every render unnecessarily.
- **Files**: `ColorPickerPage.tsx` (L33, 61, 67, 80), `UrlParserPage.tsx`, `EncoderDecoderPage.tsx`
- **Action**: Wrap handlers in `useCallback`; wrap `getExportCode` → `exportCode` with `useMemo`.

### Task 13 ✅ — Replace blocking `window.confirm()` with toast-based confirmation
- **What**: `window.confirm()` blocks the UI thread and looks out of place in a modern app.
- **Files**: `NetworkStatusPage.tsx` (L186, L266)
- **Action**: Replaced with `sonner` action toasts for non-blocking confirmation flow.

---

## Low Priority / Optional

### Task 14 ⬜ — Extract `JsonTabPanel` sub-component in `JsonFormatterPage`
- **What**: The 4 tabs share an identical toolbar + 2-column layout. Extracting saves ~80 lines but adds a component.
- **Files**: `JsonFormatterPage.tsx`
- **Action**: Create a `JsonTabPanel` that accepts action button, input/output props.

### Task 15 ⬜ — Narrow `formatJSON` indent type
- **What**: `indent: number | string` could be `indent: number | 'tab'` for better type safety.
- **Files**: `src/lib/json-utils.ts`
- **Action**: Change type signature to `indent: number | 'tab'`.

### Task 16 ⬜ — Deduplicate `UrlParserPage` encode/decode tab bodies
- **What**: The encode and decode tab bodies are nearly identical (~15 lines each).
- **Files**: `UrlParserPage.tsx`
- **Action**: Extract a shared `UrlTabContent` sub-component. (Marginal ROI)
