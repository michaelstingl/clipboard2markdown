clipboard2markdown
==================

> Easily convert richly formatted text or HTML to
> [Markdown](http://daringfireball.net/projects/markdown/syntax).
> Use the clipboard and paste to Markdown with a single keypress.
>
> The conversion is carried out by
> [Turndown](https://github.com/domchristie/turndown),
> a Markdown converter running in the browser.

Demo
----

### Interactive

<https://michaelstingl.github.io/clipboard2markdown/>

### Video

![Screencast](screencast.gif)

Features
--------

### Template Presets

Choose from built-in templates or create your own:

- **Generic** - Heading, Section, Quote
- **Azure DevOps** - Title, Description, Acceptance Criteria
- **GitHub Issue** - Title, Problem, Steps to Reproduce, Expected Behavior
- **Meeting Notes** - Title, Attendees, Discussion, Action Items

Custom templates are saved in LocalStorage.

### Keyboard Shortcuts

**Preset Switching** (Alt/Option + number):

| Key | Action |
|-----|--------|
| `Alt+0` | Generic |
| `Alt+1` | Azure DevOps |
| `Alt+2` | GitHub Issue |
| `Alt+3` | Meeting Notes |
| `Alt+4`... | Custom presets |

**Section Paste** (number key):

| Key | Action |
|-----|--------|
| `1`, `2`, `3`... | Paste as template section |

**General**:

| Key | Action |
|-----|--------|
| `0` | Clear output |
| `Ctrl+V` / `Cmd+V` | Plain paste (append) |
| `Ctrl+L` / `Cmd+L` | Clear output (alternative) |
| `Ctrl+S` / `Cmd+S` | Download as .md file |
| `?` | Show keyboard shortcuts |

### Multi-Paste Support

Each paste is numbered with HTML comments for easy tracking:

```markdown
<!-- Paste #1: Title -->

# My Document Title

<!-- Paste #2: Description -->

## Description

The description text...
```

Usage
-----

1. Open the app in your browser
2. Copy content from any source (e.g., Azure DevOps, Confluence, web pages)
3. Select a template from the dropdown (optional)
4. Click a section button or press `1`/`2`/`3` to paste with formatting
5. Repeat for additional sections
6. Download the combined Markdown with `Ctrl+S`

### Running Locally

Start a local web server:

```bash
# Python 3
python3 -m http.server 8000

# Node.js
npx http-server
```

Then open http://localhost:8000/ in your browser.

About
-----

[clipboard2markdown](https://github.com/euangoddard/clipboard2markdown)
was created by [Euan Goddard](https://github.com/euangoddard).
[Vegard Øye](https://github.com/epsil) ported it to
[to-markdown](https://github.com/domchristie/to-markdown) by
[Dom Christie](https://github.com/domchristie).
[Michael Stingl](https://github.com/michaelstingl) migrated to
[Turndown](https://github.com/domchristie/turndown) and added
the template preset system.

The HTML template is based on [Bootstrap](http://getbootstrap.com/).

### License

[![License][license-image]][license-url]

Released under the MIT License. See the [LICENSE](LICENSE) file
for details.

[license-image]: https://img.shields.io/npm/l/markdownlint.svg
[license-url]: http://opensource.org/licenses/MIT
