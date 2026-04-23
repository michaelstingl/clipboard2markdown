# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

## Project Overview

Browser-based tool that converts richly formatted clipboard content
into Pandoc-flavoured Markdown. Features a template preset system for
structured document assembly (Azure DevOps tickets, GitHub issues,
meeting notes), a source-detecting HTML preprocessor, and a raw
clipboard capture mode for diagnostics.

Deployed as a GitHub Pages site. Single-page app, no backend.

## Architecture

Three-layer pipeline: **DOM → Turndown → string**. Each layer has one
responsibility and they hand off via well-defined interfaces.

```
 clipboard HTML
        │
        ▼
┌──────────────────────┐
│  DOM layer           │   DOMParser → querySelectorAll
│  src/html/           │   • stripNoise  (baseline strip list)
│                      │   • detectSource → office | confluence | generic
│                      │   • applyOfficeCleanup / applyConfluenceCleanup
└──────────────────────┘
        │  doc.body.innerHTML
        ▼
┌──────────────────────┐
│  Turndown layer      │   TurndownService.turndown(html)
│  src/turndown/       │   • service.js  (config + plugin + rules)
│                      │   • rules/inline.js
│                      │   • rules/structural.js
└──────────────────────┘
        │  markdown string
        ▼
┌──────────────────────┐
│  String layer        │   Regex post-process
│  src/post-process/   │   • fixTablePipes  (rescue tab-separated tables)
│                      │   • normalize      (smart punctuation + ws)
└──────────────────────┘
        │
        ▼
 markdown output
```

### Module map

```
src/
  main.js                  — DOMContentLoaded boot + DOM wiring
  convert.js               — public convert(html) entrypoint, composes layers
  presets/
    builtin.js             — BUILTIN_PRESETS constant
    storage.js             — load/save/getActive/create/delete + keys
    index.js               — re-exports
  html/
    strip.js               — STRIP_SELECTORS + stripNoise(doc)
    detect.js              — detectSource(doc) → 'office' | 'confluence' | 'generic'
    cleaners/office.js     — Office/Outlook DOM cleanup
    cleaners/confluence.js — Confluence DOM cleanup (task lists)
    pipeline.js            — cleanHtml(html): strip → detect → cleaner
  turndown/
    service.js             — createTurndownService() factory
    rules/inline.js        — sup/sub/em/strong/kbd/mark
    rules/structural.js    — whitespaceOnly, link, dl/dt/dd
  post-process/
    fix-table-pipes.js     — tab-separated → pipe-separated table rescue
    normalize.js           — smart quotes, dashes, nbsp, whitespace
  clipboard/
    paste.js               — pasteAsSection(template, output, wrapper, info)
    capture.js             — captureRaw() → { capturedAt, userAgent, types }
  keyboard.js              — attachKeyboardHandlers(ctx)
  ui/
    insert.js              — textarea caret/IE-fallback insert
    paste-counter.js       — pasteCounter state + formatPasteComment
    clear.js               — clearOutput(ctx)
    download.js            — downloadAsMarkdown(text)
    capture-button.js      — downloadRawCapture()
    section-buttons.js     — renderSectionButtons(container, onPaste, onChange)
    help-modal.js          — openHelpModal()
    config-modal.js        — openConfigModal(onSave)
```

### Design notes

**Why DOM-level strip, not `turndownService.remove()`?** Turndown's
`remove()` filter is tagname-or-function; CSS attribute selectors
(`[hidden]`, `[style*="display:none"]`) aren't expressible without
dropping to a function. `querySelectorAll` keeps the strip list
declarative.

**Why source detection, not one big cleaner?** Office's `mso-*`
quirks, Confluence's `inline-task-list`, and Jira's (future) macros
are orthogonal. Running all cleaners on every paste would waste work;
a detect-and-dispatch keeps each cleaner focused on one source.

**Why post-process regex after Turndown?** Two concerns Turndown
can't easily handle: `fixTablePipes` rescues tables pasted as
tab-separated text (from spreadsheets), and `normalize` converts
smart punctuation (curly quotes, em-dashes, nbsp) to their ASCII
equivalents for compatibility with plain-text markdown consumers.

**Turndown integration.** The `rules/` directory only contains things
Turndown doesn't handle, or where pandoc-style diverges:

