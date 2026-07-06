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

async function pastePrompt(text) {
  if (handling || !text) return;
  handling = true;

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
  document.execCommand('insertText', false, text);
  input.dispatchEvent(new Event('input', { bubbles: true }));

  // Leave the prompt filled and focused; the user reviews, edits, and sends it.
  sel.collapseToEnd();
  handling = false;
}

// Reused (already-open) tab: background messages this exact tab, so content
// scripts in other Gemini tabs (active threads) never react.
browser.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'pastePrompt') pastePrompt(msg.text);
});

// Fresh tab: content script loads after the prompt was queued in storage.
(async () => {
  const { pendingPaste, pendingPasteAt = 0 } =
    await browser.storage.local.get(['pendingPaste', 'pendingPasteAt']);
  if (!pendingPaste) return;
  await browser.storage.local.remove(['pendingPaste', 'pendingPasteAt']);

  // Drop stale handoffs (e.g. the fresh tab was closed before it loaded and
  // the user opens Gemini much later) so nothing pastes unexpectedly.
  if (Date.now() - pendingPasteAt > 120000) return;

  pastePrompt(pendingPaste);
})();
