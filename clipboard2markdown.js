import {
  BUILTIN_PRESETS,
  loadCustomPresets,
  saveCustomPresets,
  loadActivePresetId,
  saveActivePresetId,
  getAllPresets,
  getActivePreset,
  createCustomPreset,
  deleteCustomPreset,
  generatePresetId,
} from './src/presets/index.js';
import { cleanHtml } from './src/html/pipeline.js';
import { fixTablePipes } from './src/post-process/fix-table-pipes.js';
import { normalize } from './src/post-process/normalize.js';
import { createTurndownService } from './src/turndown/service.js';

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

  var turndownService = createTurndownService();

  var convert = function (str) {
    var cleanedHtml = cleanHtml(str);
    var markdown = turndownService.turndown(cleanedHtml);
    markdown = fixTablePipes(markdown);
    return normalize(markdown);
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
    html += '<tr><td><kbd>Ctrl</kbd>+<kbd>C</kbd></td><td>Copy all (when no selection)</td></tr>';
    html += '<tr><td><kbd>Ctrl</kbd>+<kbd>L</kbd></td><td>Clear output</td></tr>';
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
      document.removeEventListener('keydown', escHandler);
    }

    document.getElementById('close-help-btn').addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    // Close on Escape
    var escHandler = function(e) {
      if (e.key === 'Escape') {
        closeModal();
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
      document.removeEventListener('keydown', escHandler);
    }

    // Close on Escape
    var escHandler = function(e) {
      if (e.key === 'Escape') {
        closeModal();
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
        var key = event.key.toLowerCase();

        if (key === 'v') {
          // Paste via Clipboard API (same path as section paste, but without template)
          event.preventDefault();
          pasteAsSection({ format: '{content}' }, output, wrapper, info);
        } else if (key === 'c' && !wrapper.classList.contains('hidden')) {
          // Copy all output when nothing is selected
          var hasTextareaSelection = output.selectionStart !== output.selectionEnd;
          var hasPageSelection = window.getSelection().toString().length > 0;
          if (!hasTextareaSelection && !hasPageSelection && output.value.trim()) {
            event.preventDefault();
            navigator.clipboard.writeText(output.value);
          }
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
        a.download = 'clipboard2markdown_' + timestamp + '.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
  });

// Named export for tests. Phase 2 will replace this with src/convert.js.
export { convert };
