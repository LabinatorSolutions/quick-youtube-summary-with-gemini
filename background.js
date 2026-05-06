const pendingSummaries = new Map();

async function executeAndSendMessage(tabId, textToPaste) {
  try {
    // Probe: if the message listener is already alive, skip re-injection.
    // Without this, the guard flag in content.js blocks the second summarization silently.
    try {
      await browser.tabs.sendMessage(tabId, { action: "ping" });
    } catch {
      // No listener — inject a fresh copy of content.js
      await browser.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
    }

    try {
      const response = await browser.tabs.sendMessage(tabId, {
        action: "pasteUrlToActiveElement",
        textToPaste: textToPaste
      });
      if (response && response.success) {
        console.log("Quick YouTube Summary with Gemini: Successfully started summarization.");
      } else {
        console.warn("Quick YouTube Summary with Gemini: Content script reported pasting was not successful.", response ? response.reason : "No response details.");
      }
    } catch (error) {
      console.error(`Quick YouTube Summary with Gemini: Error sending message to Gemini tab ${tabId}:`, error);
    }
  } catch (error) {
    if (error.message && (error.message.includes("No tab with id") || error.message.includes("Receiving end does not exist"))) {
      console.warn(`Quick YouTube Summary with Gemini: Gemini tab (ID: ${tabId}) was closed or navigated away before action could complete.`);
    } else {
      console.error(`Quick YouTube Summary with Gemini: Error injecting script or sending message to Gemini tab ${tabId}:`, error);
    }
  }
}

async function processAndPasteInGemini(urlToProcess) {
  if (!urlToProcess) {
    console.error("Quick YouTube Summary with Gemini: No URL provided for processing.");
    return;
  }

  const storageData = await browser.storage.local.get({ promptText: defaultPromptText });
  const textToPaste = `${urlToProcess}\n\n${storageData.promptText}`;

  let targetTab;

  try {
    const existingTabs = await browser.tabs.query({ url: "https://gemini.google.com/*" });
    if (existingTabs.length > 0) {
      // Prefer a fully-loaded base app tab; fall back to any complete tab, then first available.
      // host_permissions on gemini.google.com satisfies the URL filter — no extra "tabs" perm needed.
      targetTab =
        existingTabs.find(t => t.status === 'complete' && t.url === 'https://gemini.google.com/app') ??
        existingTabs.find(t => t.status === 'complete') ??
        existingTabs[0];
      // Bring tab to front
      await browser.tabs.update(targetTab.id, { active: true });
      try {
        await browser.windows.update(targetTab.windowId, { focused: true });
      } catch {
        // browser.windows not available on Firefox Android — skip silently
      }
    } else {
      targetTab = await browser.tabs.create({ url: "https://gemini.google.com/app" });
    }
  } catch (error) {
    console.error("Quick YouTube Summary with Gemini: Error finding or opening Gemini tab:", error);
    return;
  }

  if (!targetTab || !targetTab.id) {
    console.error("Quick YouTube Summary with Gemini: Failed to acquire Gemini tab or get its ID.");
    return;
  }

  if (targetTab.status === 'complete') {
    await executeAndSendMessage(targetTab.id, textToPaste);
  } else {
    pendingSummaries.set(targetTab.id, textToPaste);
  }
}

// Filter to Gemini tabs only — avoids map lookup on every tab load in the browser
browser.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === 'complete' && pendingSummaries.has(tabId)) {
    const textToPaste = pendingSummaries.get(tabId);
    pendingSummaries.delete(tabId);
    await executeAndSendMessage(tabId, textToPaste);
  }
}, { urls: ['https://gemini.google.com/*'] });

browser.tabs.onRemoved.addListener((tabId) => {
  pendingSummaries.delete(tabId);
});

// Clear "!" badge via alarm — setTimeout is unreliable in non-persistent event pages
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('clearBadge-')) {
    const tabId = parseInt(alarm.name.split('-')[1], 10);
    browser.action.setBadgeText({ text: '', tabId });
  }
});

// Listener for browser action (toolbar icon)
browser.action.onClicked.addListener(async (initiatingTab) => {
  const currentTabUrl = initiatingTab?.url;

  if (!currentTabUrl) {
    console.error("Quick YouTube Summary with Gemini: Could not get current tab URL.");
    return;
  }

  // Only proceed if the URL is a YouTube video link
  const youtubePatterns = [
    /^https?:\/\/([a-zA-Z0-9-]+\.)?youtube\.com\/watch\?/, // youtube.com/watch
    /^https?:\/\/youtu\.be\//,                             // youtu.be short links
    /^https?:\/\/([a-zA-Z0-9-]+\.)?youtube\.com\/shorts\// // youtube.com/shorts
  ];

  const isYoutube = youtubePatterns.some(pattern => pattern.test(currentTabUrl));
  if (!isYoutube) {
    console.warn("Quick YouTube Summary with Gemini: Current tab is not a YouTube video. Action aborted.");
    if (browser.action.setBadgeText) {
      await browser.action.setBadgeText({ text: '!', tabId: initiatingTab.id });
      await browser.action.setBadgeBackgroundColor({ color: '#EF4444', tabId: initiatingTab.id });
      await browser.alarms.create(`clearBadge-${initiatingTab.id}`, { when: Date.now() + 3000 });
    } else {
      browser.notifications?.create('not-youtube', {
        type: 'basic',
        iconUrl: 'icon.svg',
        title: 'Quick YouTube Summary with Gemini',
        message: 'Navigate to a YouTube video first.'
      });
    }
    return;
  }

  await processAndPasteInGemini(currentTabUrl);
});

// Create context menu item (not available on Firefox Android)
browser.runtime.onInstalled.addListener(() => {
  if (!browser.contextMenus) return;
  browser.contextMenus.create({
    id: "summarize-with-gemini",
    title: "Summarize with Gemini",
    contexts: ["link"],
    targetUrlPatterns: ["*://*.youtube.com/watch*", "*://youtu.be/*", "*://*.youtube.com/shorts/*"]
  });
  browser.contextMenus.create({
    id: "summarize-with-gemini-page",
    title: "Summarize with Gemini",
    contexts: ["page"],
    documentUrlPatterns: ["*://*.youtube.com/watch*", "*://youtu.be/*", "*://*.youtube.com/shorts/*"]
  });
});

// Listener for context menu item click (not available on Firefox Android)
if (browser.contextMenus) {
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "summarize-with-gemini") {
      if (info.linkUrl) {
        await processAndPasteInGemini(info.linkUrl);
      }
    } else if (info.menuItemId === "summarize-with-gemini-page") {
      if (info.pageUrl) {
        await processAndPasteInGemini(info.pageUrl);
      }
    }
  });
}
