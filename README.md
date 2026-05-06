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
- ✅ **Customizable Prompt** - Fully editable prompt template in the extension options (with Dark Mode support).
- ✅ **Smart Tab Management** - Reuses your existing Gemini tab instead of opening a new one every time.
- ✅ **Robust DOM Interaction** - Reliable polling mechanism to interact with Gemini's rich-text interface.
- ✅ **Privacy First** - Everything stays local. No telemetry, no external API calls, just native browser APIs.
- ✅ **Lightweight** - Minimal background footprint utilizing a non-persistent Manifest V3 background script.

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

3. **Enjoy the Magic**
   - The extension will automatically switch to your Gemini tab (or open one if it doesn't exist).
   - It will securely paste the video URL and your custom prompt into the input field.
   - It will automatically trigger the "Send" button.

4. **Customizing the Prompt**
   - Right-click the extension icon and select "Manage Extension" -> "Options".
   - Modify the default prompt text to fit your workflow.
   - Click "Save".

## 🔧 Troubleshooting

### Extension Not Working

**Issue:** Clicking the button does nothing.

**Solutions:**

1. Ensure you are currently viewing a valid YouTube video (`youtube.com/watch?v=...` or `youtu.be/...`).
2. Check if you are logged into Gemini.
3. The extension navigates Gemini to a fresh page and waits up to 10 seconds for the interface to load. If Gemini is slow to start, wait a moment and try again.

## Privacy Policy

This extension is committed to your privacy:

- ✅ **No Data Collection** - We don't collect, store, or transmit any data.
- ✅ **No Tracking** - No analytics, no telemetry, no cookies.
- ✅ **No External API Keys** - Uses your active Gemini session, keeping your data between you and Google.
- ✅ **Open Source** - All code is public and auditable.

### Permissions Explained

The extension requests:

| Permission                                | Purpose                                            |
| ----------------------------------------- | -------------------------------------------------- |
| `activeTab`                               | Read the current YouTube tab URL                   |
| `storage`                                 | Save your custom prompt and pass it to Gemini      |
| `tabs`                                    | Find and switch to an existing Gemini tab          |
| `notifications`                           | Show error feedback (e.g. not a YouTube page)      |
| `contextMenus`                            | Add the right-click option (desktop only)          |
| `https://gemini.google.com/*`             | Find existing Gemini tabs and navigate to them     |

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
└── README.md                        # This file
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
