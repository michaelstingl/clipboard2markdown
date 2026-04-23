import { getActivePreset, loadCustomPresets } from './presets/index.js';
import { pasteAsSection } from './clipboard/paste.js';
import { openHelpModal } from './ui/help-modal.js';
import { clearOutput } from './ui/clear.js';
import { downloadAsMarkdown } from './ui/download.js';
import { downloadRawCapture } from './ui/capture-button.js';

const BUILTIN_IDS = ['generic', 'azure-devops', 'github-issue', 'meeting-notes'];

function isBlockedTarget(target) {
  const inModal = target.closest('.config-modal') || target.closest('.help-modal');
  const inInput = target.tagName === 'INPUT' || target.isContentEditable;
  return inModal || inInput;
}

// Registers the app-wide keydown handler. Context holds the DOM refs
// the handler pokes at.
export function attachKeyboardHandlers(ctx) {
  const { output, wrapper, info, pastebin } = ctx;

  document.addEventListener('keydown', function (event) {
    // No modifier: 0 clears, ? shows help, 1-9 triggers section paste.
    if (!event.ctrlKey && !event.metaKey && !event.altKey) {
      const key = event.key;
      if (!isBlockedTarget(event.target)) {
        if (key === '?') {
          event.preventDefault();
          openHelpModal();
          return;
        }
        if (key === '0') {
          event.preventDefault();
          clearOutput(ctx);
          return;
        }
        if (key === 'r' || key === 'R') {
          event.preventDefault();
          downloadRawCapture();
          return;
        }
        const template = getActivePreset().templates.find(function(t) { return t.key === key; });
        if (template) {
          event.preventDefault();
          pasteAsSection(template, output, wrapper, info);
          return;
        }
      }
    }

    // Alt+0-9: preset switching (uses event.code on macOS because
    // Alt+digit produces special characters there).
    if (event.altKey && !event.ctrlKey && !event.metaKey) {
      if (!isBlockedTarget(event.target)) {
        let key = event.key;
        if (event.code && event.code.startsWith('Digit')) {
          key = event.code.replace('Digit', '');
        }

        const presetIndex = parseInt(key);
        if (!isNaN(presetIndex)) {
          const customIds = Object.keys(loadCustomPresets());
          const allPresetIds = BUILTIN_IDS.concat(customIds);

          if (presetIndex >= 0 && presetIndex < allPresetIds.length) {
            event.preventDefault();
            const presetId = allPresetIds[presetIndex];
            const presetSelect = document.getElementById('preset-select');
            if (presetSelect) {
              presetSelect.value = presetId;
              presetSelect.dispatchEvent(new Event('change'));
            }
            return;
          }
        }
      }
    }

    // Ctrl/Cmd shortcuts: V=paste, C=copy-all, L=clear, S=download.
    if (event.ctrlKey || event.metaKey) {
      const key = event.key.toLowerCase();

      if (key === 'v') {
        event.preventDefault();
        pasteAsSection({ format: '{content}' }, output, wrapper, info);
      } else if (key === 'c' && !wrapper.classList.contains('hidden')) {
        const hasTextareaSelection = output.selectionStart !== output.selectionEnd;
        const hasPageSelection = window.getSelection().toString().length > 0;
        if (!hasTextareaSelection && !hasPageSelection && output.value.trim()) {
          event.preventDefault();
          navigator.clipboard.writeText(output.value);
        }
      } else if (key === 'l' && !wrapper.classList.contains('hidden')) {
        event.preventDefault();
        clearOutput(ctx);
      } else if (key === 's' && !wrapper.classList.contains('hidden')) {
        event.preventDefault();
        downloadAsMarkdown(output.value);
      }
    }
  });
}
