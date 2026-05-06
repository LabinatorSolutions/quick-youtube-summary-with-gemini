const youtubePatterns = [
  /^https?:\/\/([a-zA-Z0-9-]+\.)?youtube\.com\/watch\?/,
  /^https?:\/\/youtu\.be\//,
  /^https?:\/\/([a-zA-Z0-9-]+\.)?youtube\.com\/shorts\//
];

function notify(id, message) {
  if (!browser.notifications) return;
  browser.notifications.create(id, {
    type: 'basic',
    iconUrl: 'icon.svg',
    title: 'Quick YouTube Summary with Gemini',
    message
  });
}

async function summarize(url) {
  const { promptText = defaultPromptText } = await browser.storage.local.get({ promptText: defaultPromptText });
  await browser.storage.local.set({ pendingPaste: `${url}\n\n${promptText}` });

  const tabs = await browser.tabs.query({ url: "https://gemini.google.com/*" });
  if (tabs.length > 0) {
    const tab = tabs[0];
    await browser.tabs.update(tab.id, { url: "https://gemini.google.com/app", active: true });
    try { await browser.windows.update(tab.windowId, { focused: true }); } catch {}
  } else {
    await browser.tabs.create({ url: "https://gemini.google.com/app" });
  }
}

browser.action.onClicked.addListener(async (tab) => {
  let url = tab?.url;
  if (!url) {
    const [active] = await browser.tabs.query({ active: true, currentWindow: true });
    url = active?.url;
  }

  if (!url) {
    notify('url-error', 'Could not detect the current page URL.');
    return;
  }

  if (!youtubePatterns.some(p => p.test(url))) {
    notify('not-youtube', 'This is not a YouTube video page.');
    return;
  }

  await summarize(url);
});

browser.runtime.onInstalled.addListener(() => {
  if (!browser.contextMenus) return;
  browser.contextMenus.create({
    id: "summarize-link",
    title: "Summarize with Gemini",
    contexts: ["link"],
    targetUrlPatterns: ["*://*.youtube.com/watch*", "*://youtu.be/*", "*://*.youtube.com/shorts/*"]
  });
  browser.contextMenus.create({
    id: "summarize-page",
    title: "Summarize with Gemini",
    contexts: ["page"],
    documentUrlPatterns: ["*://*.youtube.com/watch*", "*://youtu.be/*", "*://*.youtube.com/shorts/*"]
  });
});

if (browser.contextMenus) {
  browser.contextMenus.onClicked.addListener(async (info) => {
    const url = info.linkUrl || info.pageUrl;
    if (url) await summarize(url);
  });
}
