import {
  getActivePreset,
  loadActivePresetId,
  saveActivePresetId,
  loadCustomPresets,
  saveCustomPresets,
  createCustomPreset,
  deleteCustomPreset,
  generatePresetId,
} from '../presets/index.js';

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
}

export function openConfigModal(onSave) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'config-modal-backdrop';

  const modal = document.createElement('div');
  modal.className = 'config-modal';
  modal.id = 'config-modal';

  const currentPreset = getActivePreset();
  const isBuiltin = currentPreset.builtin;

  let html = '<h3>Edit Template: <span id="preset-name-display">' + escapeHtml(currentPreset.name) + '</span></h3>';

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

  const tempTemplates = JSON.parse(JSON.stringify(currentPreset.templates));

  function renderTemplateList() {
    const list = document.getElementById('template-list');
    list.innerHTML = '';

    tempTemplates.forEach(function(t, index) {
      const item = document.createElement('div');
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
        const idx = parseInt(this.getAttribute('data-index'));
        tempTemplates.splice(idx, 1);
        renderTemplateList();
      });
    });
  }

  renderTemplateList();

  document.getElementById('add-template-btn').addEventListener('click', function() {
    const nextKey = (tempTemplates.length + 1).toString();
    tempTemplates.push({ key: nextKey, label: 'New Section', format: '## New Section\n\n{content}' });
    renderTemplateList();
  });

  const deleteBtn = document.getElementById('delete-preset-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', function() {
      if (confirm('Delete this custom template "' + currentPreset.name + '"?')) {
        deleteCustomPreset(loadActivePresetId());
        saveActivePresetId('generic');
        closeModal();
        onSave();
      }
    });
  }

  document.getElementById('cancel-config-btn').addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  document.getElementById('save-config-btn').addEventListener('click', function() {
    const items = document.querySelectorAll('.template-item');
    const newTemplates = [];
    items.forEach(function(item) {
      const key = item.querySelector('.template-key').value.trim();
      const label = item.querySelector('.template-label').value.trim();
      const format = item.querySelector('.template-format').value;
      if (key && label && format) {
        newTemplates.push({ key: key, label: label, format: format });
      }
    });

    const presetName = document.getElementById('preset-name-input').value.trim() || 'Custom Template';

    if (isBuiltin) {
      const newId = generatePresetId(presetName);
      createCustomPreset(newId, presetName, newTemplates);
      saveActivePresetId(newId);
    } else {
      const activeId = loadActivePresetId();
      const custom = loadCustomPresets();
      custom[activeId].name = presetName;
      custom[activeId].templates = newTemplates;
      saveCustomPresets(custom);
    }

    closeModal();
    onSave();
  });

  function closeModal() {
    document.getElementById('config-modal').remove();
    document.getElementById('config-modal-backdrop').remove();
    document.removeEventListener('keydown', escHandler);
  }

  const escHandler = function(e) {
    if (e.key === 'Escape') closeModal();
  };
  document.addEventListener('keydown', escHandler);
}
