import TurndownService from 'turndown';
import { tables, strikethrough, taskListItems } from '@joplin/turndown-plugin-gfm';
import { registerHeadingRules } from './rules/headings.js';
import { registerInlineRules } from './rules/inline.js';
import { registerStructuralRules } from './rules/structural.js';

// Factory for a configured TurndownService instance. Options match the
// Pandoc-flavored markdown this tool has produced since day one.
export function createTurndownService() {
  const service = new TurndownService({
    headingStyle: 'setext',
    hr: '* * * * *',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined'
  });

  service.use([tables, strikethrough, taskListItems]);

  registerStructuralRules(service);
  registerHeadingRules(service);
  registerInlineRules(service);

  return service;
}
