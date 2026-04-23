// Monotonic counter that labels each pasted section so the generated
// markdown shows "Paste #1", "Paste #2", ... regardless of template.
let pasteCounter = 0;

export function getNextPasteNumber() {
  pasteCounter++;
  return pasteCounter;
}

export function resetPasteCounter() {
  pasteCounter = 0;
}

export function formatPasteComment(num, label) {
  if (label) {
    return '<!-- Paste #' + num + ': ' + label + ' -->\n\n';
  }
  return '<!-- Paste #' + num + ' -->\n\n';
}
