# OneMoon Threat Model

## 1. Assets & Objectives

The primary goal of **OneMoon** is to safeguard enterprise users and organizations against malicious communication vectors without compromising user privacy or email workflow velocity.

### Primary Assets
- **Corporate Credentials & Identity**: Protection against fake login portals and credential harvesting forms.
- **Financial & Operational Integrity**: Defense against Business Email Compromise (BEC), CEO fraud, and invoice manipulation.
- **Endpoints**: Shielding local workstations against zero-day payload delivery and drive-by malware downloads.
- **Audit Trails**: Preserving tamper-resistant records of security incidents for forensic and compliance requirements.

## 2. Threat Actors & Vectors

| Threat Actor | Motivations | Typical Vectors |
| :--- | :--- | :--- |
| **Commodity Cybercriminals** | Financial gain, ransomware extortion | Mass phishing campaigns, malicious attachments, spoofed banking notifications. |
| **Targeted APTs** | Espionage, supply chain compromise | Spear-phishing with customized pretexts, Unicode homograph domains, zero-width URL obfuscation. |
| **Insider Threats / Impersonators** | Data exfiltration, payment redirection | Display name spoofing, cousin domains, compromised vendor accounts. |

## 3. Threat Classification (STRIDE Mapping)

- **Spoofing**:
  - *Threat*: Attackers forge header From lines and display names.
  - *Mitigation*: Strict DMARC, DKIM, and SPF validation, visual display-name discrepancy warnings, cousin domain similarity scoring (Levenshtein distance).
- **Tampering**:
  - *Threat*: Malicious modification of incident reports or alert suppression.
  - *Mitigation*: Cryptographic hash generation of email metadata anchored on audit records.
- **Repudiation**:
  - *Threat*: Senders or administrators denying receipt/action on a critical security notification.
  - *Mitigation*: Immutable timestamping and structured audit logs stored in PostgreSQL.
- **Information Disclosure**:
  - *Threat*: Leaking sensitive email content to external threat APIs or ML endpoints.
  - *Mitigation*: Client-side sanitization of PII before telemetry transmission; only hashes and structural features transmitted by default.
- **Denial of Service**:
  - *Threat*: Flooding the backend API or ML service with massive volumes of mock scan requests.
  - *Mitigation*: Redis-backed token bucket rate-limiting and connection pooling.
- **Elevation of Privilege**:
  - *Threat*: Malicious script injection into Chrome extension context.
  - *Mitigation*: Chrome Manifest V3 isolation, strict Content Security Policy (CSP), no `eval()` or remote code execution.

## 4. Trust Boundaries

1. **Browser DOM Boundary**:
   - Untrusted third-party email HTML parsed inside sandboxed rendering contexts with sanitized text extraction.
2. **Client-to-Gateway Boundary**:
   - Authenticated HTTPS endpoints with CORS policy enforcing extension and dashboard access limits.
3. **Internal Microservices Boundary**:
   - Private network communication between Fastify API, ML FastAPI service, Redis, and PostgreSQL.
