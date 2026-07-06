function poll(fn, maxAttempts, intervalMs) {
  return new Promise(resolve => {
    let attempts = 0;
    const id = setInterval(() => {
      const result = fn();
      if (result || ++attempts >= maxAttempts) {
        clearInterval(id);
        resolve(result ?? null);
      }
    }, intervalMs);
  });
}

let handling = false;

async function tryPastePrompt() {
  if (handling) return;
  const { pendingPaste } = await browser.storage.local.get('pendingPaste');
  if (!pendingPaste) return;

  handling = true;
  await browser.storage.local.remove('pendingPaste');

  const input = await poll(() => document.querySelector(
    'rich-textarea div[contenteditable="true"], ' +
    'div.ql-editor, ' +
    'div[contenteditable="true"][aria-label*="prompt"], ' +
    'div[contenteditable="true"][data-placeholder], ' +
    'textarea'
  ), 50, 200); // 10s max

  if (!input) { handling = false; return; }

  input.focus();
  const range = document.createRange();
  range.selectNodeContents(input);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  document.execCommand('insertText', false, pendingPaste);
  input.dispatchEvent(new Event('input', { bubbles: true }));

  // Leave the prompt filled and focused; the user reviews, edits, and sends it.
  sel.collapseToEnd();
  handling = false;
}

// Fresh tab: content script loads after the prompt is queued, handled here.
tryPastePrompt();

// Reused (already-open) tab: no reload fires, so react to the storage write.
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.pendingPaste?.newValue) tryPastePrompt();
});
