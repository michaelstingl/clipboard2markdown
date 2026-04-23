import { stripNoise } from './strip.js';
import { detectSource } from './detect.js';
import { applyOfficeCleanup } from './cleaners/office.js';
import { applyConfluenceCleanup } from './cleaners/confluence.js';

const CLEANERS = {
  office: applyOfficeCleanup,
  confluence: applyConfluenceCleanup,
};

// Three-stage cleanup: strip noise unconditionally, detect the paste
// source, then apply the source-specific cleaner. Source-specific
// cleaners run *after* the strip so they never have to worry about
// script/style/hidden nodes.
export function cleanHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  stripNoise(doc);
  const source = detectSource(doc);
  const cleaner = CLEANERS[source];
  if (cleaner) cleaner(doc);
  return doc.body.innerHTML;
}
