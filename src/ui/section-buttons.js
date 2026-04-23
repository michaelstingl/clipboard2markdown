import {
  BUILTIN_PRESETS,
  getActivePreset,
  loadActivePresetId,
  saveActivePresetId,
  loadCustomPresets,
} from '../presets/index.js';
import { openHelpModal } from './help-modal.js';

const BUILTIN_IDS = ['generic', 'azure-devops', 'github-issue', 'meeting-notes'];

export function renderSectionButtons(container, onTemplateClick, onPresetChange) {
  container.innerHTML = '';

  const presetRow = document.createElement('div');
  presetRow.className = 'preset-row';

  const presetLabel = document.createElement('span');
  presetLabel.className = 'preset-label';
  presetLabel.textContent = 'Template:';
  presetRow.appendChild(presetLabel);

  const presetSelect = document.createElement('select');
  presetSelect.className = 'preset-select';
  presetSelect.id = 'preset-select';

  const activeId = loadActivePresetId();

  const builtinGroup = document.createElement('optgroup');
  builtinGroup.label = 'Built-in';
  BUILTIN_IDS.forEach(function(id, index) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = '[Alt+' + index + '] ' + BUILTIN_PRESETS[id].name;
    if (id === activeId) opt.selected = true;
    builtinGroup.appendChild(opt);
  });
  presetSelect.appendChild(builtinGroup);

  const customPresets = loadCustomPresets();
  const customIds = Object.keys(customPresets);
  if (customIds.length > 0) {
    const customGroup = document.createElement('optgroup');
    customGroup.label = 'Custom';
    customIds.forEach(function(id, index) {
      const opt = document.createElement('option');
      opt.value = id;
      const shortcutIndex = BUILTIN_IDS.length + index;
      opt.textContent = '[Alt+' + shortcutIndex + '] ' + customPresets[id].name;
      if (id === activeId) opt.selected = true;
      customGroup.appendChild(opt);
    });
    presetSelect.appendChild(customGroup);
  }

  presetSelect.addEventListener('change', function() {
    saveActivePresetId(this.value);
    if (onPresetChange) onPresetChange();
  });

  presetRow.appendChild(presetSelect);

  const configBtn = document.createElement('button');
  configBtn.className = 'btn btn-outline-secondary btn-sm';
  configBtn.id = 'config-btn';
  configBtn.innerHTML = '⚙';
  configBtn.title = 'Configure templates';
  presetRow.appendChild(configBtn);

  const helpBtn = document.createElement('button');
  helpBtn.className = 'btn btn-outline-secondary btn-sm';
  helpBtn.id = 'help-btn';
  helpBtn.innerHTML = '?';
  helpBtn.title = 'Keyboard shortcuts (?)';
  helpBtn.addEventListener('click', openHelpModal);
  presetRow.appendChild(helpBtn);

  container.appendChild(presetRow);

  const buttonsRow = document.createElement('div');
  buttonsRow.className = 'section-buttons-row';

  getActivePreset().templates.forEach(function(template) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline-primary btn-sm section-btn';
    btn.setAttribute('data-key', template.key);
    btn.innerHTML = '<span class="shortcut-key">' + template.key + '</span> ' + template.label;
    btn.title = 'Paste as ' + template.label + ' (or press ' + template.key + ')';
    btn.addEventListener('click', function() {
      onTemplateClick(template);
    });
    buttonsRow.appendChild(btn);
  });

  container.appendChild(buttonsRow);
}
