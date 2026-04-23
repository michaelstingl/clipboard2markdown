// Structural rules that extend or override turndown's built-ins.
// What's NOT here, because turndown already handles it:
//   * setext headings  — config `headingStyle: 'setext'` drives h1/h2
//   * horizontal rule  — config `hr: '* * * * *'` drives <hr>
//   * line break       — config `br: '\\'` drives <br> (pandoc style)
//   * list item        — turndown's default listItem rule honours
//                        <ol start>, sibling-newlines, and nested
//                        indentation; the bulletListMarker+'   ' prefix
//                        matches our pandoc 3-space indent exactly.
export function registerStructuralRules(turndownService) {
  // Suppress whitespace-only text nodes so block boundaries stay tight.
  turndownService.addRule('whitespaceOnly', {
    filter: function (node) {
      return node.nodeType === 3 && !node.textContent.trim();
    },
    replacement: function () {
      return '';
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

  // Pandoc-style definition list:
  //   Term
  //   : Definition
  turndownService.addRule('definitionTerm', {
    filter: 'dt',
    replacement: function (content) {
      return '\n\n' + content.trim();
    }
  });

  turndownService.addRule('definitionDescription', {
    filter: 'dd',
    replacement: function (content) {
      return '\n: ' + content.trim();
    }
  });

  turndownService.addRule('definitionList', {
    filter: 'dl',
    replacement: function (content) {
      return '\n\n' + content.trim() + '\n\n';
    }
  });

}
