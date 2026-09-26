# OneMoon System Architecture

## 1. System Vision

**OneMoon** is an enterprise-grade cybersecurity and threat intelligence platform designed to defend inboxes and browser environments against spear-phishing, social engineering, business email compromise (BEC), and malicious link delivery.

```
                           +--------------------------------------+
                           |      OneMoon Chrome Extension        |
                           |  (Gmail DOM + Active Tab Telemetry)  |
                           +------------------+-------------------+
                                              |
                                     JSON / HTTPS REST
                                              v
+------------------------+         +----------+-----------+         +-------------------------+
| Threat Intelligence    | <-----> |   Fastify Backend    | <-----> |   FastAPI ML Service    |
| (VirusTotal, AbuseIPDB)|         |      API Gateway     |         | (NLP, Phishing Heuristic|
+------------------------+         +----------+-----------+         +-------------------------+
                                              |
                       +----------------------+----------------------+
                       |                      |                      |
                       v                      v                      v
             +------------------+   +-------------------+  +--------------------+
             | PostgreSQL Store |   |  Redis Job Cache  |  | Blockchain Ledger  |
             | (Events/Verdicts)|   | (Rate-limits/IOC) |  | (Evidence Integrity|
             +------------------+   +-------------------+  +--------------------+
                                              ^
                                              |
                                   +----------+-----------+
                                   | Web Dashboard (React)|
                                   | (Security Intel UI)  |
                                   +----------------------+
```

## 2. Monorepo Components

### `apps/extension`
- **Role**: Chrome Manifest V3 browser extension.
- **Key Modules**:
  - `popup`: Quick status, threat overview, and toggle settings.
  - `sidepanel`: Detailed email header inspect, threat indicators, and forensic evidence.
  - `content/gmail`: Real-time DOM inspection of incoming emails in Gmail web client.
  - `content/website`: Active URL inspection and deceptive landing page protection.
  - `background`: Service worker managing state, extension lifecycle, and secure API transport.

### `apps/api`
- **Role**: High-throughput backend REST API built with Fastify and TypeScript.
- **Responsibilities**:
  - Ingestion of telemetry from browser extensions.
  - Orchestration of analysis pipeline (heuristics -> ML -> DB).
  - Serving data to the Web Dashboard.

### `apps/ml-service`
- **Role**: Python FastAPI microservice specializing in AI/ML threat detection.
- **Responsibilities**:
  - Natural Language Processing (NLP) of email body content to detect urgency, authority spoofing, and credential harvesting patterns.
  - URL lexical analysis and homoglyph detection.

### `apps/dashboard`
- **Role**: Security operations and analyst portal built with React, Vite, and Tailwind CSS.
- **Responsibilities**:
  - Organization-wide security posture monitoring.
  - Incident triage and audit history.

### `packages/types`
- Centralized TypeScript contracts, data models, and schemas shared across the frontend extension, dashboard, and backend API.

### `packages/security-engine`
- Shared detection engine containing core mathematical scoring heuristics, rulesets, and signature matchers.

### `packages/config`
- Centralized base TypeScript, ESLint, and environment configurations.

## 3. Data Flow

1. **Extraction**: Extension extracts non-invasive email metadata (sender headers, routing hops, domain names, links) upon email view.
2. **Preliminary Scoring**: Local engine evaluates preliminary heuristics (display name spoofing, known homoglyphs).
3. **Deep Analysis**: If flagged or policy-directed, payload is forwarded to the API Gateway.
4. **Threat Enrichment**: API queries ML inference service.
5. **Verdict & Banner**: Aggregated risk score and actionable warning banner are returned to the extension.
6. **Dashboard Event**: Incident telemetry is published for real-time visualization on the Web Dashboard.
