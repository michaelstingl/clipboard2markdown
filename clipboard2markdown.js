import TurndownService from 'turndown';
import { tables, strikethrough, taskListItems } from '@joplin/turndown-plugin-gfm';

// ===========================================
// Template Presets System
// ===========================================
  var BUILTIN_PRESETS = {
    'generic': {
      name: 'Generic',
      builtin: true,
      templates: [
        { key: '1', label: 'Heading', format: '# {content}' },
        { key: '2', label: 'Section', format: '## {content}' },
        { key: '3', label: 'Quote', format: '> {content}' }
      ]
    },
    'azure-devops': {
      name: 'Azure DevOps',
      builtin: true,
      templates: [
        { key: '1', label: 'Title', format: '# {content}' },
        { key: '2', label: 'Description', format: '## Description\n\n{content}' },
        { key: '3', label: 'Acceptance Criteria', format: '## Acceptance Criteria\n\n{content}' }
      ]
    },
    'github-issue': {
      name: 'GitHub Issue',
      builtin: true,
      templates: [
        { key: '1', label: 'Title', format: '# {content}' },
        { key: '2', label: 'Problem', format: '## Problem\n\n{content}' },
        { key: '3', label: 'Steps to Reproduce', format: '## Steps to Reproduce\n\n{content}' },
        { key: '4', label: 'Expected Behavior', format: '## Expected Behavior\n\n{content}' }
      ]
    },
    'meeting-notes': {
      name: 'Meeting Notes',
      builtin: true,
      templates: [
        { key: '1', label: 'Title', format: '# {content}' },
        { key: '2', label: 'Attendees', format: '## Attendees\n\n{content}' },
        { key: '3', label: 'Discussion', format: '## Discussion\n\n{content}' },
        { key: '4', label: 'Action Items', format: '## Action Items\n\n{content}' }
      ]
    }
  };

  var STORAGE_KEY_ACTIVE = 'clipboard2markdown_active_preset';
  var STORAGE_KEY_CUSTOM = 'clipboard2markdown_custom_presets';

  function loadCustomPresets() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY_CUSTOM);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not load custom presets from localStorage:', e);
    }
    return {};
  }

  function saveCustomPresets(presets) {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(presets));
    } catch (e) {
      console.warn('Could not save custom presets to localStorage:', e);
    }
  }

  function loadActivePresetId() {
    try {
      return localStorage.getItem(STORAGE_KEY_ACTIVE) || 'generic';
    } catch (e) {
      return 'generic';
    }
  }

  function saveActivePresetId(id) {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE, id);
    } catch (e) {
      console.warn('Could not save active preset:', e);
    }
  }

  function getAllPresets() {
    var custom = loadCustomPresets();
    return Object.assign({}, BUILTIN_PRESETS, custom);
  }

  function getActivePreset() {
    var allPresets = getAllPresets();
    var activeId = loadActivePresetId();
    return allPresets[activeId] || BUILTIN_PRESETS['generic'];
  }

  function createCustomPreset(id, name, templates) {
    var custom = loadCustomPresets();
    custom[id] = {
      name: name,
      builtin: false,
      templates: templates
    };
    saveCustomPresets(custom);
  }

  function deleteCustomPreset(id) {
    var custom = loadCustomPresets();
    if (custom[id]) {
      delete custom[id];
      saveCustomPresets(custom);
      // If deleted preset was active, switch to generic
      if (loadActivePresetId() === id) {
        saveActivePresetId('generic');
      }
    }
  }

  function generatePresetId(name) {
    return 'custom-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
  }

  var activePresetId = loadActivePresetId();
  var templates = getActivePreset().templates;

  // ===========================================
  // Paste Counter
  // ===========================================
  var pasteCounter = 0;

  function getNextPasteNumber() {
    pasteCounter++;
    return pasteCounter;
  }

  function resetPasteCounter() {
    pasteCounter = 0;
  }

  function formatPasteComment(num, label) {
    if (label) {
      return '<!-- Paste #' + num + ': ' + label + ' -->\n\n';
    }
    return '<!-- Paste #' + num + ' -->\n\n';
  }

  // ===========================================
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

  // Use GFM plugin for table support
  turndownService.use([tables, strikethrough, taskListItems]);

  // ===========================================
  // HTML Pre-Processor for Office/Outlook content
  // ===========================================
  function cleanOfficeHtml(html) {
    // Create a temporary DOM to work with
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, 'text/html');

    // Remove Office-specific elements
    var officeTags = doc.querySelectorAll('o\\:p, o\\:smarttagtype, xml, style');
    officeTags.forEach(function(el) { el.remove(); });

    // Remove Word bookmark spans
    var bookmarkSpans = doc.querySelectorAll('span[style*="mso-bookmark"]');
    bookmarkSpans.forEach(function(span) {
      // Replace with text content
      var text = document.createTextNode(span.textContent);
      span.parentNode.replaceChild(text, span);
    });

    // Clean up spans with only mso-* styles (keep content)
    var spans = doc.querySelectorAll('span');
    spans.forEach(function(span) {
      var style = span.getAttribute('style') || '';
      // If span has only mso-* styles or font-family styles, unwrap it
      if (style && !style.match(/(?:^|;)\s*(?:font-weight|font-style|text-decoration)\s*:/i)) {
        // Check if it's purely presentational
        var cleanStyle = style.replace(/mso-[^;]+;?/gi, '')
                              .replace(/font-family:[^;]+;?/gi, '')
                              .replace(/font-size:[^;]+;?/gi, '')
                              .replace(/color:#333333;?/gi, '')
                              .trim();
        if (!cleanStyle) {
          // Unwrap the span
          while (span.firstChild) {
            span.parentNode.insertBefore(span.firstChild, span);
          }
          span.remove();
        }
      }
    });

    return doc.body.innerHTML;
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
    // Pre-process Office/Outlook HTML
    var cleanedHtml = cleanOfficeHtml(str);
    var markdown = turndownService.turndown(cleanedHtml);
    markdown = fixTablePipes(markdown);
    return escape(markdown);
  }

  // ===========================================
  // Clipboard API: Read and paste with template
  // ===========================================
  async function pasteAsSection(template, output, wrapper, info) {
    try {
      // Try to read HTML from clipboard first
      var html = '';
      var plainText = '';

      if (navigator.clipboard && navigator.clipboard.read) {
        try {
          var clipboardItems = await navigator.clipboard.read();
          for (var item of clipboardItems) {
            // Try HTML first
            if (item.types.includes('text/html')) {
              var blob = await item.getType('text/html');
              html = await blob.text();
            }
            // Fallback to plain text
            if (item.types.includes('text/plain')) {
              var blob = await item.getType('text/plain');
              plainText = await blob.text();
            }
          }
        } catch (e) {
          // Fallback to readText if read() fails
          plainText = await navigator.clipboard.readText();
        }
      } else if (navigator.clipboard && navigator.clipboard.readText) {
        plainText = await navigator.clipboard.readText();
      } else {
        throw new Error('Clipboard API not supported');
      }

      // Convert to markdown
      var content = html ? convert(html) : plainText;

      // Apply template format
      var formatted = template.format.replace('{content}', content);

      // Add paste comment with number and label
      var pasteNum = getNextPasteNumber();
      var pasteComment = formatPasteComment(pasteNum, template.label);

      // Add separator if there's existing content
      var separator = '';
      if (output.value.trim().length > 0) {
        separator = '\n\n';
      }

      // Move cursor to end and insert
      output.selectionStart = output.value.length;
      output.selectionEnd = output.value.length;
      insert(output, separator + pasteComment + formatted);

      // Show output area
      info.classList.add('hidden');
      wrapper.classList.remove('hidden');
      output.focus();
      output.selectionStart = output.value.length;
      output.selectionEnd = output.value.length;

    } catch (err) {
      console.error('Failed to read clipboard:', err);
      alert('Could not read clipboard. Please use Ctrl+V to paste manually.\n\nError: ' + err.message);
    }
  }

  // ===========================================
  // Render section buttons dynamically
  // ===========================================
  function renderSectionButtons(container, output, wrapper, info, onPresetChange) {
    container.innerHTML = '';

    // Preset selector row
    var presetRow = document.createElement('div');
    presetRow.className = 'preset-row';

    var presetLabel = document.createElement('span');
    presetLabel.className = 'preset-label';
    presetLabel.textContent = 'Template:';
    presetRow.appendChild(presetLabel);

    var presetSelect = document.createElement('select');
    presetSelect.className = 'preset-select';
    presetSelect.id = 'preset-select';

    var allPresets = getAllPresets();
    var activeId = loadActivePresetId();

    // Group: Built-in (with keyboard shortcuts)
    var builtinGroup = document.createElement('optgroup');
    builtinGroup.label = 'Built-in';
    var builtinIds = ['generic', 'azure-devops', 'github-issue', 'meeting-notes'];
    builtinIds.forEach(function(id, index) {
      var opt = document.createElement('option');
      opt.value = id;
      opt.textContent = '[Alt+' + index + '] ' + BUILTIN_PRESETS[id].name;
      if (id === activeId) opt.selected = true;
      builtinGroup.appendChild(opt);
    });
    presetSelect.appendChild(builtinGroup);

    // Group: Custom (if any, with keyboard shortcuts)
    var customPresets = loadCustomPresets();
    var customIds = Object.keys(customPresets);
    if (customIds.length > 0) {
      var customGroup = document.createElement('optgroup');
      customGroup.label = 'Custom';
      customIds.forEach(function(id, index) {
        var opt = document.createElement('option');
        opt.value = id;
        var shortcutIndex = builtinIds.length + index;
        opt.textContent = '[Alt+' + shortcutIndex + '] ' + customPresets[id].name;
        if (id === activeId) opt.selected = true;
        customGroup.appendChild(opt);
      });
      presetSelect.appendChild(customGroup);
    }

    presetSelect.addEventListener('change', function() {
      activePresetId = this.value;
      saveActivePresetId(activePresetId);
      templates = getActivePreset().templates;
      if (onPresetChange) onPresetChange();
    });

    presetRow.appendChild(presetSelect);

    // Config button
    var configBtn = document.createElement('button');
    configBtn.className = 'btn btn-outline-secondary btn-sm';
    configBtn.id = 'config-btn';
    configBtn.innerHTML = '⚙';
    configBtn.title = 'Configure templates';
    presetRow.appendChild(configBtn);

    // Help button
    var helpBtn = document.createElement('button');
    helpBtn.className = 'btn btn-outline-secondary btn-sm';
    helpBtn.id = 'help-btn';
    helpBtn.innerHTML = '?';
    helpBtn.title = 'Keyboard shortcuts (?)';
    helpBtn.addEventListener('click', openHelpModal);
    presetRow.appendChild(helpBtn);

    container.appendChild(presetRow);

    // Section buttons row
    var buttonsRow = document.createElement('div');
    buttonsRow.className = 'section-buttons-row';

    templates.forEach(function(template) {
      var btn = document.createElement('button');
      btn.className = 'btn btn-outline-primary btn-sm section-btn';
      btn.setAttribute('data-key', template.key);
      btn.innerHTML = '<span class="shortcut-key">' + template.key + '</span> ' + template.label;
      btn.title = 'Paste as ' + template.label + ' (or press ' + template.key + ')';
      btn.addEventListener('click', function() {
        pasteAsSection(template, output, wrapper, info);
      });
      buttonsRow.appendChild(btn);
    });

    container.appendChild(buttonsRow);
  }

  // ===========================================
  // Help Modal
  // ===========================================
  function openHelpModal() {
    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.id = 'help-modal-backdrop';

    var modal = document.createElement('div');
    modal.className = 'config-modal help-modal';
    modal.id = 'help-modal';

    var html = '<h3>Keyboard Shortcuts</h3>';

    // Preset shortcuts (Alt+0, Alt+1, etc.)
    html += '<h4 class="shortcut-section-title">Preset Switching</h4>';
    html += '<table class="shortcuts-table">';
    html += '<tbody>';

    // Built-in presets
    var builtinIds = ['generic', 'azure-devops', 'github-issue', 'meeting-notes'];
    builtinIds.forEach(function(id, index) {
      var preset = BUILTIN_PRESETS[id];
      html += '<tr><td><kbd>Alt</kbd>+<kbd>' + index + '</kbd></td><td>' + preset.name + '</td></tr>';
    });

    // Custom presets
    var customPresets = loadCustomPresets();
    var customIds = Object.keys(customPresets);
    customIds.forEach(function(id, index) {
      var presetIndex = builtinIds.length + index;
      html += '<tr><td><kbd>Alt</kbd>+<kbd>' + presetIndex + '</kbd></td><td>' + customPresets[id].name + '</td></tr>';
    });

    html += '</tbody></table>';

    // Section shortcuts (1, 2, 3, etc.)
    html += '<h4 class="shortcut-section-title">Section Paste (current preset)</h4>';
    html += '<table class="shortcuts-table">';
    html += '<tbody>';

    templates.forEach(function(t) {
      html += '<tr><td><kbd>' + t.key + '</kbd></td><td>Paste as ' + t.label + '</td></tr>';
    });

    html += '</tbody></table>';

    // General shortcuts
    html += '<h4 class="shortcut-section-title">General</h4>';
    html += '<table class="shortcuts-table">';
    html += '<tbody>';
    html += '<tr><td><kbd>0</kbd></td><td>Clear output</td></tr>';
    html += '<tr><td><kbd>Ctrl</kbd>+<kbd>V</kbd></td><td>Paste (plain append)</td></tr>';
    html += '<tr><td><kbd>Ctrl</kbd>+<kbd>L</kbd></td><td>Clear output (alternative)</td></tr>';
    html += '<tr><td><kbd>Ctrl</kbd>+<kbd>S</kbd></td><td>Download as .md</td></tr>';
    html += '<tr><td><kbd>?</kbd></td><td>Show this help</td></tr>';
    html += '</tbody></table>';

    html += '<p class="help-note">On Mac, use <kbd>⌘</kbd> instead of <kbd>Ctrl</kbd> and <kbd>Option</kbd> instead of <kbd>Alt</kbd></p>';

    html += '<div class="modal-footer">';
    html += '<button class="btn btn-primary" id="close-help-btn">Close</button>';
    html += '</div>';

    modal.innerHTML = html;
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    function closeModal() {
      document.getElementById('help-modal').remove();
      document.getElementById('help-modal-backdrop').remove();
    }

    document.getElementById('close-help-btn').addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    // Close on Escape
    var escHandler = function(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  // ===========================================
  // Configuration Modal
  // ===========================================
  function openConfigModal(onSave) {
    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.id = 'config-modal-backdrop';

    var modal = document.createElement('div');
    modal.className = 'config-modal';
    modal.id = 'config-modal';

    var currentPreset = getActivePreset();
    var isBuiltin = currentPreset.builtin;

    var html = '<h3>Edit Template: <span id="preset-name-display">' + escapeHtml(currentPreset.name) + '</span></h3>';

    if (isBuiltin) {
      html += '<p class="preset-info">This is a built-in template. Changes will be saved as a new custom template.</p>';
    }

    html += '<div class="preset-name-row">';
    html += '<label>Template Name:</label>';
    html += '<input type="text" id="preset-name-input" value="' + escapeHtml(isBuiltin ? currentPreset.name + ' (Custom)' : currentPreset.name) + '">';
    html += '</div>';

    html += '<div id="template-list"></div>';

    html += '<div class="modal-actions">';
    html += '<button class="btn btn-sm btn-outline-secondary" id="add-template-btn">+ Add Section</button>';
    if (!isBuiltin) {
      html += '<button class="btn btn-sm btn-outline-danger" id="delete-preset-btn">Delete Template</button>';
    }
    html += '</div>';

    html += '<div class="modal-footer">';
    html += '<button class="btn btn-secondary" id="cancel-config-btn">Cancel</button>';
    html += '<button class="btn btn-primary" id="save-config-btn">' + (isBuiltin ? 'Save as New' : 'Save') + '</button>';
    html += '</div>';

    modal.innerHTML = html;
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    var tempTemplates = JSON.parse(JSON.stringify(currentPreset.templates));

    function renderTemplateList() {
      var list = document.getElementById('template-list');
      list.innerHTML = '';

      tempTemplates.forEach(function(t, index) {
        var item = document.createElement('div');
        item.className = 'template-item';
        item.innerHTML =
          '<div class="template-row">' +
            '<input type="text" class="template-key" value="' + escapeHtml(t.key) + '" placeholder="Key" maxlength="1">' +
            '<input type="text" class="template-label" value="' + escapeHtml(t.label) + '" placeholder="Label">' +
            '<button class="btn btn-sm btn-outline-danger delete-template-btn" data-index="' + index + '">✕</button>' +
          '</div>' +
          '<div class="template-row">' +
            '<input type="text" class="template-format" value="' + escapeHtml(t.format) + '" placeholder="Format (use {content} as placeholder)">' +
          '</div>';
        list.appendChild(item);
      });

      list.querySelectorAll('.delete-template-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var idx = parseInt(this.getAttribute('data-index'));
          tempTemplates.splice(idx, 1);
          renderTemplateList();
        });
      });
    }

    renderTemplateList();

    // Add section
    document.getElementById('add-template-btn').addEventListener('click', function() {
      var nextKey = (tempTemplates.length + 1).toString();
      tempTemplates.push({ key: nextKey, label: 'New Section', format: '## New Section\n\n{content}' });
      renderTemplateList();
    });

    // Delete preset (only for custom)
    var deleteBtn = document.getElementById('delete-preset-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function() {
        if (confirm('Delete this custom template "' + currentPreset.name + '"?')) {
          deleteCustomPreset(activePresetId);
          activePresetId = 'generic';
          templates = getActivePreset().templates;
          closeModal();
          onSave();
        }
      });
    }

    // Cancel
    document.getElementById('cancel-config-btn').addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    // Save
    document.getElementById('save-config-btn').addEventListener('click', function() {
      var items = document.querySelectorAll('.template-item');
      var newTemplates = [];
      items.forEach(function(item) {
        var key = item.querySelector('.template-key').value.trim();
        var label = item.querySelector('.template-label').value.trim();
        var format = item.querySelector('.template-format').value;
        if (key && label && format) {
          newTemplates.push({ key: key, label: label, format: format });
        }
      });

      var presetName = document.getElementById('preset-name-input').value.trim() || 'Custom Template';

      if (isBuiltin) {
        // Create new custom preset
        var newId = generatePresetId(presetName);
        createCustomPreset(newId, presetName, newTemplates);
        activePresetId = newId;
        saveActivePresetId(newId);
      } else {
        // Update existing custom preset
        var custom = loadCustomPresets();
        custom[activePresetId].name = presetName;
        custom[activePresetId].templates = newTemplates;
        saveCustomPresets(custom);
      }

      templates = newTemplates;
      closeModal();
      onSave();
    });

    function closeModal() {
      document.getElementById('config-modal').remove();
      document.getElementById('config-modal-backdrop').remove();
    }

    // Close on Escape
    var escHandler = function(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
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
    console.log('Version: 2.1.0');
    console.group('Dependencies (via npm):');
    console.log('• turndown ^7.2.0');
    console.log('• @joplin/turndown-plugin-gfm ^1.0.64');
    console.groupEnd();
    console.log('Repository: https://github.com/michaelstingl/clipboard2markdown');

    var info = document.querySelector('#info');
    var pastebin = document.querySelector('#pastebin');
    var output = document.querySelector('#output');
    var wrapper = document.querySelector('#wrapper');
    var sectionButtons = document.querySelector('#section-buttons');

    // Initialize section buttons
    if (sectionButtons) {
      function refreshButtons() {
        renderSectionButtons(sectionButtons, output, wrapper, info, refreshButtons);
      }
      refreshButtons();

      // Config button handler (delegated since button is dynamically created)
      sectionButtons.addEventListener('click', function(e) {
        if (e.target.id === 'config-btn' || e.target.closest('#config-btn')) {
          openConfigModal(refreshButtons);
        }
      });
    }

    document.addEventListener('keydown', function (event) {
      // 0 for clear, ? for help, 1-9 for section paste (no modifiers)
      // Alt+0-9 for preset switching
      // Allow in #output textarea since it's for display, not typing
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        var key = event.key;
        var target = event.target;
        var isModalInput = target.closest('.config-modal') || target.closest('.help-modal');
        var isOtherInput = (target.tagName === 'INPUT' || target.isContentEditable);

        // Block shortcuts only in modal inputs and other input fields (not #output)
        if (!isModalInput && !isOtherInput) {
          // ? key for help
          if (key === '?') {
            event.preventDefault();
            openHelpModal();
            return;
          }

          // 0 key for clear
          if (key === '0') {
            event.preventDefault();
            output.value = '';
            pastebin.innerHTML = '';
            resetPasteCounter();
            info.classList.remove('hidden');
            wrapper.classList.add('hidden');
            return;
          }

          // 1-9 for section paste (templates)
          var template = templates.find(function(t) { return t.key === key; });
          if (template) {
            event.preventDefault();
            pasteAsSection(template, output, wrapper, info);
            return;
          }
        }
      }

      // Alt+0-9 for preset switching
      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        var target = event.target;
        var isModalInput = target.closest('.config-modal') || target.closest('.help-modal');
        var isOtherInput = (target.tagName === 'INPUT' || target.isContentEditable);

        if (!isModalInput && !isOtherInput) {
          // Alt+Zahl on macOS produces special characters, so use event.code
          var key = event.key;
          if (event.code && event.code.startsWith('Digit')) {
            key = event.code.replace('Digit', '');
          }

          var presetIndex = parseInt(key);
          if (!isNaN(presetIndex)) {
            // All presets in fixed order: Built-in first, then Custom
            var builtinIds = ['generic', 'azure-devops', 'github-issue', 'meeting-notes'];
            var customPresets = loadCustomPresets();
            var customIds = Object.keys(customPresets);
            var allPresetIds = builtinIds.concat(customIds);

            if (presetIndex >= 0 && presetIndex < allPresetIds.length) {
              event.preventDefault();
              var presetId = allPresetIds[presetIndex];
              var presetSelect = document.getElementById('preset-select');
              if (presetSelect) {
                presetSelect.value = presetId;
                presetSelect.dispatchEvent(new Event('change'));
              }
              return;
            }
          }
        }
      }

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
          resetPasteCounter();
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

        // Add paste comment with number
        var pasteNum = getNextPasteNumber();
        var pasteComment = formatPasteComment(pasteNum);

        // Add separator if there's existing content
        var separator = '';
        if (output.value.trim().length > 0) {
          separator = '\n\n';
        }

        // Move cursor to end before inserting
        output.selectionStart = output.value.length;
        output.selectionEnd = output.value.length;

        insert(output, separator + pasteComment + markdown);
        wrapper.classList.remove('hidden');
        output.focus();

        // Move cursor to end (not select all)
        output.selectionStart = output.value.length;
        output.selectionEnd = output.value.length;
      }, 200);
    });

    // Clear button functionality - return to initial screen
    var clearBtn = document.querySelector('#clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        output.value = '';
        pastebin.innerHTML = '';
        resetPasteCounter();
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
