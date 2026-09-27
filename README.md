# ThreatSight

## Private, explainable phishing protection for the web

ThreatSight is a Chrome extension that helps people answer a simple question before they trust a webpage:

> **Does this page look safe, or is it trying to make me surrender something valuable?**

Instead of relying on a black-box verdict or sending browsing data to a remote service, ThreatSight inspects the current page locally. It combines the page URL, visible page structure, forms, scripts, frames, resources, and observed network activity into a risk report that explains why a page looks suspicious.

The goal is not to replace user judgment. The goal is to give users a fast, understandable second opinion at the moment a page asks for a password, payment detail, verification code, or other sensitive information.

## The problem

Modern phishing pages are designed to look familiar. A fake login page can copy a trusted brand, use a convincing domain name, load content from several origins, hide an iframe, or quietly send credentials somewhere unexpected. A basic URL blocklist often misses these pages, while an unexplained warning does not help a user decide what to do next.

ThreatSight addresses both gaps:

- **Broader evidence:** it looks at the URL and the page's behavior, not just whether a domain is known.
- **Explainable results:** every score is backed by findings and evidence.
- **Privacy by design:** analysis happens in the extension, with no page data sent to an external service.

## How ThreatSight works

```text
Current tab
    |
    +--> URL analysis
    |      HTTPS, domain depth, suspicious TLDs, embedded credentials,
    |      brand impersonation, IDN/punycode and homoglyph signals
    |
    +--> Page analysis
    |      sensitive forms, cross-origin submissions, frames, scripts,
    |      external resources, redirects and credential-related requests
    |
    +--> Local detection engine
	    combines URL and page evidence into a 0-100 risk score
	    and explainable findings
    |
    +--> Popup report
	    low-risk, suspicious or high-risk classification
```

The content script collects a structured snapshot of the page. The background service worker adds observed requests for the tab. The deterministic engine then produces a report containing the score, classification, signal breakdown, hostname, timestamp, and findings.

## What the prototype detects

### URL and identity signals

- Pages that do not use HTTPS
- IDN/punycode and non-ASCII hostnames
- Common homoglyph substitutions that imitate recognizable brands
- Brand-like words outside the apparent registrable domain
- Unusually deep subdomain chains
- TLDs frequently associated with abuse reports
- Embedded usernames or passwords in a URL

### Page and behavior signals

- Forms requesting passwords, payment details, verification codes, or other sensitive data
- Forms submitting information to another origin
- Hidden or cross-origin iframes
- Cross-origin JavaScript and other resources
- Obfuscated scripts and dynamic code execution such as `eval()` or `Function()`
- Redirect context
- Third-party cookies
- Fetch, XHR, or beacon requests to credential- or payment-related endpoints

## Risk report

The engine returns a score from `0` to `100`:

| Score | Classification | Meaning |
| --- | --- | --- |
| `0-34` | Low risk | No strong suspicious pattern was found by the local checks. |
| `35-69` | Suspicious | One or more signals deserve attention before continuing. |
| `70-100` | High risk | Multiple or high-severity signals suggest the page may be attempting to deceive or collect sensitive data. |

URL evidence contributes 55% of the final score and page evidence contributes 45%. The popup also shows the separate URL and page signal scores, so users can see whether the concern comes from the destination, the page itself, or both.

## Privacy model

ThreatSight is designed around local analysis:

- Page inspection runs inside the extension.
- The detection engine is deterministic and auditable JavaScript.
- Reports are stored per tab in `chrome.storage.session`.
- No page content, URLs, or observed requests are sent to an external API by the current prototype.
- Tab request history is discarded when a tab is closed.

Local detection is intentionally transparent. A future AI-assisted layer could summarize structured findings in plain language, but it should remain an optional interpretation layer rather than becoming the only source of truth.

## Install and try it locally

1. Open Chrome and go to `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked**.
4. Select the repository's `extension/` folder.
5. Open a webpage, then click the ThreatSight extension icon to view its report.

To refresh an edited extension, return to `chrome://extensions` and click the extension's reload button.

## Demonstration scenarios

The `demotesting/` folder contains a local login-page scenario for demonstrating how ThreatSight reacts when a page requests sensitive information. For a useful demo, show the contrast between:

1. A normal page with no suspicious signals.
2. A page with a password or payment form.
3. A page whose URL imitates a trusted brand or uses a suspicious hostname.

The popup makes the change visible through the score, risk level, signal breakdown, and individual findings.

## Project structure

```text
extension/
  manifest.json   Chrome Manifest V3 configuration and permissions
  content.js      Local DOM, form, frame, resource and script collection
  background.js   Service worker and per-tab request collection
  engine.js       Deterministic URL and page risk analysis
  popup.html      Report structure for the active tab
  popup.css       Popup styling
  popup.js        Popup state and report rendering

demotesting/      Local scenarios and demo material
docs/             Product notes and project documentation
```

## Current limitations and next steps

This is a focused hackathon prototype, not a complete anti-phishing service. It does not maintain a reputation database, guarantee that a page is safe, inspect encrypted traffic outside the browser's extension APIs, or replace browser security warnings.

The next product steps are:

- Add a clear user action layer: continue, leave, or report a suspicious page.
- Improve domain parsing with a public suffix list so registrable domains are identified more precisely.
- Add confidence calibration and tests against a larger set of benign and phishing examples.
- Add an optional AI explanation layer that receives only the structured findings and preserves the local-first privacy model.
- Add accessible warning states and a history view for recent reports.

## License

See [LICENSE](LICENSE).
