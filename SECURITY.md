# Security Policy

## Supported Versions

Only the latest release receives security fixes. Update the extension — and Firefox itself — to
stay supported.

| Version | Supported          |
| ------- | ------------------ |
| 1.7.x   | :white_check_mark: |
| < 1.7   | :x:                |

The extension requires **Firefox 153 or newer**. Older Firefox releases carry known, unpatched
vulnerabilities; the `strict_min_version` floor is a deliberate security decision, not an
oversight.

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please bring it to our attention.

### How to Report

Please do **NOT** report security vulnerabilities through public GitHub issues.

Instead, please report them through our contact form at https://labinator.com/contact

You should expect to receive a response within 48 hours. If for some reason you do not, please follow up with us to ensure we received your original message.

### Process

1. **Triage:** We will review your report and confirm the specific behavior.
2. **Fix:** We will prepare a patch for the issue.
3. **Release:** We will release a new version of the extension.
4. **Disclosure:** Once the fix is released, we will publicly disclose the vulnerability if appropriate.

## Security Best Practices

This project follows strict security guidelines:
- Minimal permissions
- No external code execution (`eval`, etc.)
- Content Security Policy (CSP) compliance
- No data collection

See [CONTRIBUTING.md](CONTRIBUTING.md) for more development security guidelines.
