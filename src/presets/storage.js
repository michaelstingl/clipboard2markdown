import { BUILTIN_PRESETS } from './builtin.js';

const STORAGE_KEY_ACTIVE = 'clipboard2markdown_active_preset';
const STORAGE_KEY_CUSTOM = 'clipboard2markdown_custom_presets';

export function loadCustomPresets() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CUSTOM);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Could not load custom presets from localStorage:', e);
  }
  return {};
}

export function saveCustomPresets(presets) {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(presets));
  } catch (e) {
    console.warn('Could not save custom presets to localStorage:', e);
  }
}

export function loadActivePresetId() {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE) || 'generic';
  } catch (e) {
    return 'generic';
  }
}

export function saveActivePresetId(id) {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE, id);
  } catch (e) {
    console.warn('Could not save active preset:', e);
  }
}

export function getAllPresets() {
  const custom = loadCustomPresets();
  return Object.assign({}, BUILTIN_PRESETS, custom);
}

export function getActivePreset() {
  const allPresets = getAllPresets();
  const activeId = loadActivePresetId();
  return allPresets[activeId] || BUILTIN_PRESETS['generic'];
}

export function createCustomPreset(id, name, templates) {
  const custom = loadCustomPresets();
  custom[id] = {
    name: name,
    builtin: false,
    templates: templates
  };
  saveCustomPresets(custom);
}

export function deleteCustomPreset(id) {
  const custom = loadCustomPresets();
  if (custom[id]) {
    delete custom[id];
    saveCustomPresets(custom);
    if (loadActivePresetId() === id) {
      saveActivePresetId('generic');
    }
  }
}

export function generatePresetId(name) {
  return 'custom-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
}
