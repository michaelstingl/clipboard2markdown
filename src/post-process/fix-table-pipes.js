// Lines that look like markdown list items must not be rewritten as
// table rows. The list-item prefix (`-   `, `1.  `, task list `- [x] `)
// contains multiple whitespace and would otherwise trip the
// tab-or-multispace-to-pipe heuristic below.
const LIST_ITEM_RE = /^\s*(?:[-*+]|\d+\.)\s/;

function looksLikeListItem(line) {
  return LIST_ITEM_RE.test(line);
}

export function fixTablePipes(markdown) {
  const lines = markdown.split('\n');
  const result = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmedLine = line.trim();

    if (trimmedLine === '|') {
      continue;
    }

    if (i > 0 && i < lines.length - 1) {
      const prevLine = lines[i - 1].trim();
      const nextLine = lines[i + 1].trim();

      if (!trimmedLine.includes('|') && prevLine && nextLine &&
          !looksLikeListItem(line) &&
          !looksLikeListItem(lines[i - 1]) &&
          !looksLikeListItem(lines[i + 1]) &&
          (prevLine.includes('\t') || prevLine.match(/\s{2,}/)) &&
          (nextLine.includes('\t') || nextLine.match(/\s{2,}/))) {
        const cells = trimmedLine.split(/\t+|\s{2,}/);
        if (cells.length > 1) {
          line = '| ' + cells.join(' | ') + ' |';

          if (!inTable) {
            inTable = true;
            result.push(line);
            const separator = '|' + cells.map(function(cell) {
              return ' ' + '-'.repeat(Math.max(3, cell.length)) + ' ';
            }).join('|') + '|';
            result.push(separator);
            continue;
          }
        }
      }
    }

    if (trimmedLine.includes('|')) {
      line = line.replace(/\n\s*\|\s*\n/g, ' | ');
      line = line.replace(/\n\s*\|/g, ' |');
      line = line.replace(/\|\s*\n/g, '| ');
      inTable = true;
    } else if (inTable && trimmedLine === '') {
      inTable = false;
    }

    result.push(line);
  }

  return result.join('\n');
}
