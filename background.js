const YOUTUBE_PATTERNS = [
  /^https?:\/\/([a-zA-Z0-9-]+\.)?youtube\.com\/watch\?/,
  /^https?:\/\/youtu\.be\//,
  /^https?:\/\/([a-zA-Z0-9-]+\.)?youtube\.com\/shorts\//,
];

const YOUTUBE_MENU_PATTERNS = [
  '*://*.youtube.com/watch*',
  '*://youtu.be/*',
  '*://*.youtube.com/shorts/*',
];

const GEMINI_TAB_PATTERN = 'https://gemini.google.com/*';
const GEMINI_NEW_CHAT_URL = 'https://gemini.google.com/app';
const GEMINI_ORIGIN = 'https://gemini.google.com/*';

// A Gemini tab sitting on the blank home/new-chat view, with or without query
// parameters (localized URLs carry them).
const GEMINI_HOME_URL = /^https:\/\/gemini\.google\.com\/(app\/?)?(\?.*)?$/;

// A handoff older than this is dropped rather than pasted, so a tab that was
// closed before it loaded cannot surprise the user much later.
const HANDOFF_TTL_MS = 120000;

// Set to true to trace the summarize flow in the background console.
const DEBUG = false;

function log(...args) {
  if (DEBUG) console.log('Quick YouTube Summary with Gemini:', ...args);
}

function notify(id, message) {
  if (!browser.notifications) return;
  // Rejects on platforms without a notification backend; failing to warn the
  // user must never take down the flow itself.
  browser.notifications
    .create(id, {
      type: 'basic',
      iconUrl: 'icon.svg',
      title: 'Quick YouTube Summary with Gemini',
      message,
    })
    .catch(() => {});
}

// Firefox treats MV3 host permissions as optional and revocable, and a
// manifest-declared content script does not run until its host permission is
// granted. Without this check the extension fails silently: tabs open, nothing
// pastes, and no API call reports an error. Must be reached directly from a
// user gesture (a toolbar or menu click), which is what permissions.request
// requires.
async function ensureGeminiAccess() {
  if (!browser.permissions) return true;

  try {
    // permissions.request() must be the FIRST await inside the gesture handler.
    // Anything awaited before it — permissions.contains() included — ends the
    // user input context and Firefox rejects with "permissions.request may only
    // be called from a user input handler". When access is already granted this
    // resolves true without prompting, so it is safe to call every time.
    const granted = await browser.permissions.request({ origins: [GEMINI_ORIGIN] });
    if (!granted) {
      notify(
        'permission-denied',
        'Access to gemini.google.com is required before the prompt can be pasted.',
      );
    }
    return granted;
  } catch (err) {
    log('permission request unavailable:', err?.message);
  }

  // The request could not be shown (no usable gesture). Fall back to a passive
  // check so an already-granted user is never blocked, and tell everyone else
  // exactly how to fix it — without the permission the content script never
  // runs and the extension would otherwise fail in complete silence.
  try {
    if (await browser.permissions.contains({ origins: [GEMINI_ORIGIN] })) return true;
  } catch {
    return true;
  }

  log('gemini.google.com access is not granted');
  notify(
    'permission-required',
    'Enable "Access your data for gemini.google.com" in about:addons for this add-on, then reload your Gemini tab.',
  );
  return false;
}

// Handoffs are keyed by target tab id so a queued prompt can only ever reach
// the tab it was created for. storage.local is used rather than storage.session
// because it is the storage area this extension has always relied on; stale
// entries are pruned on write, on tab close, and by HANDOFF_TTL_MS.
async function readHandoffs() {
  const { handoffs = {} } = await browser.storage.local.get('handoffs');
  return handoffs;
}

async function writeHandoffs(handoffs) {
  await browser.storage.local.set({ handoffs });
}

async function writeHandoff(tabId, text) {
  const handoffs = await readHandoffs();
  const now = Date.now();
  for (const [id, entry] of Object.entries(handoffs)) {
    if (now - entry.at > HANDOFF_TTL_MS) delete handoffs[id];
  }
  handoffs[tabId] = { text, at: now };
  await writeHandoffs(handoffs);
  log('handoff queued for tab', tabId);
}

async function peekHandoff(tabId) {
  if (tabId === undefined) return null;
  const handoffs = await readHandoffs();
  const entry = handoffs[tabId];
  if (!entry) return null;

  return Date.now() - entry.at > HANDOFF_TTL_MS ? null : entry.text;
}

async function dropHandoff(tabId) {
  const handoffs = await readHandoffs();
  if (handoffs[tabId] === undefined) return;
  delete handoffs[tabId];
  await writeHandoffs(handoffs);
}

async function takeHandoff(tabId) {
  const text = await peekHandoff(tabId);
  await dropHandoff(tabId);
  return text;
}

// A handoff is reached from two directions — the content script pulls on load,
// and tabs.onUpdated pushes on completion — so whichever side is ready first
// delivers. Serializing every read/delete keeps a handoff single-consumption
// even when both fire at once.
let handoffQueue = Promise.resolve();

// Never rejects: a storage failure must not poison the queue for later work,
// and every caller treats a missing handoff as "nothing to do".
function enqueue(work) {
  const next = handoffQueue.then(work).catch(() => null);
  handoffQueue = next;
  return next;
}

// The content script asks for its own handoff, so its arrival is proof of
// delivery: consume the handoff outright.
async function claimHandoff(tabId) {
  const text = await enqueue(() => takeHandoff(tabId));
  log('claim from tab', tabId, text ? 'delivered' : 'no handoff');
  return text;
}

