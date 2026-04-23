// Inline formatting: sup/sub, emphasis/strong with whitespace handling,
// kbd/samp/tt as code spans.
function wrapOutsideSpaces(content, left, right) {
  if (!content.trim()) return '';
  const leadingSpace = content.match(/^\s+/) ? content.match(/^\s+/)[0] : '';
  const trailingSpace = content.match(/\s+$/) ? content.match(/\s+$/)[0] : '';
  if (leadingSpace || trailingSpace) {
    content = content.trim();
  }
  return leadingSpace + left + content + right + trailingSpace;
}

export function registerInlineRules(turndownService) {
  turndownService.addRule('sup', {
    filter: 'sup',
    replacement: function (content) {
      return '^' + content + '^';
    }
  });

  turndownService.addRule('sub', {
    filter: 'sub',
    replacement: function (content) {
      return '~' + content + '~';
    }
  });

  turndownService.addRule('emphasisWithSpaces', {
    filter: ['em', 'i', 'cite', 'var'],
    replacement: function (content) {
      return wrapOutsideSpaces(content, '*', '*');
    }
  });

  turndownService.addRule('strongWithSpaces', {
    filter: ['strong', 'b'],
    replacement: function (content) {
      return wrapOutsideSpaces(content, '**', '**');
    }
  });

  turndownService.addRule('kbd-samp-tt', {
    filter: function (node) {
      return node.nodeName === 'KBD' ||
             node.nodeName === 'SAMP' ||
             node.nodeName === 'TT';
    },
    replacement: function (content) {
      return '`' + content + '`';
    }
  });

  // Pandoc-style highlight (==text==). No universal markdown standard
  // for <mark>, but this is what Pandoc, Obsidian, and most popular
  // dialects use.
  turndownService.addRule('mark', {
    filter: 'mark',
    replacement: function (content) {
      if (!content.trim()) return '';
      return wrapOutsideSpaces(content, '==', '==');
    }
  });
}
