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

async function tryPastePrompt() {
  const { pendingPaste } = await browser.storage.local.get('pendingPaste');
  if (!pendingPaste) return;

  await browser.storage.local.remove('pendingPaste');

  const input = await poll(() => document.querySelector(
    'rich-textarea div[contenteditable="true"], ' +
    'div.ql-editor, ' +
    'div[contenteditable="true"][aria-label*="prompt"], ' +
    'div[contenteditable="true"][data-placeholder], ' +
    'textarea'
  ), 50, 200); // 10s max

  if (!input) return;

  input.focus();
  const range = document.createRange();
  range.selectNodeContents(input);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  document.execCommand('insertText', false, pendingPaste);
  input.dispatchEvent(new Event('input', { bubbles: true }));

  const button = await poll(() => {
    const btn = document.querySelector(
      'button[aria-label*="Send"], button[aria-label*="Submit"], button.send-button'
    );
    return btn && !btn.disabled ? btn : null;
  }, 15, 200); // 3s max

  if (button) {
    button.click();
  } else {
    const opts = { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true, composed: true };
    input.dispatchEvent(new KeyboardEvent('keydown', opts));
    input.dispatchEvent(new KeyboardEvent('keyup', opts));
  }
}

tryPastePrompt();
