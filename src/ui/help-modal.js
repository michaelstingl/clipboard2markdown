import {
  BUILTIN_PRESETS,
  loadCustomPresets,
  getActivePreset,
} from '../presets/index.js';

const BUILTIN_IDS = ['generic', 'azure-devops', 'github-issue', 'meeting-notes'];

export function openHelpModal() {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'help-modal-backdrop';

  const modal = document.createElement('div');
  modal.className = 'config-modal help-modal';
  modal.id = 'help-modal';

  let html = '<h3>Keyboard Shortcuts</h3>';

  html += '<h4 class="shortcut-section-title">Preset Switching</h4>';
  html += '<table class="shortcuts-table"><tbody>';
  BUILTIN_IDS.forEach(function(id, index) {
    const preset = BUILTIN_PRESETS[id];
    html += '<tr><td><kbd>Alt</kbd>+<kbd>' + index + '</kbd></td><td>' + preset.name + '</td></tr>';
  });
  const customPresets = loadCustomPresets();
  Object.keys(customPresets).forEach(function(id, index) {
    const presetIndex = BUILTIN_IDS.length + index;
    html += '<tr><td><kbd>Alt</kbd>+<kbd>' + presetIndex + '</kbd></td><td>' + customPresets[id].name + '</td></tr>';
  });
  html += '</tbody></table>';

  html += '<h4 class="shortcut-section-title">Section Paste (current preset)</h4>';
  html += '<table class="shortcuts-table"><tbody>';
  getActivePreset().templates.forEach(function(t) {
    html += '<tr><td><kbd>' + t.key + '</kbd></td><td>Paste as ' + t.label + '</td></tr>';
  });
  html += '</tbody></table>';

  html += '<h4 class="shortcut-section-title">General</h4>';
  html += '<table class="shortcuts-table"><tbody>';
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

  const escHandler = function(e) {
    if (e.key === 'Escape') closeModal();
  };

  document.getElementById('close-help-btn').addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', escHandler);
}
