# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

clipboard2markdown is a browser-based tool that converts rich HTML content to Markdown format. It features a template preset system for structured document assembly (e.g., Azure DevOps tickets, GitHub issues, meeting notes).

## Architecture

### Build System

- **Package Manager**: Bun
- **Bundler**: Vite
- **Deployment**: GitHub Actions → GitHub Pages

### Files

| File | Purpose |
|------|---------|
| `index.html` | Main HTML with UI structure and CSS styles |
| `clipboard2markdown.js` | Core application logic (ES Module) |
| `public/bootstrap.css` | Bootstrap 5.3.3 styling |
| `public/background.svg` | Light mode background |
| `public/background-dark.svg` | Dark mode background |
| `vite.config.js` | Vite configuration |
| `package.json` | Dependencies and scripts |

### Dependencies (via npm)

| Package | Purpose |
|---------|---------|
| `turndown` | HTML → Markdown conversion |
| `@joplin/turndown-plugin-gfm` | GFM support (tables, strikethrough, task lists) |
| `vite` | Build tool (dev dependency) |

### clipboard2markdown.js Structure

```
ES Module
├── Imports (turndown, @joplin/turndown-plugin-gfm)
├── Template Presets System
│   ├── BUILTIN_PRESETS (generic, azure-devops, github-issue, meeting-notes)
│   ├── LocalStorage functions (load/save presets, active preset)
│   └── Preset management (create, delete, generate ID)
│
├── Paste Counter
│   └── Numbered HTML comments for tracking pastes
│
├── Turndown Configuration
│   ├── TurndownService initialization
│   ├── GFM plugin (tables, strikethrough, taskListItems)
│   ├── Custom rules (h1, h2, sup, sub, br, hr, emphasis, links, lists)
│   ├── Office HTML pre-processor (cleanOfficeHtml)
│   └── Smart punctuation escape
│
├── Clipboard API
│   └── pasteAsSection() - reads clipboard, converts, applies template
│
├── UI Rendering
│   └── renderSectionButtons() - preset dropdown, section buttons
│
├── Modals
│   ├── openHelpModal() - keyboard shortcuts display
│   └── openConfigModal() - template editing
│
├── Utility
│   └── insert() - textarea text insertion
│
└── DOMContentLoaded
    ├── Section buttons initialization
    ├── Keyboard event handlers
    ├── Paste event handler
    └── Button click handlers
```

## Key Concepts

### Template Presets

```javascript
{
  'preset-id': {
    name: 'Display Name',
    builtin: true/false,
    templates: [
      { key: '1', label: 'Section Name', format: '# {content}' }
    ]
  }
}
```

- **Built-in presets**: Cannot be modified directly (editing creates a custom copy)
- **Custom presets**: Stored in LocalStorage, fully editable
- **Format string**: `{content}` is replaced with converted clipboard content

### LocalStorage Keys

| Key | Content |
|-----|---------|
| `clipboard2markdown_active_preset` | ID of currently selected preset |
| `clipboard2markdown_custom_presets` | JSON object of user-created presets |

### Clipboard API Flow

1. User clicks section button or presses number key (1-9)
2. `pasteAsSection()` called with template
3. `navigator.clipboard.read()` gets HTML (or fallback to `readText()`)
4. HTML converted via `turndownService.turndown()`
5. Template format applied: `format.replace('{content}', markdown)`
6. Paste comment prepended: `<!-- Paste #N: Label -->`
7. Result inserted into output textarea

## Development

### Running Locally

```bash
bun install     # Install dependencies
bun run dev     # Start dev server → http://localhost:5173/clipboard2markdown/
bun run build   # Production build → dist/
bun run preview # Preview production build
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `convert(html)` | HTML → Markdown via Turndown + cleanup |
| `pasteAsSection(template, output, wrapper, info)` | Auto-paste with template |
| `renderSectionButtons(container, output, wrapper, info, onPresetChange)` | Rebuild UI |
| `openConfigModal(onSave)` | Template editor modal |
| `openHelpModal()` | Keyboard shortcuts modal |

### Turndown Custom Rules

The app uses setext-style headers (underlined) and custom rules for:
- Superscript: `^text^`
- Subscript: `~text~`
- Line breaks: `\\`
- Code elements: KBD, SAMP, TT → backticks
- Smart punctuation conversion (curly quotes → straight)

## Keyboard Shortcuts

### Preset Switching

| Key | Action |
|-----|--------|
| `Alt+0` | Switch to Generic preset |
| `Alt+1` | Switch to Azure DevOps preset |
| `Alt+2` | Switch to GitHub Issue preset |
| `Alt+3` | Switch to Meeting Notes preset |
| `Alt+4`, `Alt+5`... | Switch to custom presets (by creation order) |

**Note for macOS**: `Alt+number` normally produces special characters (e.g., Alt+1 = ¡). The app intercepts these with `event.preventDefault()`.

### Section Paste

| Key | Action |
|-----|--------|
| `1`, `2`, `3`... | Paste as template section (auto-reads clipboard) |

### General

| Key | Action |
|-----|--------|
| `0` | Clear output and reset |
| `?` | Show help modal |
| `Ctrl/Cmd+V` | Traditional paste (plain append with `<!-- Paste #N -->`) |
| `Ctrl/Cmd+L` | Clear output and reset (alternative) |
| `Ctrl/Cmd+S` | Download as .md file |

## UI Components

- **Preset dropdown**: `#preset-select` - switches active template
- **Section buttons**: `.section-btn` - one per template section
- **Config button**: `#config-btn` (⚙) - opens template editor
- **Help button**: `#help-btn` (?) - opens shortcuts modal
- **Output**: `#output` textarea - displays/edits combined markdown
- **Pastebin**: `#pastebin` contenteditable div - captures Ctrl+V paste events

## Dark Mode

CSS media query `@media (prefers-color-scheme: dark)` handles all dark mode styling automatically.
