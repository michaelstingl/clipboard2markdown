export const BUILTIN_PRESETS = {
  'generic': {
    name: 'Generic',
    builtin: true,
    templates: [
      { key: '1', label: 'Heading', format: '# {content}' },
      { key: '2', label: 'Section', format: '## {content}' },
      { key: '3', label: 'Quote', format: '> {content}' }
    ]
  },
  'azure-devops': {
    name: 'Azure DevOps',
    builtin: true,
    templates: [
      { key: '1', label: 'Title', format: '# {content}' },
      { key: '2', label: 'Description', format: '## Description\n\n{content}' },
      { key: '3', label: 'Acceptance Criteria', format: '## Acceptance Criteria\n\n{content}' }
    ]
  },
  'github-issue': {
    name: 'GitHub Issue',
    builtin: true,
    templates: [
      { key: '1', label: 'Title', format: '# {content}' },
      { key: '2', label: 'Problem', format: '## Problem\n\n{content}' },
      { key: '3', label: 'Steps to Reproduce', format: '## Steps to Reproduce\n\n{content}' },
      { key: '4', label: 'Expected Behavior', format: '## Expected Behavior\n\n{content}' }
    ]
  },
  'meeting-notes': {
    name: 'Meeting Notes',
    builtin: true,
    templates: [
      { key: '1', label: 'Title', format: '# {content}' },
      { key: '2', label: 'Attendees', format: '## Attendees\n\n{content}' },
      { key: '3', label: 'Discussion', format: '## Discussion\n\n{content}' },
      { key: '4', label: 'Action Items', format: '## Action Items\n\n{content}' }
    ]
  }
};
