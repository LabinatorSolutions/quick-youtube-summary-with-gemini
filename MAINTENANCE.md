# Maintenance Guide

## Dependency Management

This project has **no npm dependencies**. It is a pure WebExtension with no build step required — all files are vanilla JavaScript loaded directly by Firefox.

There is nothing to install or update beyond the browser itself.

## Keeping the Extension Up to Date

### When Gemini's UI Changes

The most likely maintenance task is updating the input element selectors in `content.js` if Google changes Gemini's DOM structure.

1. Open `content.js`
2. Find the `document.querySelector` call inside `pasteUrlToActiveElement`
3. Update the selector list to match the new Gemini UI

### When YouTube's URL Patterns Change

If YouTube introduces new URL formats, update the `youtubePatterns` array in `background.js` and the `targetUrlPatterns` / `documentUrlPatterns` in the context menu registration.

## Releasing a New Version

1. Increment `"version"` in `manifest.json`
2. Run through [TESTING-CHECKLIST.md](./TESTING-CHECKLIST.md) in full
3. Create a ZIP (see [CONTRIBUTING.md](./CONTRIBUTING.md) — Building for Distribution)
4. Upload to [AMO Developer Hub](https://addons.mozilla.org/developers/)
