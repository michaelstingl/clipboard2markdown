// Pandoc-style setext headings (h1 underlined with `=`, h2 with `-`).
export function registerHeadingRules(turndownService) {
  turndownService.addRule('h1', {
    filter: 'h1',
    replacement: function (content) {
      const underline = Array(content.length + 1).join('=');
      return '\n\n' + content + '\n' + underline + '\n\n';
    }
  });

  turndownService.addRule('h2', {
    filter: 'h2',
    replacement: function (content) {
      const underline = Array(content.length + 1).join('-');
      return '\n\n' + content + '\n' + underline + '\n\n';
    }
  });
}
