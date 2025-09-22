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

  turndownService.addRule('cite-var', {
    filter: ['cite', 'var'],
    replacement: function (content) {
      return '*' + content + '*';
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
      var url = node.getAttribute('href');
      var titlePart = node.title ? ' "' + node.title + '"' : '';
      if (content === url) {
        return '<' + url + '>';
      } else if (url === ('mailto:' + content)) {
        return '<' + content + '>';
      } else {
        return '[' + content + '](' + url + titlePart + ')';
      }
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
    return escape(turndownService.turndown(str));
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
    console.log('• Bootstrap v3.3.6 (CSS framework)');
    console.groupEnd();
    console.log('Repository: https://github.com/michaelstingl/clipboard2markdown');

    // Check if libraries are available
    if (typeof TurndownService !== 'undefined') {
      console.log('✓ Turndown loaded successfully');
    } else {
      console.error('✗ Turndown not found!');
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
