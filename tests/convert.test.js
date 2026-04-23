import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { convert } from '../src/convert.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const fixtures = [
  'office-word',
  'confluence-task-list',
  'confluence-table',
  'github-issue',
  'azure-devops',
  'plain-html',
  'edge-empty',
  'edge-inline',
  'edge-block',
  'edge-table',
  'edge-more',
  'edge-unknown',
];

describe('convert()', () => {
  for (const name of fixtures) {
    test(name, async () => {
      const html = readFileSync(join(__dirname, 'fixtures', `${name}.html`), 'utf8');
      const markdown = convert(html);
      await expect(markdown).toMatchFileSnapshot(
        join(__dirname, '__snapshots__', `${name}.md`),
      );
    });
  }
});
