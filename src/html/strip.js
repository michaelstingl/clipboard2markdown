// Baseline strip list: elements whose tag *and* text content must be
// dropped before turndown sees the DOM. Turndown's own defaultReplacement
// drops the tag but keeps inner text; for the entries below that text
// would leak content the user never sees on the source page.
//
// Why DOM-preprocessing and not turndownService.remove()?
// Turndown's remove() filter accepts tagnames or a (node, options)
// function; CSS attribute selectors (`[hidden]`,
// `[style*="display:none"]`) aren't expressible in that API without
// dropping to a function. querySelectorAll keeps the policy declarative.
//
// Each entry has a comment so the list stays auditable.
const STRIP_SELECTORS = [
  // executable / styling
  'script',                            // inline JS text would render as prose
  'style',                             // CSS rules would render as prose
  // turndown-gfm plugin quirk
  'colgroup',                          // breaks isFirstTbody heading-row detection
  'col',                               // ditto (child of colgroup)
  // browser-only fallbacks that never surface for a sighted JS user
  'noscript',                          // no-JS fallback prose
  'iframe',                            // iframe-load-failure fallback prose
  'object',                            // object-embed fallback prose
  'embed',                             // same as object, but void
  // hidden-by-default UI surfaces
  'dialog',                            // modal content, typically closed
  // media with browser-only fallback text
  'video',                             // fallback text shown only on media failure
  'audio',                             // same
  // explicit invisibility signals
  '[hidden]',                          // HTML5 hidden attribute
  '[style*="display:none"]',           // inline CSS-hidden (no space)
  '[style*="display: none"]',          // inline CSS-hidden (with space)
].join(', ');

export function stripNoise(doc) {
  doc.querySelectorAll(STRIP_SELECTORS).forEach(function(el) {
    el.remove();
  });
}
