// Raw clipboard capture for debugging: reads every MIME-type the browser
// exposes and records each one three ways — decoded string (for text
// types), raw bytes as hex, and raw bytes as base64 (for binary types).
//
// The hex dump is the useful bit — it surfaces BOMs, zero-width
// characters, smart-quote encodings, and other sonderlocken that get
// smoothed over by the decoded string.

function bytesToHex(bytes) {
  const hex = new Array(bytes.byteLength);
  for (let i = 0; i < bytes.byteLength; i++) {
    hex[i] = bytes[i].toString(16).padStart(2, '0');
  }
  return hex.join('');
}

function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function captureRaw() {
  if (!navigator.clipboard || !navigator.clipboard.read) {
    throw new Error('Clipboard API not supported (navigator.clipboard.read is missing)');
  }

  const items = await navigator.clipboard.read();
  const types = {};

  for (const item of items) {
    for (const type of item.types) {
      const blob = await item.getType(type);
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const entry = {
        byte_length: bytes.byteLength,
        bytes_hex: bytesToHex(bytes),
      };

      if (type.startsWith('text/')) {
        entry.string = new TextDecoder('utf-8').decode(bytes);
      } else {
        entry.bytes_base64 = bytesToBase64(bytes);
      }

      types[type] = entry;
    }
  }

  return {
    capturedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    types,
  };
}
