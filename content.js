const INPUT_SELECTOR = [
  'rich-textarea div[contenteditable="true"]',
  'div.ql-editor',
  'div[contenteditable="true"][aria-label*="prompt"]',
  'div[contenteditable="true"][data-placeholder]',
  'textarea',
].join(', ');

const POLL_ATTEMPTS = 50;
const POLL_INTERVAL_MS = 200; // 10s max

// Delays at which this tab re-asks for a queued prompt, covering the case where
// the page loaded before the background script finished storing the handoff.
const CLAIM_RETRY_DELAYS_MS = [0, 800, 2500];

// Set to true to trace the paste flow in this tab's console.
const DEBUG = false;

function log(...args) {
  if (DEBUG) console.log('Quick YouTube Summary with Gemini:', ...args);
}

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

// Each request supersedes any earlier one still waiting for the input element,
// so a second summarize during the 10s poll wins instead of being dropped.
let generation = 0;

async function pastePrompt(text) {
  if (!text) return;
  const request = ++generation;

  const input = await poll(
    () => document.querySelector(INPUT_SELECTOR),
    POLL_ATTEMPTS,
    POLL_INTERVAL_MS,
  );

  if (request !== generation) return;

  if (!input) {
    log('prompt box never appeared');
    browser.runtime.sendMessage({ type: 'pasteFailed' }).catch(() => {});
    return;
  }

  input.focus();
  const range = document.createRange();
  range.selectNodeContents(input);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  // execCommand is deprecated but remains the only reliable way to write into
  // Gemini's rich-text editor so that its framework registers the change.
  document.execCommand('insertText', false, text);
  input.dispatchEvent(new Event('input', { bubbles: true }));

  // Leave the prompt filled and focused; the user reviews, edits, and sends it.
  sel.collapseToEnd();
}

// Reused (already-open) tab: the background script messages this exact tab, so
// content scripts in other Gemini tabs (active threads) never react.
browser.runtime.onMessage.addListener(msg => {
  if (msg?.type === 'pastePrompt') {
    log('received a prompt to paste');
    pastePrompt(msg.text);
  }
});

// Fresh tab: claim the handoff the background script queued for this tab id.
// The background script also pushes on tab completion; whichever arrives first
// wins, and the handoff is consumed only once.
(async () => {
  for (const delay of CLAIM_RETRY_DELAYS_MS) {
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    try {
      const text = await browser.runtime.sendMessage({ type: 'claimHandoff' });
      if (text) {
        log('claimed a queued prompt');
        pastePrompt(text);
        return;
      }
    } catch (err) {
      log('claim failed:', err?.message);
      return;
    }
  }
  log('no queued prompt for this tab');
})();
