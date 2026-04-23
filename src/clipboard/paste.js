import { convert } from '../convert.js';
import { insert } from '../ui/insert.js';
import { getNextPasteNumber, formatPasteComment } from '../ui/paste-counter.js';

// Reads the clipboard (preferring HTML over plain text), converts to
// markdown, applies the template format, tags it with a paste comment,
// and inserts it at the end of the output textarea.
export async function pasteAsSection(template, output, wrapper, info) {
  try {
    let html = '';
    let plainText = '';

    if (navigator.clipboard && navigator.clipboard.read) {
      try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          if (item.types.includes('text/html')) {
            const blob = await item.getType('text/html');
            html = await blob.text();
          }
          if (item.types.includes('text/plain')) {
            const blob = await item.getType('text/plain');
            plainText = await blob.text();
          }
        }
      } catch (e) {
        plainText = await navigator.clipboard.readText();
      }
    } else if (navigator.clipboard && navigator.clipboard.readText) {
      plainText = await navigator.clipboard.readText();
    } else {
      throw new Error('Clipboard API not supported');
    }

    const content = html ? convert(html) : plainText;
    const formatted = template.format.replace('{content}', content);

    const pasteNum = getNextPasteNumber();
    const pasteComment = formatPasteComment(pasteNum, template.label);

    let separator = '';
    if (output.value.trim().length > 0) {
      separator = '\n\n';
    }

    output.selectionStart = output.value.length;
    output.selectionEnd = output.value.length;
    insert(output, separator + pasteComment + formatted);

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
