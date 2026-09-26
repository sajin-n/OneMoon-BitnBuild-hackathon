# Phishing Detector

Basic Chrome Extension Manifest V3 prototype for private, explainable phishing detection.

## Architecture

```text
Browser Extension
	-> collects URL, DOM, script, iframe, form, resource, and observed request data
	-> Detection Engine analyzes URL, IDN/homoglyph, and page signals locally
	-> AI Analysis boundary correlates structured findings in a future step
	-> risk analysis/report
```

## Current scope

The extension is intentionally small and includes a popup report. It analyzes:

- suspicious URL structure and non-HTTPS pages
- IDN/punycode and common homoglyph patterns
- sensitive or cross-origin forms
- hidden or cross-origin iframes
- obfuscated JavaScript and dynamic code execution
- cross-origin scripts and other resources
- observed external requests and redirect context

The engine returns a score from 0 to 100, a low-risk/suspicious/high-risk classification, category scores, and explainable findings. It does not send page data to an external service.

## Install locally

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose the repository's `extension/` folder.

The current report is stored in `chrome.storage.session` per tab. A popup or web analyzer can consume it later.

## Structure

- `extension/manifest.json` - Chrome MV3 configuration and popup registration.
- `extension/content.js` - local DOM and page-signal collector.
- `extension/background.js` - service worker and request collection.
- `extension/engine.js` - deterministic URL, homoglyph, and page analysis.
- `extension/popup.html`, `popup.css`, `popup.js` - score and findings UI for the active tab.
- `extension/ai/` - future AI correlation contract and documentation.
- `demotesting/` - demo scenarios and test material.
