# Development Guide

Guide for developers who want to modify, improve, or contribute to Quick YouTube Summary with Gemini.

## 🛠️ Development Setup

### Prerequisites

- Firefox Browser (150+)
- Text editor or IDE (VS Code recommended)
- Git (for version control)
- Basic knowledge of:
  - JavaScript (ES6+)
  - Browser Extensions (WebExtensions API)
  - DOM manipulation

### Setting Up Development Environment

1. **Clone Repository**

   ```bash
   git clone https://github.com/LabinatorSolutions/quick-youtube-summary-with-gemini.git
   cd quick-youtube-summary-with-gemini
   ```

2. **Load Extension in Firefox**
   - Open Firefox
   - Navigate to: `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select `manifest.json`

3. **Open Console**
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Click "Inspect" on the extension
   - Console tab will show background script logs prefixed with `Quick YouTube Summary with Gemini:`

## 📁 Project Structure

```text
quick-youtube-summary-with-gemini/
├── manifest.json        # Extension metadata & permissions (MV3)
├── background.js        # Background service worker — tab management, context menus, alarms
├── content.js           # Content script injected into gemini.google.com — DOM interaction
├── config.js            # Default prompt text (shared by background.js and options.js)
├── options.html         # Options page UI
├── options.js           # Options page logic — load/save/reset prompt
└── icons/               # Extension icons (16, 32, 48, 128px)
```

## 🔧 Key Components

### 1. Background Script (`background.js`)

**Purpose:** Orchestrates the summarization flow — finds or opens a Gemini tab, injects the content script, and dispatches the URL + prompt.

**Key Functions:**

- `processAndPasteInGemini(url)` — Entry point. Reads prompt from storage, resolves target Gemini tab, triggers paste.
- `executeAndSendMessage(tabId, text)` — Pings content script to check if alive; injects `content.js` if not; sends paste message.

**Pending summary flow:**  
If the Gemini tab is still loading, the text is stored in `browser.storage.session` under `pendingSummaries[tabId]`. The `tabs.onUpdated` listener picks it up once the tab reaches `complete`.

### 2. Content Script (`content.js`)

**Purpose:** Injected into `gemini.google.com` tabs on demand. Finds the input element, pastes the text, and clicks Send.

**Injection guard:**  
`window.geminiSummarizerInjected` prevents double-registration when the script is injected into an already-active tab.

**Message handlers:**

- `ping` — Returns `{ ok: true }` synchronously. Background uses this to check if the listener is alive.
- `pasteUrlToActiveElement` — Polls for Gemini's input element (up to 10s), pastes text via `execCommand('insertText')`, then polls for the Send button (up to 3s) before falling back to an Enter keypress.

### 3. Config (`config.js`)

**Purpose:** Defines `defaultPromptText`. Loaded before both `background.js` and `options.js` (see manifest `background.scripts` order and `options.html` script tag order).

### 4. Options Page (`options.html` / `options.js`)

**Purpose:** Lets users view and edit the prompt. Saves to `browser.storage.local` under the key `promptText`.

## 🧪 Testing Your Changes

### Manual Testing

After making changes:

1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Reload" next to the extension
3. Navigate to a YouTube video
4. Click the toolbar icon or use the right-click context menu
5. Verify Gemini tab opens/focuses and the prompt is pasted and sent
6. Check the background console for any errors

### Testing Checklist

See [TESTING-CHECKLIST.md](./TESTING-CHECKLIST.md) for a comprehensive step-by-step guide covering all features and edge cases.

## 📦 Building for Distribution

### 1. Prepare for Release

**Update Version:**

```json
// manifest.json
"version": "1.1.0"  // Increment version
```

**Test Thoroughly:**

- Run the full [TESTING-CHECKLIST.md](./TESTING-CHECKLIST.md)
- Test on the minimum supported Firefox version (150)

### 2. Create Release Package

Create a ZIP excluding dev files:

```bash
zip -r quick-youtube-summary-with-gemini-v1.1.0.zip . \
  -x "*.git*" \
  -x "*node_modules*"