// The push path cannot know whether the content script is listening yet, so the
// handoff is consumed only once the message is accepted. A failure here is
// expected (the tab reported complete before the content script registered) and
// simply leaves the handoff for the content script's own claim.
async function deliverHandoff(tabId) {
  const text = await enqueue(() => peekHandoff(tabId));
  if (!text) return;

  try {
    await browser.tabs.sendMessage(tabId, { type: 'pastePrompt', text });
  } catch (err) {
    log('push to tab', tabId, 'failed, leaving handoff in place:', err?.message);
    return;
  }
  await enqueue(() => dropHandoff(tabId));
  log('push to tab', tabId, 'delivered');
}

async function summarize(url) {
  const { promptText = defaultPromptText } = await browser.storage.local.get({
    promptText: defaultPromptText,
  });
  const text = `${url}\n\n${promptText}`;

  // Reuse a Gemini tab only if it is on the blank home/new-chat view. A tab
  // showing an active thread (/app/<id>) is left untouched so we never destroy
  // an in-progress conversation; open a fresh tab for it instead.
  const tabs = await browser.tabs.query({ url: GEMINI_TAB_PATTERN });
  const home = tabs.find(t => GEMINI_HOME_URL.test(t.url || ''));
  log(
    'summarize:',
    tabs.length,
    'Gemini tab(s),',
    home ? `reusing ${home.id}` : 'opening a new tab',
  );

  if (home) {
    await browser.tabs.update(home.id, { active: true });
    // windows is unavailable on Firefox for Android.
    try {
      await browser.windows.update(home.windowId, { focused: true });
    } catch {}
    try {
      // Message the reused tab directly so only it pastes; a broadcast would
      // also wake content scripts in active-thread tabs.
      await browser.tabs.sendMessage(home.id, { type: 'pastePrompt', text });
      log('pasted into reused tab', home.id);
      return;
    } catch (err) {
      // Content script unreachable (tab predates install/update); fall through
      // and hand off to a fresh tab instead.
      log('reused tab', home.id, 'unreachable:', err?.message);
    }
  }

  const tab = await browser.tabs.create({ url: GEMINI_NEW_CHAT_URL });
  await writeHandoff(tab.id, text);

  // Covers the narrow case where the tab finished loading before the handoff was
  // stored, leaving neither the content script's claim nor onUpdated to fire
  // again. A brand-new tab reports status 'complete' for its initial blank page,
  // so the URL must be checked too; delivery is harmless either way, since an
  // unreachable content script leaves the handoff in place.
  try {
    const created = await browser.tabs.get(tab.id);
    if (created.status === 'complete' && created.url?.startsWith('https://gemini.google.com/')) {
      await deliverHandoff(tab.id);
    }
  } catch {}
}

browser.tabs.onUpdated.addListener(
  (tabId, changeInfo) => {
    log('tab', tabId, 'status', changeInfo.status);
    if (changeInfo.status === 'complete') deliverHandoff(tabId);
  },
  { urls: [GEMINI_TAB_PATTERN], properties: ['status'] },
);

// Handoffs live on disk, so drop one as soon as its tab is gone.
browser.tabs.onRemoved.addListener(tabId => {
  enqueue(() => dropHandoff(tabId));
});

browser.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === 'claimHandoff') return claimHandoff(sender.tab?.id);
  if (msg?.type === 'pasteFailed') {
    notify('input-error', 'The Gemini prompt box did not load in time. Try again.');
  }
});

function isYouTubeUrl(url) {
  return Boolean(url) && YOUTUBE_PATTERNS.some(p => p.test(url));
}

browser.action.onClicked.addListener(async tab => {
  // Fast path: the tab's URL is already known, so the YouTube check is
  // synchronous and ensureGeminiAccess() still runs inside the user gesture
  // that Firefox requires for permissions.request().
  if (isYouTubeUrl(tab?.url)) {
    if (!(await ensureGeminiAccess())) return;
    await summarize(tab.url);
    return;
  }

  // Slow path: no URL on the event (some platforms). Resolving it costs an
  // await, so a permission prompt is no longer possible here — ensureGeminiAccess
  // falls back to a passive check and tells the user where to grant it.
  let url = tab?.url;
  if (!url) {
    const [active] = await browser.tabs.query({ active: true, currentWindow: true });
    url = active?.url;
  }

  if (!url) {
    notify('url-error', 'Could not detect the current page URL.');
    return;
  }

  if (!isYouTubeUrl(url)) {
    notify('not-youtube', 'This is not a YouTube video page.');
    return;
  }

  if (!(await ensureGeminiAccess())) return;

  await summarize(url);
});

browser.runtime.onInstalled.addListener(() => {
  // Storage keys used by the pre-1.7 handoff, left behind on upgrade.
  browser.storage.local.remove(['pendingPaste', 'pendingPasteAt']).catch(() => {});

  // contextMenus is unavailable on Firefox for Android.
  if (!browser.contextMenus) return;
  try {
    browser.contextMenus.create({
      id: 'summarize-link',
      title: 'Summarize with Gemini',
      contexts: ['link'],
      targetUrlPatterns: YOUTUBE_MENU_PATTERNS,
    });
    browser.contextMenus.create({
      id: 'summarize-page',
      title: 'Summarize with Gemini',
      contexts: ['page'],
      documentUrlPatterns: YOUTUBE_MENU_PATTERNS,
    });
  } catch {
    // Menus already registered from a previous run.
  }
});

if (browser.contextMenus) {
  browser.contextMenus.onClicked.addListener(async info => {
    const url = info.linkUrl || info.pageUrl;
    if (!url) return;
    if (!(await ensureGeminiAccess())) return;
    await summarize(url);
  });
}

log('background ready');
