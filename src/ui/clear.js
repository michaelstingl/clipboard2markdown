import { resetPasteCounter } from './paste-counter.js';

// Reset the output textarea back to the initial "empty" state and
// re-show the info panel.
export function clearOutput({ output, pastebin, info, wrapper }) {
  output.value = '';
  pastebin.innerHTML = '';
  resetPasteCounter();
  info.classList.remove('hidden');
  wrapper.classList.add('hidden');
}
