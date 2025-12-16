# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

clipboard2markdown is a browser-based tool that converts rich HTML content to Markdown format. It features a template preset system for structured document assembly (e.g., Azure DevOps tickets, GitHub issues, meeting notes).

## Architecture

### Files

| File | Purpose |
|------|---------|
| `index.html` | Main HTML with UI structure and CSS styles |
| `clipboard2markdown.js` | Core application logic (~980 lines) |
| `turndown.js` | Turndown library for HTML→Markdown conversion |
| `turndown-plugin-gfm.js` | GFM plugin for table support |
| `bootstrap.css` | Bootstrap 5.3.3 styling |
| `background.svg` / `background-dark.svg` | Background images |

### clipboard2markdown.js Structure

```
IIFE
├── Template Presets System (lines 1-145)
│   ├── BUILTIN_PRESETS (generic, azure-devops, github-issue, meeting-notes)
│   ├── LocalStorage functions (load/save presets, active preset)
│   └── Preset management (create, delete, generate ID)
│
├── Paste Counter (lines 147-166)
│   └── Numbered HTML comments for tracking pastes
│
├── Turndown Configuration (lines 168-416)
│   ├── TurndownService initialization
│   ├── Custom rules (h1, h2, sup, sub, br, hr, emphasis, links, lists)
│   └── Table pipe fixing, smart punctuation escape
│
├── Clipboard API (lines 418-484)
│   └── pasteAsSection() - reads clipboard, converts, applies template
│
├── UI Rendering (lines 486-581)
│   └── renderSectionButtons() - preset dropdown, section buttons
│
├── Modals (lines 583-794)
│   ├── openHelpModal() - keyboard shortcuts display
│   └── openConfigModal() - template editing
│
├── Utility (lines 796-817)
│   └── insert() - textarea text insertion
│
└── DOMContentLoaded (lines 819-999)
    ├── Section buttons initialization
    ├── Keyboard event handlers (1-9, ?, Ctrl+V/L/S)
    ├── Paste event handler
    └── Button click handlers (Clear, Download)
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

1. User clicks section button or presses number key
2. `pasteAsSection()` called with template
3. `navigator.clipboard.read()` gets HTML (or fallback to `readText()`)
4. HTML converted via `turndownService.turndown()`
5. Template format applied: `format.replace('{content}', markdown)`
6. Paste comment prepended: `<!-- Paste #N: Label -->`
7. Result inserted into output textarea

## Development

### Running Locally

```bash
python3 -m http.server 8000
# Open http://localhost:8000/
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

| Key | Action |
|-----|--------|
| `1`, `2`, `3`... | Paste as template section (auto-reads clipboard) |
| `?` | Show help modal |
| `Ctrl/Cmd+V` | Traditional paste (plain append with `<!-- Paste #N -->`) |
| `Ctrl/Cmd+L` | Clear output and reset |
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
