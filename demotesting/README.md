# OneMoon Phishing Simulation Infrastructure

This directory contains the local, controlled simulation infrastructure used to test the **OneMoon Phishing Detection Browser Extension**.

Everything runs locally on `127.0.0.1` and never contacts external networks or third-party cloud services.

---

## 🔒 Data-Safety & Privacy Assurance

**CRITICAL SECURITY GUARANTEE:**
- **Zero Raw Value Storage or Logging**: The collector server strictly sanitizes all incoming payloads in-memory.
- **Universal Redaction**: All form, credential, and payload values are replaced with `"[REDACTED]"`.
- **Sensitive Fields**: Passwords, credit card numbers, CVVs, OTPs, UPI PINs, auth tokens, and session secrets are **never** logged or stored.
- **File Uploads**: Only metadata (`filename`, `extension`, `mimeType`, `size`) is inspected. Uploaded file contents are discarded immediately and are never read or stored.
- **No External Communication**: All server logic binds locally (`127.0.0.1`). No remote collectors, external webhooks, or public APIs are contacted.

---

## 📁 Architecture & Directory Structure

```text
webtesting/
├── login/                  # App 1: Login / SSO credential harvesting simulation
│   └── index.html
├── file-upload/            # App 2: Malicious document / upload simulation
│   └── index.html
├── payment/                # App 3: Payment gateway simulation
│   └── index.html
├── shared/
│   ├── assets/             # Shared styling (style.css)
│   └── scripts/            # Shared client helper (collector-client.js)
├── server/
│   ├── site-server.js      # Site server (default port 4173)
│   ├── collector-server.js # Cross-origin collector server (default port 4174)
│   └── start.js            # Unified server launcher
├── scripts/
│   └── setup-hosts.sh      # Local hostname resolution helper for /etc/hosts
├── package.json
└── README.md
```

---

## 🌐 Local Hostnames & `/etc/hosts` Setup

To make URL and domain-analysis testing realistic without touching external DNS, four local `.test` hostnames are mapped to `127.0.0.1`:

| Hostname | Port | Purpose |
| :--- | :--- | :--- |
| `login.test` | `4173` | Simulated Login & Credential Portal |
| `file-upload.test` | `4173` | Simulated Document / Resume Upload Portal |
| `payment.test` | `4173` | Simulated Checkout & Payment Gateway |
| `collector.test` | `4174` | Simulated Cross-Origin Collector & Resource Server |

### Automatic Status Check & Configuration

Check status of `/etc/hosts`:
```bash
bash webtesting/scripts/setup-hosts.sh
```

Optionally install entries using sudo with explicit confirmation:
```bash
bash webtesting/scripts/setup-hosts.sh --install
```

### Manual Configuration

Add the following block to your `/etc/hosts` file:
```text
# --- BEGIN ONEMOON TEST HOSTS ---
127.0.0.1 login.test
127.0.0.1 file-upload.test
127.0.0.1 payment.test
127.0.0.1 collector.test
# --- END ONEMOON TEST HOSTS ---
```

> **Note:** If you prefer not to modify `/etc/hosts`, path-based access on `http://localhost:4173/` is fully supported!

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v25)
- Zero external npm dependencies are required. The servers are built entirely with Node.js built-ins (`node:http`, `node:fs`, `node:path`, `node:url`).

### 2. Starting the Servers

From the `webtesting/` directory:
```bash
npm start
```

Or from the monorepo root:
```bash
node webtesting/server/start.js
```

Or start servers individually:
```bash
# Site server only (port 4173)
node webtesting/server/site-server.js

# Collector server only (port 4174)
node webtesting/server/collector-server.js
```

### Configurable Ports
```bash
node webtesting/server/start.js --site-port 4173 --collector-port 4174 --host 127.0.0.1
```
Or set environment variables `SITE_PORT` and `COLLECTOR_PORT`.

---

## 🔗 Accessible URLs

### Hostname-Based (with `/etc/hosts`)
- **Login Simulation**: `http://login.test:4173/secure-account-verification/login?session=expired&verify=1&security=required`
  - Completion page: `http://login.test:4173/complete.html`
- **File Upload Simulation**: `http://file-upload.test:4173/secure-share/document-viewer?doc=Confidential_Report.pdf&access=encrypted`
  - Document viewer: `http://file-upload.test:4173/view.html`
- **Payment Simulation**: `http://payment.test:4173/payment/secure-verification?order=TXN8849&amount=1499`
  - Receipt page: `http://payment.test:4173/receipt.html`
- **Collector Endpoint**: `http://collector.test:4174/`

### Path-Based (without `/etc/hosts`)
- Central Hub Dashboard: `http://localhost:4173/`
- Login Simulation: `http://localhost:4173/login/secure-account-verification/login?session=expired&verify=1`
- File Upload Simulation: `http://localhost:4173/file-upload/secure-share/document-viewer?doc=Confidential_Report.pdf`
- Payment Simulation: `http://localhost:4173/payment/secure-verification?order=TXN8849&amount=1499`
- Shared Assets: `http://localhost:4173/shared/assets/style.css`
- Shared Scripts: `http://localhost:4173/shared/scripts/collector-client.js`

---

## 🛰️ Shared Collector Endpoints (Port 4174)

The collector server simulates external attacker infrastructure and suspicious cross-origin activities that browser extensions monitor:

| Endpoint | Method | Response / Purpose |
| :--- | :--- | :--- |
| `/telemetry` | `POST`, `GET` | Receives form data and telemetry. Discards sensitive values, returns redacted metadata. |
| `/session-check` | `GET`, `POST` | Deterministic session verification JSON and sets harmless cookie. |
| `/resource.js` | `GET` | Simulates cross-origin script inclusion (`application/javascript`). Sets `window.__oneMoonCollectorResourceLoaded`. |
| `/resource.css` | `GET` | Simulates cross-origin stylesheet inclusion (`text/css`). |
| `/pixel` | `GET` | Simulates 1x1 transparent tracking GIF beacon (`image/gif`). |
| `/iframe` | `GET` | Simulates an embedded cross-origin iframe / SSO phishing frame. |
| `/redirect/<target>` | `GET` | Simulates open redirect (constrained to `*.test` and `localhost`). |

---

## 🧪 Client Helper Library (`collector-client.js`)

Simulation applications can include the shared client script:
```html
<script src="/shared/scripts/collector-client.js"></script>
```

Available API:
```javascript
// Send cross-origin telemetry POST
await OneMoonCollectorClient.sendTelemetry('custom_event', { key: 'value' });

// Trigger 1x1 tracking pixel
OneMoonCollectorClient.triggerPixel({ campaign: 'test' });

// Inject cross-origin script
await OneMoonCollectorClient.injectCrossoriginScript();

// Inject cross-origin stylesheet
OneMoonCollectorClient.injectCrossoriginStylesheet();

// Embed cross-origin iframe
OneMoonCollectorClient.createCrossoriginIframe('#container');

// Session check
const session = await OneMoonCollectorClient.checkSession();

// Open redirect
OneMoonCollectorClient.triggerRedirect('login');
```
