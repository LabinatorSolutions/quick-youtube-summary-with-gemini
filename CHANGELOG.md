# Changelog

All notable changes to Quick YouTube Summary with Gemini are documented here.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.1] - 2026-11-06

### Changed

- **Requires Firefox 159 or newer** (desktop and Android). `strict_min_version` is now `159.0`, up from `153.0`.
  Older Firefox releases carry known, unpatched security vulnerabilities. Users on an older Firefox stay on 1.7.0
  until they update their browser.
- New toolbar icon in the Labinator icon system: a white play triangle beside three text lines on an ultramarine
  square. It replaces the gradient icon.
- Development tooling updated to Biome 2.6. Markdown files are now linted by rumdl only. None of this ships in the
  add-on.

### Unchanged

- Extension code is identical to 1.7.0. No new permissions.

## [1.7.0] - 2026-08-13

### Changed

- **Requires Firefox 153 or newer**, up from 150.
- Firefox treats site access as optional, and without access to gemini.google.com nothing can be pasted. The
  extension now asks for that access on first use and, if it is missing, tells you exactly where to grant it,
  instead of failing silently.
- Each pending prompt is tied to the Gemini tab it was opened for and expires, so a prompt can never paste into a
  different tab, or into a tab you open much later.
- The `activeTab` permission was dropped; it was no longer needed.

### Added

- Build, lint and packaging setup (Bun, Biome, web-ext) for contributors. Development files are excluded from the
  AMO package.

## [1.6] - 2026-07-06

### Changed

- The prompt is sent straight to the Gemini tab being reused, so only that tab pastes; other open Gemini tabs never
  react.
- The right-click menu item is back on desktop.
- Site access narrowed to gemini.google.com only. Access to youtube.com, youtu.be and google.com is no longer
  requested.

## [1.5] - 2026-07-06

### Changed

- A Gemini tab with an active conversation is never touched. Only a tab on the blank new-chat view is reused;
  otherwise a new tab opens.
- The prompt is pasted but **not sent**. Review or edit it, then press Enter or click Send yourself.

## [1.4] - 2026-05-06

### Changed

- Rebuilt around a storage-based handoff: the background script stores the prompt, opens Gemini on a fresh page,
  and the Gemini page picks the prompt up when it loads.
- The temporary status popup and the right-click menu were removed.

## [1.3] - 2026-05-06

### Changed

- The toolbar button opened a small status popup ("Working…") instead of relying on the badge, alarms and
  notifications.

## [1.2] - 2026-05-06

### Fixed

- Silent failures on platforms that lack some browser APIs. Errors are now shown as notifications.

## [1.1] - 2026-05-06

### Fixed

- Several problems on Firefox for Android.

### Changed

- A single SVG icon replaces the PNG icon set.

## [1.0] - 2026-05-03

### Added

- First release: send the current YouTube video to Google Gemini with a customizable prompt, from the toolbar
  button or the right-click menu, reusing an open Gemini tab instead of opening a new one each time.
- Requires Firefox 150 or newer. Declares that it collects no data.
