# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

clipboard2markdown is a browser-based tool that converts rich HTML content to Markdown format. It allows users to paste formatted text and get Markdown output using the browser clipboard API.

## Architecture

The application is a single-page web application consisting of:

- **index.html**: Main HTML file with a contenteditable div (#pastebin) for capturing paste events and a textarea (#output) for displaying converted Markdown
- **clipboard2markdown.js**: Core application logic that:
  - Listens for Ctrl/Cmd+V to focus the paste area
  - Captures paste events and converts HTML to Markdown
  - Implements Pandoc-style Markdown converters for various HTML elements
  - Handles smart punctuation conversion
- **to-markdown.js**: Third-party library that performs the HTML to Markdown conversion
- **bootstrap.css**: Styling framework
- **background.svg / background-dark.svg**: Background images for light/dark themes

## Development

This is a static web application with no build process.

### Running locally

Start a local web server using one of these methods:
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if http-server is installed globally)
npx http-server
```

Then open http://localhost:8000/ in your browser.

The conversion uses custom Pandoc-style rules defined in the `pandoc` array in clipboard2markdown.js that handle special formatting like:
- Setext-style headers (underlined with = or -)
- Superscript (^text^) and subscript (~text~)
- Line breaks (\\)
- Various code elements (`, KBD, SAMP, TT)

## Key Behavior

- Paste events are captured in a hidden contenteditable div
- The `insert()` function appends converted Markdown to the output textarea instead of replacing it, allowing multiple pastes
- Dark mode is supported via CSS media queries

## Recent Features

### Keyboard Shortcuts
- **Ctrl/Cmd+L**: Clear and return to initial screen
- **Ctrl/Cmd+S**: Download as Markdown file

### UI Enhancements
- Clear button: Resets the application to initial state
- Download button: Saves converted Markdown with timestamp (clipboard2markdown_YYYYMMDD_HHMMSS.md)