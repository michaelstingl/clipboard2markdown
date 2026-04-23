import { captureRaw } from '../clipboard/capture.js';

// Read the clipboard, bundle every MIME-type with its raw bytes, and
// hand the user a capture-<timestamp>.json download. Intended for
// diagnosing encoding-quirks and building test fixtures, not for
// routine use — the file contains the full raw clipboard contents.
export async function downloadRawCapture() {
  try {
    const capture = await captureRaw();
    const json = JSON.stringify(capture, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = capture.capturedAt.replace(/[:.]/g, '-').replace('Z', '');
    a.download = 'capture-' + timestamp + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Raw clipboard capture failed:', err);
    alert('Could not capture clipboard.\n\nError: ' + err.message);
  }
}
