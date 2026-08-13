# Testing Checklist

Run this in full before every release. The extension has no automated behavioral tests — Gemini's
UI is a moving target and only manual verification is meaningful.

Load the build under test with `bun run start`, or via `about:debugging#/runtime/this-firefox` →
"Load Temporary Add-on" → `manifest.json`.

## Automated checks

- [ ] `bun install` completes
- [ ] `bun run lint` — Biome clean, `web-ext lint` reports 0 errors and 0 warnings
- [ ] `bun run build` succeeds
- [ ] `unzip -l web-ext-artifacts/*.zip` contains only: `manifest.json`, `background.js`,
      `content.js`, `config.js`, `options.html`, `options.js`, `icon.svg`, `LICENSE`
- [ ] `manifest.json` and `package.json` declare the same version
- [ ] `strict_min_version` is `153.0` or higher

## Host permission

Firefox treats the Gemini host permission as optional, and the content script does not run without
it. A temporary add-on starts with it **not** granted.

- [ ] With the permission not granted, the first summarize shows Firefox's permission request
- [ ] Granting it lets the flow complete (reload any Gemini tab that was already open)
- [ ] Declining it shows the "Access to gemini.google.com is required" notification and no tab is
      left waiting for a paste that will never come
- [ ] Revoking it afterwards in `about:addons` → Permissions makes the extension ask again rather
      than fail silently

## URL detection

- [ ] `youtube.com/watch?v=…` — toolbar button starts the flow
- [ ] `youtu.be/…` — starts the flow
- [ ] `youtube.com/shorts/…` — starts the flow
- [ ] `m.youtube.com/watch?v=…` — starts the flow
- [ ] A non-YouTube page (e.g. `example.com`) — notification "This is not a YouTube video page."
- [ ] The YouTube home page (not a video) — same notification
- [ ] `about:blank` or a `chrome://` page — a notification appears, no uncaught error in the console

## Tab handling

- [ ] **No Gemini tab open** — a new tab opens at `/app` and the prompt is pasted
- [ ] **Gemini tab open on the blank new-chat view** — that tab is focused and reused, no new tab
- [ ] **Gemini tab open in a different window** — that window is focused
- [ ] **Gemini tab with an active conversation (`/app/<id>`)** — it is left untouched and a *new*
      tab opens instead. Verify the existing conversation is not disturbed in any way
- [ ] **Two Gemini tabs, one blank and one with a conversation** — only the blank one is reused
- [ ] **Gemini tab opened before the extension was installed/reloaded** — a new tab opens
      (the old tab has no content script); no error notification fires
- [ ] Localized Gemini URL with query parameters (e.g. `/app?hl=fr`) is recognized as a blank view

## Pasting

- [ ] The pasted text is the video URL, a blank line, then the prompt
- [ ] The cursor is left at the end of the pasted text and the input is focused
- [ ] **Nothing is submitted automatically** — the message is only sent after you press Enter
- [ ] Pressing Enter sends the prompt and Gemini responds normally
- [ ] Trigger a second summarize while the first is still waiting for a slow Gemini tab — the
      newest prompt is the one pasted, and it is pasted exactly once
- [ ] With a Gemini tab open on a page where the prompt box never appears, a notification says
      the prompt box did not load (allow ~10 seconds)

## Context menus (desktop only)

- [ ] Right-click a YouTube link on any page → "Summarize with Gemini" appears and works
- [ ] Right-click on a YouTube video page → "Summarize with Gemini" appears and works
- [ ] Right-click a non-YouTube link → the item does **not** appear
- [ ] Restart Firefox → both menu items are still registered and still work

## Options page

- [ ] Opens via `about:addons` → extension → Preferences
- [ ] Shows the saved prompt, or the default on first run
- [ ] "Save Changes" shows the success status, and the new prompt is used on the next summarize
- [ ] "Reset Default" restores the default text and saves it
- [ ] Renders correctly in both light and dark mode
- [ ] Usable at a narrow window width (buttons stack, nothing overflows)

## Upgrade path

- [ ] Install the previous released version, run one summarize, then load this build over it
- [ ] The stale `pendingPaste` / `pendingPasteAt` keys are gone from `storage.local`
- [ ] The saved custom prompt survives the upgrade

## Firefox for Android

- [ ] The extension installs and the menu item appears
- [ ] Summarizing from a YouTube video page works
- [ ] No uncaught errors from the missing `contextMenus` / `windows` APIs

## Privacy

- [ ] No network requests originate from the extension itself (check the Network panel in the
      background console during a full summarize)
- [ ] `storage.local` holds only `promptText`, plus a `handoffs` entry that exists only between
      opening a tab and pasting into it (and is cleared when that tab closes)
