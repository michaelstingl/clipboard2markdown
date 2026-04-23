import TurndownService from 'turndown';
import { tables, strikethrough, taskListItems } from '@joplin/turndown-plugin-gfm';
import { registerInlineRules } from './rules/inline.js';
import { registerStructuralRules } from './rules/structural.js';

// Factory for a configured TurndownService instance. Options match the
// Pandoc-flavored markdown this tool has produced since day one; the
// built-in rules for h1/h2 (setext), <hr>, and <br> pick up these
// settings directly, so we don't need custom rules for them.
export function createTurndownService() {
  const service = new TurndownService({
    headingStyle: 'setext',
    hr: '* * * * *',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    br: '\\',
  });

  service.use([tables, strikethrough, taskListItems]);

  registerStructuralRules(service);
  registerInlineRules(service);

  return service;
}
