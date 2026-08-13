# Quick YouTube Summary with Gemini

A Firefox extension that summarizes YouTube videos using Google Gemini. Customize your prompts and get instant insights without leaving your flow.

[![Firefox Add-on](https://img.shields.io/badge/Firefox_Add--on-Get_It_Now-blue.svg)](https://addons.mozilla.org/en-US/firefox/addon/quick-yt-summary-with-gemini/)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)

## Purpose

This extension provides a seamless bridge between YouTube and Google Gemini. Instead of manually copying a video URL, opening Gemini, and typing out a prompt, you can do it in a single click.

- 📝 Generate concise summaries of long lectures or tutorials.
- ⚡ Extract key takeaways in seconds.
- 🎯 Customizable prompts allow you to tailor the AI's response to your specific needs.
- 📑 Tab reuse prevents clutter by interacting with your existing open Gemini tab.

**Note:** This extension requires you to be logged into your Google account on Gemini (`gemini.google.com`).

## Features

- ✅ **One-Click Summaries** - Send the current YouTube video directly to Gemini via the toolbar button or right-click context menu.
- ✅ **You Stay in Control** - The prompt is pasted and focused, never sent automatically. Review or edit it, then press Enter yourself.
- ✅ **Customizable Prompt** - Fully editable prompt template in the extension options (with Dark Mode support).
- ✅ **Conversation-Safe Tab Reuse** - Reuses an existing Gemini tab only when it is sitting on the blank new-chat view. A tab with an active conversation is never touched; a fresh tab is opened instead.
- ✅ **Robust DOM Interaction** - Reliable polling mechanism to interact with Gemini's rich-text interface.
- ✅ **Privacy First** - Everything stays local. No telemetry, no external API calls, just native browser APIs.
- ✅ **Lightweight** - Minimal background footprint utilizing a non-persistent Manifest V3 background script.

## Requirements

- Firefox 153 or newer (desktop or Android). Older releases are unsupported and carry known security vulnerabilities — update your browser.
- An active Google account signed in to `gemini.google.com`.

## Installation

### Firefox Desktop & Android

1. **Download the Extension**
   - [**Download from Mozilla Add-ons (Recommended)**](https://addons.mozilla.org/en-US/firefox/addon/quick-yt-summary-with-gemini/)
   - Or clone this repository:

   ```bash
   git clone https://github.com/LabinatorSolutions/quick-youtube-summary-with-gemini.git
   cd quick-youtube-summary-with-gemini
   ```

2. **Load as Temporary Add-on** (desktop, for development/testing)
   - Open Firefox
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from the extension folder
   - The extension will remain active until you restart Firefox

## 🎮 Usage

1. **Navigate to YouTube**
   - Open any YouTube video.

2. **Summarize**
   - Click the extension icon in your toolbar (or browser menu on Android), OR
   - Right-click anywhere on the page and select "Summarize with Gemini" (desktop only).

3. **Review and Send**
   - The extension switches to a Gemini tab that is on the blank new-chat view, or opens a new tab if every open Gemini tab has an active conversation.
   - It pastes the video URL and your custom prompt into the input field and leaves the cursor there.
   - **Nothing is submitted for you.** Read the prompt, edit it if you want, then press Enter or click Send.

4. **Customizing the Prompt**
   - Right-click the extension icon and select "Manage Extension" -> "Options".
   - Modify the default prompt text to fit your workflow.
   - Click "Save".

## 🔧 Troubleshooting

### Nothing happens when I click the button

1. Ensure you are viewing a valid YouTube video (`youtube.com/watch?v=...`, `youtu.be/...`, or a Short). The extension shows a notification when the current page is not a YouTube video.
2. Check that you are logged into Gemini.
3. **Check the Gemini permission.** Firefox treats host access as optional and revocable: open `about:addons` → this extension → **Permissions** and make sure *Access your data for gemini.google.com* is enabled. Without it Firefox blocks the content script that does the pasting, so a tab opens and nothing is pasted. The extension asks for this permission the first time you use it; if you declined, re-enable it here. Reload any Gemini tab that was already open.
4. The extension waits up to 10 seconds for Gemini's prompt box to appear. If it never does, a notification says so — reload the Gemini tab and try again.

### The prompt was pasted but nothing was sent

That is intended. The extension deliberately stops after pasting so you can review and edit the prompt. Press Enter or click Send yourself.

### It opened a new tab instead of using my existing Gemini tab

Also intended. A Gemini tab showing an active conversation is left alone so an in-progress chat is never disrupted. Only a tab on the blank new-chat view is reused.

## Privacy Policy

This extension is committed to your privacy:

- ✅ **No Data Collection** - We don't collect, store, or transmit any data.
- ✅ **No Tracking** - No analytics, no telemetry, no cookies.
- ✅ **No External API Keys** - Uses your active Gemini session, keeping your data between you and Google.
- ✅ **Open Source** - All code is public and auditable.

### Permissions Explained

The extension requests:

| Permission                    | Purpose                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `storage`                     | Save your custom prompt (local) and hand the pending prompt to a new tab (session) |
| `tabs`                        | Read the current tab's URL, find Gemini tabs, and switch to them                   |
| `notifications`               | Show error feedback (e.g. not a YouTube page)                                      |
| `contextMenus`                | Add the right-click option (desktop only)                                          |
| `https://gemini.google.com/*` | Find existing Gemini tabs and paste into them                                      |

Firefox treats the `gemini.google.com` host access as optional — you can revoke it at any time in `about:addons` → Permissions. The extension cannot paste without it and will ask for it on first use.

No host permission is requested for YouTube: the extension only reads the active tab's URL, and never injects code into or reads content from YouTube pages.

## 🛠️ Development

### Project Structure

```text
quick-youtube-summary-with-gemini/
├── manifest.json                    # Extension configuration
├── background.js                    # Background script (non-persistent event page)
├── content.js                       # Content script for Gemini DOM interaction
├── config.js                        # Default prompt text
├── options.html                     # Options page UI
├── options.js                       # Options page logic
├── icon.svg                         # Extension icon (all sizes)
├── package.json                     # Dev tooling only — the extension itself ships no dependencies
├── biome.json                       # Biome linter/formatter configuration
├── web-ext-config.mjs               # Packaging exclusions for web-ext
└── .github/workflows/ci.yml         # Lint + build on every push and pull request
```

### Commands

The extension is plain JavaScript with **no build step** — Firefox loads the source files directly. The tooling below only lints and packages it.

```bash
bun install       # Install dev tooling (Biome + web-ext)
bun run lint      # Biome check + web-ext lint
bun run lint:fix  # Apply Biome's safe fixes, then lint
bun run start     # Launch Firefox with the extension loaded
bun run build     # Package into web-ext-artifacts/
```

## Contributing

Contributions are welcome! Here's how you can help:

1. **Report Bugs**
   - Open an issue with details and steps to reproduce.
2. **Submit Pull Requests**
   - Fork the repository, create a feature branch, and submit a PR.

## License

GNU Affero General Public License v3.0

Copyright (c) 2026 Labinator

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

## Credits

Developed by [Labinator](https://Labinator.com).

## Support

- **Issues:** https://github.com/LabinatorSolutions/quick-youtube-summary-with-gemini/issues

## Ethical Use & Responsibility

This extension is designed strictly to enhance the learning and viewing experience for valid users by providing quick insights and summaries of video content.

**Please use this tool responsibly.** It is **NOT** intended to:

- Mass-scrape or automatically harvest video transcripts
- Circumvent platform protections or generate spam
- Replace meaningful engagement with content creators

We strongly encourage users to respect the platform and its creators. Summaries are meant to aid understanding, not to deprive creators of legitimate viewership.

## Disclaimer

This extension is not affiliated with, endorsed by, or officially connected to YouTube, Google, Gemini, or Mozilla. It is an independent project created for educational purposes and personal use.

The extension respects YouTube's and Google's terms of service by:

- Not circumventing any paywalls or premium features
- Not downloading or modifying video content
- Utilizing the user's own authenticated session to manually query an AI model
- Acting strictly as a macro to automate typing a prompt into the Gemini interface

Use responsibly and in accordance with YouTube's and Google's Terms of Service.
