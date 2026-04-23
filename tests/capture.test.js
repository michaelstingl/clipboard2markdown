import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { captureRaw } from '../src/clipboard/capture.js';

function makeTextBlob(str) {
  const bytes = new TextEncoder().encode(str);
  return {
    text: async () => str,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  };
}

function makeBinaryBlob(bytes) {
  return {
    text: async () => { throw new Error('not a text blob'); },
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  };
}

function installFakeClipboard(items) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      read: async () => items,
    },
  });
}

function uninstallFakeClipboard() {
  delete navigator.clipboard;
}

describe('captureRaw()', () => {
  afterEach(() => {
    uninstallFakeClipboard();
  });

  test('collects text/html and text/plain with string, bytes_hex, byte_length', async () => {
    const htmlBlob = makeTextBlob('<p>Hällo</p>');
    const plainBlob = makeTextBlob('Hällo');
    installFakeClipboard([{
      types: ['text/html', 'text/plain'],
      getType: async (type) => ({
        'text/html': htmlBlob,
        'text/plain': plainBlob,
      })[type],
    }]);

    const result = await captureRaw();

    expect(typeof result.capturedAt).toBe('string');
    expect(result.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(typeof result.userAgent).toBe('string');

    const html = result.types['text/html'];
    expect(html.string).toBe('<p>Hällo</p>');
    expect(html.bytes_hex).toMatch(/^[0-9a-f]+$/);
    expect(html.byte_length).toBe(new TextEncoder().encode('<p>Hällo</p>').byteLength);
    expect(html.bytes_base64).toBeUndefined();

    const plain = result.types['text/plain'];
    expect(plain.string).toBe('Hällo');
    expect(plain.bytes_hex.length).toBe(plain.byte_length * 2);
  });

  test('binary types get bytes_base64 instead of string', async () => {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG magic
    const pngBlob = makeBinaryBlob(pngBytes);
    installFakeClipboard([{
      types: ['image/png'],
      getType: async () => pngBlob,
    }]);

    const result = await captureRaw();
    const png = result.types['image/png'];

    expect(png.string).toBeUndefined();
    expect(png.bytes_hex).toBe('89504e470d0a1a0a');
    expect(png.byte_length).toBe(8);
    expect(png.bytes_base64).toBe('iVBORw0KGgo=');
  });

  test('throws when clipboard API is unavailable', async () => {
    uninstallFakeClipboard();
    await expect(captureRaw()).rejects.toThrow(/Clipboard API not supported/);
  });
});
