import { cleanHtml } from './html/pipeline.js';
import { createTurndownService } from './turndown/service.js';
import { fixTablePipes } from './post-process/fix-table-pipes.js';
import { normalize } from './post-process/normalize.js';

const turndownService = createTurndownService();

export function convert(html) {
  const cleaned = cleanHtml(html);
  const markdown = turndownService.turndown(cleaned);
  return normalize(fixTablePipes(markdown));
}