| Rule | Reason |
|------|--------|
| `whitespaceOnly` | Turndown keeps whitespace-only text nodes |
| `link` | Needs autolinks (`<url>`, `<mailto>`) + space-outside-syntax |
| `emphasisWithSpaces` / `strongWithSpaces` | Turndown puts spaces inside `* foo *` instead of outside ` *foo* `; also extends filter to cite/var |
| `kbd-samp-tt` | Turndown has no rule for these |
| `sup`, `sub`, `mark` | Turndown has no rule for these; pandoc syntax |
| `definitionTerm/Description/List` | Turndown has no rule for `<dl>` |

Everything else (setext headings, `<hr>`, `<br>`, `<li>` with
`<ol start>`) is driven by config options on `createTurndownService()`
and uses Turndown's built-in rules. **Don't re-add custom rules for
what config options already handle.**

## Development

```bash
bun install        # Install dependencies
bun run dev        # Start dev server → http://localhost:5173/clipboard2markdown/
bun run build      # Production build → dist/
bun run preview    # Preview production build
bun run test       # Run vitest once
bun run test:watch # Watch mode
```

### Package manager: Bun

The lockfile is `bun.lock`. Prefer `bun add` / `bun remove` for
dependency changes; `npm install` would regenerate a competing
lockfile. `bun run <script>` delegates to the scripts in `package.json`.

### Deployment

GitHub Actions → GitHub Pages on push to master. Workflow lives in
`.github/workflows/`.

## Testing

Vitest + jsdom. Fixture-driven snapshot tests: each HTML fixture in
`tests/fixtures/` has a corresponding markdown snapshot in
`tests/__snapshots__/`. Changes that affect the conversion output
cause a red test; use `bun run test -- -u` to update snapshots after
verifying the diff by eye.

### Fixture naming convention

| Prefix | Purpose |
|--------|---------|
| `<source>.html` | Representative sample for a real paste source (office-word, confluence-task-list, github-issue, azure-devops) |
| `edge-*.html` | Constructed tests for specific categories (inline, block, table, unknown, empty, more) |

### Raw clipboard capture → fixture

For samples where the synthetic fixtures don't capture a real-world
quirk: press `R` in the running app, copy the resulting
`capture-<timestamp>.json`, and extract `types["text/html"].string`
into a new `tests/fixtures/*.html`. The hex dump in the capture file
pinpoints encoding issues (BOMs, zero-width chars, smart quotes) that
would otherwise hide in a visually-identical string.

### Capture tests

`tests/capture.test.js` mocks `navigator.clipboard.read()` and
verifies the shape of `captureRaw()`'s output (not the integration
with a real browser clipboard).

## Extending the tool

### Add a new source-specific cleaner

Say we want a Jira cleaner.

1. Add detection in `src/html/detect.js`:
   ```js
   if (doc.querySelector('.jira-macro, [data-macro-name]')) return 'jira';
   ```
2. Create `src/html/cleaners/jira.js` exporting
   `applyJiraCleanup(doc)` — pure DOM mutation, no return value.
3. Register in `src/html/pipeline.js`:
   ```js
   import { applyJiraCleanup } from './cleaners/jira.js';
   const CLEANERS = { office: ..., confluence: ..., jira: applyJiraCleanup };
   ```
4. Add a `tests/fixtures/jira-*.html` with a representative sample
   and let the snapshot capture current behaviour. Tweak the cleaner
   until the snapshot looks right.

### Add a new Turndown rule

Only add one if Turndown's built-in doesn't cover the case *and*
there's no config option for it. Check
`node_modules/turndown/lib/turndown.cjs.js` for the defaults before
writing an override.

1. Pick the file: inline formatting → `rules/inline.js`, block-level
   → `rules/structural.js`. Create a new file only if the category is
   distinct.
2. Inside `registerInlineRules` / `registerStructuralRules`, add:
   ```js
   turndownService.addRule('myRule', {
     filter: 'foo',  // or ['foo', 'bar'] or function
     replacement: function (content, node) { return '...'; },
   });
   ```
3. Add a fixture case that exercises the rule; the snapshot will
   pick up the new output.

### Add a built-in template preset

