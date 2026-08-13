# Maintenance Guide

## Dependency Management

The **extension itself has no dependencies and no build step** — Firefox loads the vanilla
JavaScript files directly, and the published package contains exactly the source files.

`package.json` exists only for development tooling:

| Tool                | Purpose                                    |
| ------------------- | ------------------------------------------ |
| `@biomejs/biome`    | Linting and formatting (JS, JSON, CSS/HTML) |
| `web-ext`           | Manifest linting, running, packaging, signing |

Update them with:

```bash
bun update --latest
bun run lint
```

Both are dev-only, so a version bump never affects what ships to users. `bun.lock` is committed so
CI installs the same versions with `--frozen-lockfile`.

## Keeping the Extension Up to Date

### When Gemini's UI changes

The most likely maintenance task. If the prompt box stops receiving text:

1. Open `content.js`
2. Update `INPUT_SELECTOR` to match Gemini's new DOM
3. Verify with the "Pasting" section of [TESTING-CHECKLIST.md](./TESTING-CHECKLIST.md)

If the *blank new-chat* URL shape changes, also update `GEMINI_HOME_URL` in `background.js` —
otherwise the extension will stop reusing tabs and open a new one every time.

Note that `document.execCommand('insertText')` is deprecated but is still the only reliable way to
write into Gemini's rich-text editor so the app registers the change. If a future Firefox drops it,
the replacement must be verified against the live Gemini UI, not just in isolation.

### When YouTube's URL patterns change

Update **both** lists in `background.js`:

- `YOUTUBE_PATTERNS` — the regexes that validate the current tab
- `YOUTUBE_MENU_PATTERNS` — the match patterns for the context menu items

They serve different APIs and use different syntax, so they must be edited together.

### Firefox minimum version

`strict_min_version` is `153.0` and should track current Firefox. Raise it in a release of its own
rather than alongside a bug fix — users below the new floor stop receiving updates, so raising it
in the same release would strand them on the broken version.

## Releasing a New Version

1. Bump `"version"` in **both** `manifest.json` and `package.json` (CI enforces that they match)
2. Update the "Supported Versions" table in [SECURITY.md](./SECURITY.md)
3. Run `bun run lint`
4. Work through [TESTING-CHECKLIST.md](./TESTING-CHECKLIST.md) in full
5. Build the package:

   ```bash
   bun run build
   ```

6. Upload `web-ext-artifacts/*.zip` to the [AMO Developer Hub](https://addons.mozilla.org/developers/)
7. Tag the release in git

No source-code submission is needed on AMO: nothing is minified, bundled, or generated.
