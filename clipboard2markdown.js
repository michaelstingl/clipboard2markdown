import { openConfigModal } from './src/ui/config-modal.js';
import { renderSectionButtons } from './src/ui/section-buttons.js';
import { pasteAsSection } from './src/clipboard/paste.js';
import { clearOutput } from './src/ui/clear.js';
import { downloadAsMarkdown } from './src/ui/download.js';
import { attachKeyboardHandlers } from './src/keyboard.js';

document.addEventListener('DOMContentLoaded', function () {
  console.log('%c clipboard2markdown ', 'background: #222; color: #bada55; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
  console.log('Version: 2.1.0');
  console.group('Dependencies (via npm):');
  console.log('• turndown ^7.2.0');
  console.log('• @joplin/turndown-plugin-gfm ^1.0.64');
  console.groupEnd();
  console.log('Repository: https://github.com/michaelstingl/clipboard2markdown');

  const info = document.querySelector('#info');
  const pastebin = document.querySelector('#pastebin');
  const output = document.querySelector('#output');
  const wrapper = document.querySelector('#wrapper');
  const sectionButtons = document.querySelector('#section-buttons');
  const ctx = { output, pastebin, info, wrapper };

  if (sectionButtons) {
    function refreshButtons() {
      renderSectionButtons(
        sectionButtons,
        function(template) { pasteAsSection(template, output, wrapper, info); },
        refreshButtons
      );
    }
    refreshButtons();

    // Config button is created dynamically inside renderSectionButtons,
    // so handle its clicks via delegation.
    sectionButtons.addEventListener('click', function(e) {
      if (e.target.id === 'config-btn' || e.target.closest('#config-btn')) {
        openConfigModal(refreshButtons);
      }
    });
  }

  attachKeyboardHandlers(ctx);

  const clearBtn = document.querySelector('#clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      clearOutput(ctx);
    });
  }

  const downloadBtn = document.querySelector('#download-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function () {
      downloadAsMarkdown(output.value);
    });
  }
});