```

### 3. Submit to Mozilla Add-ons (AMO)

1. Go to: https://addons.mozilla.org/developers/
2. Upload the ZIP file
3. Fill in metadata:
   - Name: Quick YouTube Summary with Gemini
   - Summary: Summarizes YouTube videos using Google Gemini in one click
   - Description: See README.md
   - Categories: Productivity, Social & Communication
4. Choose visibility:
   - **Listed:** Public (everyone can find it)
   - **Unlisted:** Only you and people with the link
5. Submit for review
6. Wait 1–3 days for approval

## 🐛 Debugging Common Issues

### Extension Not Loading

**Symptom:** Error when loading temporary add-on

**Solutions:**

- Check `manifest.json` is valid JSON
- Verify all referenced files exist (`background.js`, `content.js`, `config.js`, all icons)
- Check the browser console for specific error messages

### Prompt Not Pasting / Send Not Triggered

**Symptom:** Gemini tab opens but nothing happens

**Debug Steps:**

1. Open the extension's background console (`about:debugging` → Inspect)
2. Look for warnings or errors logged as `Quick YouTube Summary with Gemini:`
3. Check if Gemini's UI has changed its input selectors — update the `document.querySelector` call in `content.js` if needed

### Pending Summary Not Firing

**Symptom:** New Gemini tab opens but prompt never pastes after load

**Debug Steps:**

1. Open the background console
2. Check `browser.storage.session` for a stale `pendingSummaries` entry
3. Verify `tabs.onUpdated` is firing by checking for log output

## 🔐 Security Best Practices

### When Contributing

**DO:**

- ✅ Minimize permissions requested
- ✅ Use `textContent` instead of `innerHTML`
- ✅ Validate all data from storage

**DON'T:**

- ❌ Add external network requests
- ❌ Store sensitive user data
- ❌ Use `eval()` or `innerHTML` with user-controlled input
- ❌ Expand `host_permissions` beyond `gemini.google.com`

### Code Review Checklist

Before submitting a PR:

- [ ] No new permissions added (unless absolutely necessary and justified)
- [ ] No external network requests introduced
- [ ] No user data collected or transmitted
- [ ] All user input sanitized

## 📝 Coding Standards

### JavaScript Style

```javascript
// Use const by default, let when reassignment needed
const storageData = await browser.storage.local.get({ promptText: defaultPromptText });

// Use arrow functions for callbacks
patterns.some(pattern => pattern.test(url));

// Use async/await instead of raw promises
async function processAndPasteInGemini(url) {
  const data = await browser.storage.local.get({ promptText: defaultPromptText });
  // ...
}
```

### Error Handling

```javascript
try {
  await browser.tabs.sendMessage(tabId, { action: 'ping' });
} catch {
  // No listener — inject fresh content.js
  await browser.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
}
```

## 🤝 Contributing

### How to Contribute

1. **Fork Repository**
2. **Create Feature Branch**

   ```bash
   git checkout -b feature/my-new-feature
   ```

3. **Make Changes**
4. **Test Thoroughly** (see TESTING-CHECKLIST.md)
5. **Commit with Clear Messages**

   ```bash
   git commit -m "feat: Add statistics tracking"
   ```

6. **Push to Fork**
7. **Open Pull Request**

### Commit Message Format

```text
type(scope): Subject

Body (optional)

Footer (optional)
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**

```text
feat(options): Add prompt character count indicator
fix(content): Update Gemini input selector after UI change
docs(readme): Add troubleshooting section
```

## 📚 Resources

### WebExtensions API

- [MDN WebExtensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [browser.* API Reference](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API)
- [Manifest V3 Migration Guide](https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/)

### Tools

- [web-ext](https://github.com/mozilla/web-ext) — CLI tool for extension development and signing
- [Firefox DevTools](https://firefox-source-docs.mozilla.org/devtools-user/)
- [Extension Workshop](https://extensionworkshop.com/) — Mozilla's official guide

### Community

- [Mozilla Add-ons Community](https://discourse.mozilla.org/c/add-ons/)
- Project Issues: https://github.com/LabinatorSolutions/quick-youtube-summary-with-gemini/issues

## 🙏 Credits

Contributors are recognized in the GitHub contributors list.

Special thanks to:

- Mozilla Firefox team for the WebExtensions API
- Open-source community for inspiration
