# Development Guide

Guide for developers who want to modify, improve, or contribute to Quick YouTube Summary with Gemini.

## 🛠️ Development Setup

### Prerequisites

- Firefox 153 or newer
- [Bun](https://bun.sh/) (for the dev tooling only — the extension itself has no runtime dependencies)
- Git
- Basic knowledge of:
  - JavaScript (ES2022+)
  - Browser Extensions (WebExtensions API, Manifest V3)
  - DOM manipulation

### Setting Up

1. **Clone the repository**

   ```bash
   git clone https://github.com/LabinatorSolutions/quick-youtube-summary-with-gemini.git
   cd quick-youtube-summary-with-gemini
   ```

2. **Install the dev tooling**

   ```bash
   bun install
   ```

3. **Load the extension in Firefox**

   Either let `web-ext` do it:

   ```bash
   bun run start
   ```

   Or load it manually:
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select `manifest.json`

4. **Open the background console**
   - `about:debugging#/runtime/this-firefox` → "Inspect" on the extension
   - The Console tab shows background script output

## 📁 Project Structure

```text
quick-youtube-summary-with-gemini/
├── manifest.json         # Extension metadata & permissions (MV3)
├── background.js         # Event page — URL validation, tab resolution, handoffs, context menus
├── content.js            # Content script on gemini.google.com — pastes into the prompt box
├── config.js             # Default prompt text (shared by background.js and options.js)
├── options.html          # Options page UI
├── options.js            # Options page logic — load/save/reset prompt
├── icon.svg              # Single scalable icon used at every size
├── package.json          # Dev scripts and dev dependencies (Biome, web-ext)
├── biome.json            # Linter/formatter configuration
├── web-ext-config.mjs    # Packaging exclusions (web-ext has no .webextignore support)
└── .github/workflows/    # CI: lint + build
```

## 🔧 Key Components

### 1. Background script (`background.js`)

A **non-persistent MV3 event page** (`background.scripts`, not a service worker — Firefox does not require one). It orchestrates the whole flow.

**Entry points:**

- `browser.action.onClicked` — validates the active tab's URL against `YOUTUBE_PATTERNS`, then calls `summarize(url)`.
- `browser.contextMenus.onClicked` — same, for the link and page menu items. The whole context-menu block is guarded by `if (browser.contextMenus)` because the API is unavailable on Firefox for Android.

**`summarize(url)`** builds the text (`url` + two newlines + the stored prompt) and picks a target tab:

- If an open Gemini tab matches `GEMINI_HOME_URL` (the blank `/app` new-chat view, with or without query parameters), it is focused and messaged directly with `tabs.sendMessage`. Tabs showing an active thread (`/app/<id>`) are deliberately skipped so an in-progress conversation is never destroyed.
- Otherwise a new tab is opened and the text is queued as a **handoff**.

**Handoff mechanism:**

A handoff is a `{ text, at }` record stored in `browser.storage.local` under `handoffs`, keyed by the target tab id. Storage (rather than a variable) is required because the event page can be suspended between tab creation and tab load. Stale entries are pruned on every write, when the target tab closes (`tabs.onRemoved`), and by `HANDOFF_TTL_MS`.

A handoff is reached from two directions, so neither side has to win a race:

- **Pull** — the content script sends `claimHandoff` on load; the background script resolves the tab id from `sender.tab.id`. Its arrival proves the content script is listening, so the handoff is consumed outright (`takeHandoff`).
- **Push** — `tabs.onUpdated` (filtered to Gemini URLs and the `status` property) delivers on `complete`. This path **peeks** and only deletes the handoff after `tabs.sendMessage` resolves, because a tab can report `complete` before the content script has registered its listener. A failed push is expected and silent; the handoff stays put for the pull.

Every read and delete goes through `enqueue()`, a promise chain that serializes them and never rejects, so a handoff is consumed at most once even when both paths fire simultaneously. Entries older than `HANDOFF_TTL_MS` (120s) are discarded rather than pasted, so a tab closed before it loaded cannot surprise the user later.

**Never trigger delivery from the `status` of a freshly created tab alone.** `tabs.get()` immediately after `tabs.create()` can report `complete` for the tab's initial blank state — doing so pastes into a tab that has no content script yet. `summarize()` only makes that call as a late safety net, and gates it on the URL as well as the status.

**Keying by tab id is the point:** a handoff can only ever be delivered to the tab it was created for. Nothing is broadcast.

### 2. Content script (`content.js`)

Declared in the manifest for `https://gemini.google.com/*` at `document_idle`. It is never injected programmatically, so no `scripting` permission is needed.

> **Firefox MV3 gotcha — read this before debugging "nothing pastes".**
> Firefox treats `host_permissions` as **optional and revocable**, and a manifest-declared content
> script **does not run at all** until its host permission is granted
> ([bug 1745819](https://bugzilla.mozilla.org/show_bug.cgi?id=1745819)). Firefox 127+ grants them
> during a normal install, but a **temporary add-on loaded from `about:debugging` has no install
> prompt, so nothing is granted** — the extension then fails completely silently: tabs open, no API
> reports an error, and every `tabs.sendMessage` fails with *"Could not establish connection.
> Receiving end does not exist."*
>
> `ensureGeminiAccess()` in `background.js` handles this by calling `permissions.request()`.
> **`permissions.request()` must be the first `await` in the gesture handler.** Awaiting anything
> before it — `permissions.contains()` included — ends the user input context, and Firefox rejects
> with *"permissions.request may only be called from a user input handler"*. That is why
> `action.onClicked` has a synchronous fast path for the common case where `tab.url` is already
> known. `permissions.request()` resolves `true` without prompting when access is already granted,
> so calling it every time is safe.
>
> Note that **reloading a temporary add-on can drop granted optional permissions**, so it may need
> re-granting after each reload during development. To fix it by hand:
> `about:addons` → the extension → Permissions → enable access for `gemini.google.com`, then reload
> any Gemini tab that was already open (granting only affects subsequent page loads).

- `pastePrompt(text)` polls for Gemini's input element (`INPUT_SELECTOR`, up to 10s), writes the text with `document.execCommand('insertText')`, and dispatches an `input` event so Gemini's framework registers the change.
- **It does not submit.** The prompt is left filled and focused for the user to review, edit, and send. This is a deliberate product decision — do not add auto-send.
- A `generation` counter makes each request supersede any earlier one still polling, so a second summarize during the 10s window wins instead of being silently dropped.
- If the input never appears, it sends `pasteFailed` to the background script, which shows a notification.

`execCommand` is deprecated, but it remains the only reliable way to write into Gemini's rich-text editor such that the app registers the change. Do not "modernize" it without testing against the live UI.

### 3. Config (`config.js`)

Defines `defaultPromptText`. Loaded before both `background.js` (see the `background.scripts` order in the manifest) and `options.js` (see the script tag order in `options.html`).

### 4. Options page (`options.html` / `options.js`)

Loads, saves, and resets the prompt in `browser.storage.local` under `promptText`.

## 🧪 Testing Your Changes

### Automated checks

```bash
bun run lint      # Biome (lint + format) and web-ext lint — both must be clean
bun run build     # Produces web-ext-artifacts/<name>-<version>.zip
```

CI runs the same two commands on every push and pull request, plus a check that `manifest.json` and `package.json` versions match.

### Manual testing

1. `about:debugging#/runtime/this-firefox` → "Reload" next to the extension
2. Work through [TESTING-CHECKLIST.md](./TESTING-CHECKLIST.md)
3. Check the background console for errors

## 📦 Building for Distribution

1. **Bump the version** in **both** `manifest.json` and `package.json` (CI fails if they diverge).
2. **Run the full checklist** in [TESTING-CHECKLIST.md](./TESTING-CHECKLIST.md).
3. **Build the package:**

   ```bash
   bun run build
   ```

   `web-ext-config.mjs` keeps dev files (`package.json`, `biome.json`, lockfiles, Markdown, CI config) out of the archive. Verify with `unzip -l web-ext-artifacts/*.zip` — it should contain only the manifest, the four scripts, `options.html`, `icon.svg`, and `LICENSE`.

4. **Submit to AMO:**
   - <https://addons.mozilla.org/developers/>
   - Upload the ZIP, fill in the metadata, and submit for review (typically 1–3 days).
   - No source-code submission is required: there is no build step and nothing is minified.

## 🐛 Debugging Common Issues

### Extension will not load

- Validate `manifest.json` (`bun run lint` covers this via `web-ext lint`)
- Confirm every referenced file exists: `background.js`, `content.js`, `config.js`, `options.html`, `options.js`, `icon.svg`

### Prompt is not pasted

1. Open the background console (`about:debugging` → Inspect)
2. Confirm the target tab actually received a `pastePrompt` message
3. If it did, Gemini's DOM probably changed — update `INPUT_SELECTOR` in `content.js`

### Handoff never arrives in a new tab

1. Inspect `browser.storage.local` for a stale `handoffs` entry
2. Confirm `tabs.onUpdated` fires for the tab (the filter is limited to `https://gemini.google.com/*` and `status`)
3. Confirm the content script is running in that tab (it is declarative, so it will not exist in tabs opened before the extension was installed or reloaded)

## 🔐 Security Best Practices

**DO:**

- ✅ Keep permissions minimal — every entry in `permissions` must be provably used
- ✅ Use `textContent` instead of `innerHTML`
- ✅ Validate all data read back from storage

**DON'T:**

- ❌ Add external network requests
- ❌ Store or transmit user data
- ❌ Use `eval()` or `new Function()`
- ❌ Expand `host_permissions` beyond `gemini.google.com`
- ❌ Broadcast prompt text to every Gemini tab

### Code review checklist

- [ ] No new permissions (unless justified in the PR description)
- [ ] No external network requests introduced
- [ ] No user data collected or transmitted
- [ ] `bun run lint` is clean
- [ ] `strict_min_version` is still `153.0` or higher

## 📝 Coding Standards

Formatting is enforced by Biome (`biome.json`) — single quotes, semicolons, 2-space indent, 100-column lines. Run `bun run lint:fix` before committing rather than formatting by hand.

```javascript
// const by default, let only when reassignment is needed
const { promptText = defaultPromptText } = await browser.storage.local.get({
  promptText: defaultPromptText,
});

// Arrow functions for callbacks
patterns.some(pattern => pattern.test(url));

// async/await over raw promise chains
async function summarize(url) { /* ... */ }
```

Error handling: swallow only errors that are genuinely expected, and say why in a comment.

```javascript
try {
  await browser.windows.update(home.windowId, { focused: true });
} catch {
  // windows is unavailable on Firefox for Android.
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-new-feature`
3. Make your changes
4. Run `bun run lint` and the manual checklist
5. Commit with a clear message
6. Push and open a pull request

### Commit message format

```text
type(scope): Subject

Body (optional)

Footer (optional)
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**

```text
feat(options): Add prompt character count indicator
fix(content): Update Gemini input selector after UI change
docs(readme): Correct the auto-send description
```

## 📚 Resources

- [MDN WebExtensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [browser.\* API reference](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API)
- [Manifest V3 migration guide](https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/)
- [web-ext command reference](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/)
- [Biome](https://biomejs.dev/)
- [Mozilla Add-ons Community](https://discourse.mozilla.org/c/add-ons/)
- Project issues: <https://github.com/LabinatorSolutions/quick-youtube-summary-with-gemini/issues>

## 🙏 Credits

Contributors are recognized in the GitHub contributors list.

Special thanks to:

- The Mozilla Firefox team for the WebExtensions API
- The open-source community for inspiration
