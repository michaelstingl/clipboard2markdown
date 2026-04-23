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
        const index = Array.prototype.indexOf.call(parent.children, node) + 1;
        prefix = index + '. ';
        while (prefix.length < 4) {
          prefix += ' ';
        }
      }

      return prefix + content;
    }
  });
}
