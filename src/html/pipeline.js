import { detectSource } from './detect.js';
import { applyOfficeCleanup } from './cleaners/office.js';
import { applyConfluenceCleanup } from './cleaners/confluence.js';

const CLEANERS = {
  office: applyOfficeCleanup,
  confluence: applyConfluenceCleanup,
};

export function cleanHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const source = detectSource(doc);
  const cleaner = CLEANERS[source];
  if (cleaner) cleaner(doc);
  return doc.body.innerHTML;
}
