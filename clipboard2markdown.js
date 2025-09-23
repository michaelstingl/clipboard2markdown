(function () {
  'use strict';

  // Initialize Turndown service with custom rules
  var turndownService = new TurndownService({
    headingStyle: 'setext',
    hr: '* * * * *',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined'
  });

  // Use GFM plugin for table support (if available)
  if (typeof turndownPluginGfm !== 'undefined') {
    turndownService.use(turndownPluginGfm.tables);
  }

  // Filter out nodes with only whitespace for cleaner output
  turndownService.addRule('whitespaceOnly', {
    filter: function(node) {
      return node.nodeType === 3 && !node.textContent.trim();
    },
    replacement: function() {
      return '';
    }
  });

  // Add custom rules for Pandoc-style markdown
  turndownService.addRule('h1', {
    filter: 'h1',
    replacement: function (content, node) {
      var underline = Array(content.length + 1).join('=');
      return '\n\n' + content + '\n' + underline + '\n\n';
    }
  });

  turndownService.addRule('h2', {
    filter: 'h2',
    replacement: function (content, node) {
      var underline = Array(content.length + 1).join('-');
      return '\n\n' + content + '\n' + underline + '\n\n';
    }
  });

  turndownService.addRule('sup', {
    filter: 'sup',
    replacement: function (content) {
      return '^' + content + '^';
    }
  });

  turndownService.addRule('sub', {
    filter: 'sub',
    replacement: function (content) {
      return '~' + content + '~';
    }
  });

  turndownService.addRule('br', {
    filter: 'br',
    replacement: function () {
      return '\\\n';
    }
  });

  turndownService.addRule('hr', {
    filter: 'hr',
    replacement: function () {
      return '\n\n* * * * *\n\n';
    }
  });

  // Override emphasis to handle spaces properly
  turndownService.addRule('emphasisWithSpaces', {
    filter: ['em', 'i', 'cite', 'var'],
    replacement: function (content) {
      if (!content.trim()) return '';
      // Move leading/trailing spaces outside of markdown syntax
      var leadingSpace = content.match(/^\s+/) ? content.match(/^\s+/)[0] : '';
      var trailingSpace = content.match(/\s+$/) ? content.match(/\s+$/)[0] : '';
      if (leadingSpace || trailingSpace) {
        content = content.trim();
      }
      return leadingSpace + '*' + content + '*' + trailingSpace;
    }
  });

  // Override strong to handle spaces properly (includes <b> tags)
  turndownService.addRule('strongWithSpaces', {
    filter: ['strong', 'b'],
    replacement: function (content) {
      if (!content.trim()) return '';
      // Move leading/trailing spaces outside of markdown syntax
      var leadingSpace = content.match(/^\s+/) ? content.match(/^\s+/)[0] : '';
      var trailingSpace = content.match(/\s+$/) ? content.match(/\s+$/)[0] : '';
      if (leadingSpace || trailingSpace) {
        content = content.trim();
      }
      return leadingSpace + '**' + content + '**' + trailingSpace;
    }
  });

  turndownService.addRule('kbd-samp-tt', {
    filter: function (node) {
      var isCodeElem = node.nodeName === 'KBD' ||
          node.nodeName === 'SAMP' ||
          node.nodeName === 'TT';
      return isCodeElem;
    },
    replacement: function (content) {
      return '`' + content + '`';
    }
  });

  turndownService.addRule('link', {
    filter: function (node) {
      return node.nodeName === 'A' && node.getAttribute('href');
    },
    replacement: function (content, node) {
      // Move leading/trailing spaces outside of markdown syntax
      var leadingSpace = content.match(/^\s+/) ? content.match(/^\s+/)[0] : '';
      var trailingSpace = content.match(/\s+$/) ? content.match(/\s+$/)[0] : '';
      if (leadingSpace || trailingSpace) {
        content = content.trim();
      }

      var url = node.getAttribute('href');
      var titlePart = node.title ? ' "' + node.title + '"' : '';
      var linkMarkdown;

      if (content === url) {
        linkMarkdown = '<' + url + '>';
      } else if (url === ('mailto:' + content)) {
        linkMarkdown = '<' + content + '>';
      } else {
        linkMarkdown = '[' + content + '](' + url + titlePart + ')';
      }

      return leadingSpace + linkMarkdown + trailingSpace;
    }
  });

  turndownService.addRule('listItem', {
    filter: 'li',
    replacement: function (content, node) {
      content = content.replace(/^\s+/, '').replace(/\n/gm, '\n    ');
      var prefix = '-   ';
      var parent = node.parentNode;

      if (/ol/i.test(parent.nodeName)) {
        var index = Array.prototype.indexOf.call(parent.children, node) + 1;
        prefix = index + '. ';
        while (prefix.length < 4) {
          prefix += ' ';
        }
      }

      return prefix + content;
    }
  });

  // Fix and enhance table conversion
  var fixTablePipes = function(markdown) {
    var lines = markdown.split('\n');
    var result = [];
    var potentialTableRows = [];
    var inTable = false;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmedLine = line.trim();

      // Skip standalone pipe characters
      if (trimmedLine === '|') {
        continue;
      }

      // Check if this looks like table content (has text between potential column positions)
      // This handles cases where columns are separated by spacing/tabs rather than pipes
      if (i > 0 && i < lines.length - 1) {
        var prevLine = lines[i - 1].trim();
        var nextLine = lines[i + 1].trim();

        // Detect table header pattern
        if (!trimmedLine.includes('|') && prevLine && nextLine &&
            (prevLine.includes('\t') || prevLine.match(/\s{2,}/)) &&
            (nextLine.includes('\t') || nextLine.match(/\s{2,}/))) {
          // This might be a table without pipes - convert to pipe-delimited
          var cells = trimmedLine.split(/\t+|\s{2,}/);
          if (cells.length > 1) {
            line = '| ' + cells.join(' | ') + ' |';

            // Add header separator if this is the first row
            if (!inTable) {
              inTable = true;
              result.push(line);
              // Add separator row
              var separator = '|' + cells.map(function(cell) {
                return ' ' + '-'.repeat(Math.max(3, cell.length)) + ' ';
              }).join('|') + '|';
              result.push(separator);
              continue;
            }
          }
        }
      }

      // Clean up lines with pipes
      if (trimmedLine.includes('|')) {
        // Remove line breaks around pipes
        line = line.replace(/\n\s*\|\s*\n/g, ' | ');
        line = line.replace(/\n\s*\|/g, ' |');
        line = line.replace(/\|\s*\n/g, '| ');
        inTable = true;
      } else if (inTable && trimmedLine === '') {
        // Empty line might signal end of table
        inTable = false;
      }

      result.push(line);
    }

    return result.join('\n');
  };

  // http://pandoc.org/README.html#smart-punctuation
  var escape = function (str) {
    return str.replace(/[\u2018\u2019\u00b4]/g, "'")
              .replace(/[\u201c\u201d\u2033]/g, '"')
              .replace(/[\u2212\u2022\u00b7\u25aa]/g, '-')
              .replace(/[\u2013\u2015]/g, '--')
              .replace(/\u2014/g, '---')
              .replace(/\u2026/g, '...')
              .replace(/[ ]+\n/g, '\n')
              .replace(/\s*\\\n/g, '\\\n')
              .replace(/\s*\\\n\s*\\\n/g, '\n\n')
              .replace(/\s*\\\n\n/g, '\n\n')
              .replace(/\n-\n/g, '\n')
              .replace(/\n\n\s*\\\n/g, '\n\n')
              .replace(/\n\n\n*/g, '\n\n')
              .replace(/[ ]+$/gm, '')
              .replace(/^\s+|[\s\\]+$/g, '');
  };

  var convert = function (str) {
    var markdown = turndownService.turndown(str);
    markdown = fixTablePipes(markdown);
    return escape(markdown);
  }

  var insert = function (myField, myValue) {
      if (document.selection) {
          myField.focus();
          sel = document.selection.createRange();
          sel.text = myValue;
          sel.select()
      } else {
          if (myField.selectionStart || myField.selectionStart == "0") {
              var startPos = myField.selectionStart;
              var endPos = myField.selectionEnd;
              var beforeValue = myField.value.substring(0, startPos);
              var afterValue = myField.value.substring(endPos, myField.value.length);
              myField.value = beforeValue + myValue + afterValue;
              myField.selectionStart = startPos + myValue.length;
              myField.selectionEnd = startPos + myValue.length;
              myField.focus()
          } else {
              myField.value += myValue;
              myField.focus()
          }
      }
  };

  // http://stackoverflow.com/questions/2176861/javascript-get-clipboard-data-on-paste-event-cross-browser
  document.addEventListener('DOMContentLoaded', function () {
    // Log version info to console
    console.log('%c clipboard2markdown ', 'background: #222; color: #bada55; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
    console.log('Version: 2.0.0');
    console.group('Dependencies:');
    console.log('• Turndown v7.2.1 (Markdown converter)');
    console.log('• Turndown Plugin GFM v1.0.2 (Table support)');
    console.log('• Bootstrap v5.3.3 (CSS framework)');
    console.groupEnd();
    console.log('Repository: https://github.com/michaelstingl/clipboard2markdown');

    // Check if libraries are available
    if (typeof TurndownService !== 'undefined') {
      console.log('✓ Turndown loaded successfully');
    } else {
      console.error('✗ Turndown not found!');
    }
    if (typeof turndownPluginGfm !== 'undefined') {
      console.log('✓ GFM Plugin loaded (table support enabled)');
    } else {
      console.warn('⚠ GFM Plugin not loaded (tables may not convert properly)');
    }

    var info = document.querySelector('#info');
    var pastebin = document.querySelector('#pastebin');
    var output = document.querySelector('#output');
    var wrapper = document.querySelector('#wrapper');

    document.addEventListener('keydown', function (event) {
      if (event.ctrlKey || event.metaKey) {
        var key = String.fromCharCode(event.which).toLowerCase();

        if (key === 'v') {
          pastebin.innerHTML = '';
          pastebin.focus();
          info.classList.add('hidden');
          wrapper.classList.add('hidden');
        } else if (key === 'l' && !wrapper.classList.contains('hidden')) {
          // Ctrl/Cmd+L to clear - return to initial screen
          event.preventDefault();
          output.value = '';
          pastebin.innerHTML = '';
          info.classList.remove('hidden');
          wrapper.classList.add('hidden');
        } else if (key === 's' && !wrapper.classList.contains('hidden')) {
          // Ctrl/Cmd+S to download
          event.preventDefault();
          var text = output.value;
          var blob = new Blob([text], {type: 'text/markdown;charset=utf-8'});
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          // Add timestamp to filename
          var now = new Date();
          var timestamp = now.getFullYear() +
                         ('0' + (now.getMonth() + 1)).slice(-2) +
                         ('0' + now.getDate()).slice(-2) + '_' +
                         ('0' + now.getHours()).slice(-2) +
                         ('0' + now.getMinutes()).slice(-2) +
                         ('0' + now.getSeconds()).slice(-2);
          a.download = 'clipboard2markdown_' + timestamp + '.md';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
    });

    pastebin.addEventListener('paste', function () {
      setTimeout(function () {
        var html = pastebin.innerHTML;
        var markdown = convert(html);
        // output.value = markdown;
        insert(output, markdown);
        wrapper.classList.remove('hidden');
        output.focus();
        output.select();
      }, 200);
    });

    // Clear button functionality - return to initial screen
    var clearBtn = document.querySelector('#clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        output.value = '';
        pastebin.innerHTML = '';
        info.classList.remove('hidden');
        wrapper.classList.add('hidden');
      });
    }

    // Download button functionality
    var downloadBtn = document.querySelector('#download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function () {
        var text = output.value;
        var blob = new Blob([text], {type: 'text/markdown;charset=utf-8'});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        // Add timestamp to filename
        var now = new Date();
        var timestamp = now.getFullYear() +
                       ('0' + (now.getMonth() + 1)).slice(-2) +
                       ('0' + now.getDate()).slice(-2) + '_' +
                       ('0' + now.getHours()).slice(-2) +
                       ('0' + now.getMinutes()).slice(-2) +
                       ('0' + now.getSeconds()).slice(-2);
        a.download = 'markdown_' + timestamp + '.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
  });
})();
