import { detectSource } from './detect.js';
import { applyOfficeCleanup } from './cleaners/office.js';
import { applyConfluenceCleanup } from './cleaners/confluence.js';

const CLEANERS = {
  office: applyOfficeCleanup,
  confluence: applyConfluenceCleanup,
};

// Elements whose text content must not reach the markdown output. Some
// are executable (script/style), some are browser-only fallbacks that
// never surface for a sighted reader (noscript, iframe/object/embed
// fallback text, video/audio fallback text), and some are UI surfaces
// hidden by default (dialog without `open`).
//
// colgroup/col are removed because a leading <colgroup> sibling breaks
// the turndown-gfm plugin's heading-row detection — its isFirstTbody
// check walks previousSibling and only accepts a blank THEAD; a
// COLGROUP sibling makes it bail, which then emits a spurious empty
// header row to satisfy markdown's header requirement.
const STRIP_SELECTORS = [
  'script',
  'style',
  'colgroup',
  'col',
  'noscript',
  'iframe',
  'object',
  'embed',
  'dialog',
  'video',
  'audio',
  '[hidden]',
  '[style*="display:none"]',
  '[style*="display: none"]',
].join(', ');

function applyBaselineCleanup(doc) {
  doc.querySelectorAll(STRIP_SELECTORS).forEach(function(el) {
    el.remove();
  });
}

export function cleanHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  applyBaselineCleanup(doc);
  const source = detectSource(doc);
  const cleaner = CLEANERS[source];
  if (cleaner) cleaner(doc);
  return doc.body.innerHTML;
}
