// Confluence Server renders task lists as <ul class="inline-task-list">
// with <li class="checked"> (done) or <li> (open). Inject a real
// <input type="checkbox"> so the turndown-gfm taskListItems rule picks
// them up as GFM checkboxes.
export function applyConfluenceCleanup(doc) {
  const taskLists = doc.querySelectorAll('ul.inline-task-list');
  taskLists.forEach(function(ul) {
    const items = ul.querySelectorAll(':scope > li');
    items.forEach(function(li) {
      const isChecked = li.classList.contains('checked');
      const checkbox = doc.createElement('input');
      checkbox.setAttribute('type', 'checkbox');
      if (isChecked) {
        checkbox.setAttribute('checked', '');
        li.classList.remove('checked');
      }
      li.insertBefore(checkbox, li.firstChild);
    });
    ul.classList.remove('inline-task-list');
  });
}
