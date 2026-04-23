// Insert text into a textarea at the current caret position. Falls back
// to IE's document.selection API when present.
export function insert(myField, myValue) {
  if (document.selection) {
    myField.focus();
    const sel = document.selection.createRange();
    sel.text = myValue;
    sel.select();
    return;
  }
  if (myField.selectionStart || myField.selectionStart == '0') {
    const startPos = myField.selectionStart;
    const endPos = myField.selectionEnd;
    const before = myField.value.substring(0, startPos);
    const after = myField.value.substring(endPos, myField.value.length);
    myField.value = before + myValue + after;
    myField.selectionStart = startPos + myValue.length;
    myField.selectionEnd = startPos + myValue.length;
    myField.focus();
  } else {
    myField.value += myValue;
    myField.focus();
  }
}
