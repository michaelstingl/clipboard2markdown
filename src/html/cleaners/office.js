export function applyOfficeCleanup(doc) {
  const officeTags = doc.querySelectorAll('o\\:p, o\\:smarttagtype, xml, style');
  officeTags.forEach(function(el) { el.remove(); });

  const bookmarkSpans = doc.querySelectorAll('span[style*="mso-bookmark"]');
  bookmarkSpans.forEach(function(span) {
    const text = doc.createTextNode(span.textContent);
    span.parentNode.replaceChild(text, span);
  });

  const spans = doc.querySelectorAll('span');
  spans.forEach(function(span) {
    const style = span.getAttribute('style') || '';
    if (style && !style.match(/(?:^|;)\s*(?:font-weight|font-style|text-decoration)\s*:/i)) {
      const cleanStyle = style.replace(/mso-[^;]+;?/gi, '')
                              .replace(/font-family:[^;]+;?/gi, '')
                              .replace(/font-size:[^;]+;?/gi, '')
                              .replace(/color:#333333;?/gi, '')
                              .trim();
      if (!cleanStyle) {
        while (span.firstChild) {
          span.parentNode.insertBefore(span.firstChild, span);
        }
        span.remove();
      }
    }
  });
}
