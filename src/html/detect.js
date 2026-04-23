// Inspects the parsed HTML document and returns the paste source so the
// pipeline can dispatch to the right cleaner.
export function detectSource(doc) {
  if (doc.querySelector('ul.inline-task-list, [data-inline-tasks-content-id], .confluenceTable, .confluence-embedded-file-wrapper')) {
    return 'confluence';
  }
  if (doc.querySelector('o\\:p, [style*="mso-"], .MsoNormal, xml')) {
    return 'office';
  }
  return 'generic';
}
