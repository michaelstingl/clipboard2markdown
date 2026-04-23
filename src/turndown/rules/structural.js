// Structural rules: whitespace-only text nodes, br, hr, links, list items.
export function registerStructuralRules(turndownService) {
  turndownService.addRule('whitespaceOnly', {
    filter: function (node) {
      return node.nodeType === 3 && !node.textContent.trim();
    },
    replacement: function () {
      return '';
    }
  });

  turndownService.addRule('br', {
    filter: 'br',
    replacement: function () {
      return '\\\n';
    }
  });

  turndownService.addRule('hr', {
    filter: 'hr',
    replacement: function () {
      return '\n\n* * * * *\n\n';
    }
  });

  turndownService.addRule('link', {
    filter: function (node) {
      return node.nodeName === 'A' && node.getAttribute('href');
    },
    replacement: function (content, node) {
      const leadingSpace = content.match(/^\s+/) ? content.match(/^\s+/)[0] : '';
      const trailingSpace = content.match(/\s+$/) ? content.match(/\s+$/)[0] : '';
      if (leadingSpace || trailingSpace) {
        content = content.trim();
      }

      const url = node.getAttribute('href');
      const titlePart = node.title ? ' "' + node.title + '"' : '';
      let linkMarkdown;

      if (content === url) {
        linkMarkdown = '<' + url + '>';
      } else if (url === ('mailto:' + content)) {
        linkMarkdown = '<' + content + '>';
      } else {
        linkMarkdown = '[' + content + '](' + url + titlePart + ')';
      }

      return leadingSpace + linkMarkdown + trailingSpace;
    }
  });

  turndownService.addRule('listItem', {
    filter: 'li',
    replacement: function (content, node) {
      content = content.replace(/^\s+/, '').replace(/\n/gm, '\n    ');
      let prefix = '-   ';
      const parent = node.parentNode;

      if (/ol/i.test(parent.nodeName)) {
        // Honour <ol start="N">: the first item's number is the start
        // attribute (or 1 by default), subsequent items increment.
        const positionInParent = Array.prototype.indexOf.call(parent.children, node);
        const startAttr = parseInt(parent.getAttribute('start'), 10);
        const base = Number.isFinite(startAttr) ? startAttr : 1;
        const index = base + positionInParent;
        prefix = index + '. ';
        while (prefix.length < 4) {
          prefix += ' ';
        }
      }

      // Append a newline when another item follows, matching turndown's
      // default listItem behaviour. Without this, sibling <li>s collapse
      // onto one line.
      const trailing = node.nextSibling && !/\n$/.test(content) ? '\n' : '';
      return prefix + content + trailing;
    }
  });
}
