import { getActivePreset, loadActivePresetId, loadCustomPresets } from './src/presets/index.js';
import { convert } from './src/convert.js';
import { insert } from './src/ui/insert.js';
import { getNextPasteNumber, resetPasteCounter, formatPasteComment } from './src/ui/paste-counter.js';
import { openHelpModal } from './src/ui/help-modal.js';
import { openConfigModal } from './src/ui/config-modal.js';
import { renderSectionButtons } from './src/ui/section-buttons.js';

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
        renderSectionButtons(
          sectionButtons,
          function(template) { pasteAsSection(template, output, wrapper, info); },
          refreshButtons
        );
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
          var template = getActivePreset().templates.find(function(t) { return t.key === key; });
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
