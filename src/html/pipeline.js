import { detectSource } from './detect.js';
import { applyOfficeCleanup } from './cleaners/office.js';
import { applyConfluenceCleanup } from './cleaners/confluence.js';

const CLEANERS = {
  office: applyOfficeCleanup,
  confluence: applyConfluenceCleanup,
};

// Baseline cleanup that always runs before source-specific cleaners.
// <script>/<style> content otherwise leaks into the rendered output
// (turndown keeps their text contents). <colgroup>/<col> break the
// turndown-gfm plugin's heading-row detection — it walks previousSibling
// to decide whether a TH-only <tbody>/<tr> is a header, and a leading
// <colgroup> makes it give up and emit a spurious empty header row.
function applyBaselineCleanup(doc) {
  doc.querySelectorAll('script, style, colgroup, col').forEach(function(el) {
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
