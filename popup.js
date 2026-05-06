const youtubePatterns = [
  /^https?:\/\/([a-zA-Z0-9-]+\.)?youtube\.com\/watch\?/,
  /^https?:\/\/youtu\.be\//,
  /^https?:\/\/([a-zA-Z0-9-]+\.)?youtube\.com\/shorts\//
];

(async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url;

  if (!url || !youtubePatterns.some(p => p.test(url))) {
    document.getElementById('msg').textContent = 'Open a YouTube video first.';
    return;
  }

  document.getElementById('msg').textContent = 'Sending to Gemini…';
  browser.runtime.sendMessage({ action: 'summarize', url });
  window.close();
})();
