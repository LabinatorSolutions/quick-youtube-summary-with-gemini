# Testing Checklist

Use this checklist to verify the **Quick YouTube Summary with Gemini** extension is working correctly.

---

## Pre-Installation

- [ ] **Files present**
  - [ ] `manifest.json`
  - [ ] `background.js`
  - [ ] `content.js`
  - [ ] `config.js`
  - [ ] `options.html`
  - [ ] `options.js`
  - [ ] `icons/icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`

- [ ] **Manifest validation**
  - [ ] `manifest.json` is valid JSON
  - [ ] `manifest_version` is `3`
  - [ ] Permissions are exactly: `activeTab`, `alarms`, `contextMenus`, `scripting`, `storage`
  - [ ] Host permission is only: `https://gemini.google.com/*`

---

## Installation

- [ ] Navigate to `about:debugging#/runtime/this-firefox`
- [ ] Click "Load Temporary Add-on" → select `manifest.json`
- [ ] Extension loads with no errors in the browser console
- [ ] Extension icon appears in the toolbar
- [ ] Extension listed under `about:addons`

---

## Toolbar Icon — Summarize via Click

### On a YouTube Watch Page

- [ ] Navigate to `https://www.youtube.com/watch?v=...`
- [ ] Click toolbar icon
- [ ] Gemini tab opens (or existing tab is focused and brought to front)
- [ ] The video URL and custom prompt are pasted into Gemini's input field
- [ ] Gemini's Send button is clicked automatically
- [ ] Gemini begins generating a summary

### On a YouTube Shorts Page

- [ ] Navigate to `https://www.youtube.com/shorts/...`
- [ ] Click toolbar icon → Shorts URL sent to Gemini correctly

### On a youtu.be Short Link

- [ ] Navigate to `https://youtu.be/...`
- [ ] Click toolbar icon → short URL sent to Gemini correctly

### On a Non-YouTube Page

- [ ] Navigate to any non-YouTube page (e.g., `https://example.com`)
- [ ] Click toolbar icon
- [ ] A red `!` badge appears on the extension icon for ~3 seconds, then clears
- [ ] No Gemini tab is opened
- [ ] No action taken in Gemini

---

## Context Menu — Right-Click

### On a YouTube Video Link (any page)

- [ ] Right-click a YouTube video link (e.g., from search results or a playlist page)
- [ ] "Summarize with Gemini" appears in context menu
- [ ] Clicking it → Gemini tab opens/focuses → URL + prompt pasted → sent

### On a YouTube Page (page-level context)

- [ ] Open a YouTube video page
- [ ] Right-click anywhere on the page (not on a specific link)
- [ ] "Summarize with Gemini" appears in the context menu
- [ ] Clicking it sends the current page URL to Gemini

### On a Non-YouTube Page or Link

- [ ] Right-click a non-YouTube link or page
- [ ] "Summarize with Gemini" does **NOT** appear in the context menu

---

## Tab Reuse

- [ ] Open a Gemini tab manually (`https://gemini.google.com`)
- [ ] Navigate to a YouTube video in another tab
- [ ] Click toolbar icon
- [ ] Existing Gemini tab is reused — no duplicate tab opened
- [ ] Gemini tab is brought to the front

### Multiple Gemini Tabs Open

- [ ] Open two Gemini tabs
- [ ] Click toolbar icon on YouTube
- [ ] First Gemini tab is used (no new tab opened)

---

## Pending Summary (New Gemini Tab)

- [ ] Close all Gemini tabs
- [ ] Navigate to a YouTube video
- [ ] Click toolbar icon
- [ ] A new Gemini tab opens and begins loading
- [ ] Once fully loaded, the URL + prompt is automatically pasted and sent
- [ ] Summary generation begins without any extra user action

### Graceful Cleanup

- [ ] Trigger a pending summary (close Gemini tabs, click icon on YouTube)
- [ ] Before Gemini finishes loading, close the Gemini tab
- [ ] No browser crash or unhandled error in console
- [ ] Pending entry is cleaned up from session storage

---

## Options Page

- [ ] Right-click extension icon → "Manage Extension" → "Preferences" (or "Options")
- [ ] Options page opens
- [ ] Default prompt text is pre-filled in the textarea
- [ ] Textarea is editable
- [ ] Click "Save Changes" → "Saved successfully" status briefly appears
- [ ] Click "Reset Default" → textarea resets to default prompt and saves
- [ ] Custom prompt persists after closing and reopening the options page
- [ ] Custom prompt persists after browser restart
- [ ] Custom prompt is used in the next summarization (verify the pasted text in Gemini)

---

## Dark Mode

- [ ] Set OS/system to dark mode
- [ ] Open the options page → dark theme is applied
- [ ] All text is readable with sufficient contrast
- [ ] Textarea, card, and buttons are correctly styled

---

## Storage & Privacy

- [ ] Open `about:debugging` → Inspect extension → Storage tab
- [ ] Only `promptText` key exists in local storage
- [ ] No URLs, video data, or personal info stored
- [ ] Open DevTools → Network tab while using the extension
- [ ] No outgoing network requests from the extension itself

---

## Console (Background Script)

- [ ] Open `about:debugging` → Inspect the extension → Console tab
- [ ] Click toolbar icon on YouTube video → log: `Successfully started summarization.`
- [ ] Click toolbar icon on non-YouTube page → warning logged + `!` badge shown
- [ ] No unhandled promise rejections in console

---

## Edge Cases

- [ ] Click icon on YouTube twice rapidly → only one Gemini request is triggered
- [ ] Browser restart → custom prompt persists, extension functional
- [ ] Reload extension after manifest edit → no console errors on re-load

---

## Known Issues

Document any issues found:

| Issue | Severity | Reproducible? | Notes |
| ----- | -------- | ------------- | ----- |
|       |          |               |       |

---

## Test Results Summary

Date: _______________  
Firefox Version: _______________  
OS: _______________  

**Overall Result:** ☐ Pass ☐ Fail ☐ Partial

**Critical Issues:** _______________

**Minor Issues:** _______________

**Ready for Release:** ☐ Yes ☐ No

---

**Testing completed by:** _______________  
**Date:** _______________  
**Sign-off:** ☐ Approved for deployment