1. Add an entry to `BUILTIN_PRESETS` in `src/presets/builtin.js`.
2. Add its ID to `BUILTIN_IDS` in both `src/keyboard.js` and
   `src/ui/section-buttons.js` / `src/ui/help-modal.js` so the
   `Alt+N` shortcut maps to it.

### Add a keyboard shortcut

1. Add the key handling in `src/keyboard.js`. Respect
   `isBlockedTarget(event.target)` to avoid firing inside modal
   inputs.
2. Update `src/ui/help-modal.js` so the shortcut shows up in `?`.
3. Update the keyboard tables in `README.md`.

### Add a post-processing pass

Only add one if it's pure string → string and can't be done as a
Turndown rule. Drop a module in `src/post-process/`, compose it into
`src/convert.js`:

```js
import { myPass } from './post-process/my-pass.js';
return myPass(normalize(fixTablePipes(markdown)));
```

## Key concepts

### Template presets

```javascript
{
  'preset-id': {
    name: 'Display Name',
    builtin: true,       // immutable; editing creates a custom copy
    templates: [
      { key: '1', label: 'Section Name', format: '# {content}' }
    ]
  }
}
```

`{content}` in `format` is replaced with the converted clipboard
content at paste time.

### LocalStorage keys

| Key | Content |
|-----|---------|
| `clipboard2markdown_active_preset` | ID of currently selected preset |
| `clipboard2markdown_custom_presets` | JSON object of user-created presets |

### Paste flow

1. User clicks a section button, presses a number (1–9), or
   `Ctrl/Cmd+V`.
2. `pasteAsSection(template, output, wrapper, info)` reads the
   clipboard (HTML preferred, plain text as fallback).
3. `convert(html)` runs the three-layer pipeline.
4. The result replaces `{content}` in `template.format`.
5. A paste comment (`<!-- Paste #N: Label -->`) is prepended.
6. Output is appended to the textarea.

### Raw capture flow

Press `R` (or click the `⬇` button). `captureRaw()` iterates
`navigator.clipboard.read()`, records every MIME-type with
`byte_length` + `bytes_hex` + `string` (text) or `bytes_base64`
(binary), and packages it with `capturedAt` and `userAgent`. The UI
layer turns the result into a JSON download.

## Keyboard shortcuts (current state of truth)

### Preset switching

| Key | Action |
|-----|--------|
| `Alt+0` | Generic |
| `Alt+1` | Azure DevOps |
| `Alt+2` | GitHub Issue |
| `Alt+3` | Meeting Notes |
| `Alt+4`+ | Custom presets (by creation order) |

**macOS note:** `Alt+N` normally produces special characters (¡, ™,
etc.); the handler reads `event.code` (`Digit0`..`Digit9`) instead of
`event.key` to work around this.

### Section paste

| Key | Action |
|-----|--------|
| `1`–`9` | Paste as template section |

### General

| Key | Action |
|-----|--------|
| `0` | Clear output |
| `R` | Download raw clipboard (debug) |
| `?` | Show help modal |
| `Ctrl/Cmd+V` | Plain paste (append) |
| `Ctrl/Cmd+C` | Copy all output (when nothing selected) |
| `Ctrl/Cmd+L` | Clear output |
| `Ctrl/Cmd+S` | Download as .md |

## UI components

- `#output` textarea — displays/edits combined markdown
- `#section-buttons` — container for preset dropdown + section buttons
- `#preset-select` — dropdown (rebuilt each render)
- `#capture-btn` (⬇) — raw clipboard capture
- `#config-btn` (⚙) — opens template editor
- `#help-btn` (?) — opens shortcuts modal
- `#clear-btn` / `#download-btn` — toolbar actions

## Dark mode

CSS media query `@media (prefers-color-scheme: dark)` in
`index.html`. No JS involvement.

## Dependencies

| Package | Purpose |
|---------|---------|
| `turndown` | HTML → Markdown conversion |
| `@joplin/turndown-plugin-gfm` | GFM support (tables, strikethrough, task lists) |
| `vite` | Build tool + dev server (dev) |
| `vitest` | Test runner (dev) |
| `jsdom` | DOM for node-side tests (dev) |
| `@vitest/ui` | Optional web UI for vitest (dev) |

Bootstrap CSS is vendored in `public/bootstrap.css`.
