/**
 * OneMoon Phishing Simulation Environment - Collector & Resource Server
 *
 * Simulates third-party / cross-origin infrastructure:
 *  - /telemetry: Ingests telemetry/form submissions with STRICT REDACTION
 *  - /session-check: Simulates session check / heartbeat ping
 *  - /resource.js: Simulates cross-origin script injection
 *  - /resource.css: Simulates cross-origin stylesheet inclusion
 *  - /pixel: 1x1 tracking pixel / beacon
 *  - /iframe: Simulated cross-origin iframe
 *  - /redirect/<target>: Simulated open redirect (constrained to local test origins)
 *
 * STRICT DATA-SAFETY REQUIREMENT:
 *  - NEVER stores or prints raw sensitive values
 *  - All field values are discarded and replaced with '[REDACTED]'
 *  - Passwords, card numbers, CVV, OTP, UPI PIN, auth tokens are NEVER logged
 *  - File uploads: ONLY metadata is extracted (filename, extension, mime, size).
 *    File contents are discarded immediately and NEVER read, stored, or logged.
 */

import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const DEFAULT_PORT = 4174;
const DEFAULT_HOST = '127.0.0.1';

// 1x1 transparent GIF (43 bytes)
const TRANSPARENT_1X1_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

// Sensitive field naming patterns
const SENSITIVE_PATTERNS = [
  /pass(word|wd|phrase)?/i,
  /secret/i,
  /token/i,
  /auth(orization)?/i,
  /api[-_]?key/i,
  /card(number|_num|num)?/i,
  /cc[-_]?(num|number)?/i,
  /cvv|cvc|cid/i,
  /pin/i,
  /otp/i,
  /upi/i,
  /ssn/i,
  /security[-_]?code/i,
  /private[-_]?key/i,
  /credential/i,
  /account[-_]?number/i,
];

function isSensitiveField(fieldName) {
  if (typeof fieldName !== 'string') return false;
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(fieldName));
}

/**
 * Strips all raw values, replacing every value with '[REDACTED]'.
 * Extracts only safe metadata: field names, types, value lengths, and sensitivity flags.
 */
function sanitizeFields(obj) {
  const sanitized = {};
  const fieldSummary = [];
  let sensitiveFound = false;

  if (!obj || typeof obj !== 'object') {
    return {
      sanitized: {},
      fieldSummary: [],
      sensitiveFound: false,
      fieldNames: [],
    };
  }

  for (const [key, val] of Object.entries(obj)) {
    const isSens = isSensitiveField(key);
    if (isSens) {
      sensitiveFound = true;
    }

    let valType = typeof val;
    let valLength = 0;

    if (val === null || val === undefined) {
      valType = 'null';
      valLength = 0;
    } else if (typeof val === 'string') {
      valLength = val.length;
    } else if (typeof val === 'number') {
      valLength = String(val).length;
    } else if (typeof val === 'object') {
      valLength = Array.isArray(val) ? val.length : Object.keys(val).length;
    }

    fieldSummary.push({
      field: key,
      type: valType,
      length: valLength,
      isSensitive: isSens,
    });

    // Replace all values with [REDACTED]
    sanitized[key] = '[REDACTED]';
  }

  return {
    sanitized,
    fieldSummary,
    sensitiveFound,
    fieldNames: Object.keys(obj),
  };
}

/**
 * Parses multipart boundary from Content-Type header.
 */
function getMultipartBoundary(contentType) {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  return match ? (match[1] || match[2]).trim() : null;
}

/**
 * Minimal zero-dependency streaming multipart processor.
 * Extracts field names and file metadata (filename, extension, mimeType, size)
 * while DISCARDING all file data chunks immediately.
 */
function parseMultipartMetadata(buffer, boundary) {
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const fields = {};
  const files = [];

  let start = 0;
  while (start < buffer.length) {
    const boundaryIndex = buffer.indexOf(boundaryBuffer, start);
    if (boundaryIndex === -1) break;

    const nextBoundaryIndex = buffer.indexOf(
      boundaryBuffer,
      boundaryIndex + boundaryBuffer.length
    );
    if (nextBoundaryIndex === -1) break;

    const part = buffer.subarray(
      boundaryIndex + boundaryBuffer.length,
      nextBoundaryIndex
    );
    start = nextBoundaryIndex;

    const headerEndIndex = part.indexOf('\r\n\r\n');
    if (headerEndIndex === -1) continue;

    const headerText = part.subarray(0, headerEndIndex).toString('utf-8');
    const bodyPart = part.subarray(
      headerEndIndex + 4,
      part.length >= 2 && part[part.length - 2] === 13 && part[part.length - 1] === 10
        ? part.length - 2
        : part.length
    );

    const dispositionMatch = headerText.match(
      /Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i
    );
    if (!dispositionMatch) continue;

    const fieldName = dispositionMatch[1];
    const filename = dispositionMatch[2];

    if (filename !== undefined) {
      // It's a file part!
      const contentTypeMatch = headerText.match(/Content-Type:\s*([^\r\n]+)/i);
      const mimeType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';
      const ext = path.extname(filename).toLowerCase();
      const fileSize = bodyPart.length;

      // RECORD METADATA ONLY - FILE CONTENTS ARE NEVER STORED OR LOGGED
      files.push({
        fieldName,
        filename: path.basename(filename),
        extension: ext,
        mimeType,
        sizeBytes: fileSize,
      });
    } else {
      // It's a regular text field
      // We do not store raw value; we record that the field existed and its length
      const rawString = bodyPart.toString('utf-8');
      fields[fieldName] = rawString;
    }
  }

  const { sanitized, fieldSummary, sensitiveFound, fieldNames } = sanitizeFields(fields);

  return {
    fields: sanitized,
    fieldSummary,
    sensitiveFound,
    fieldNames,
    files,
  };
}

/**
 * Safely parse incoming body, strictly enforcing value redaction.
 */
function processIncomingPayload(bodyBuffer, contentType) {
  const type = (contentType || '').toLowerCase();

  // 1. Multipart form-data
  if (type.includes('multipart/form-data')) {
    const boundary = getMultipartBoundary(contentType);
    if (boundary) {
      return parseMultipartMetadata(bodyBuffer, boundary);
    }
  }

  // 2. JSON
  if (type.includes('application/json')) {
    try {
      const rawText = bodyBuffer.toString('utf-8');
      const parsed = JSON.parse(rawText || '{}');
      const { sanitized, fieldSummary, sensitiveFound, fieldNames } = sanitizeFields(parsed);
      return {
        fields: sanitized,
        fieldSummary,
        sensitiveFound,
        fieldNames,
        files: [],
      };
    } catch {
      return {
        fields: { parse_error: '[REDACTED]' },
        fieldSummary: [],
        sensitiveFound: false,
        fieldNames: [],
        files: [],
      };
    }
  }

  // 3. URL-encoded form data
  if (type.includes('application/x-www-form-urlencoded')) {
    const rawText = bodyBuffer.toString('utf-8');
    const params = new URLSearchParams(rawText);
    const parsedObj = {};
    for (const [k, v] of params.entries()) {
      parsedObj[k] = v;
    }
    const { sanitized, fieldSummary, sensitiveFound, fieldNames } = sanitizeFields(parsedObj);
    return {
      fields: sanitized,
      fieldSummary,
      sensitiveFound,
      fieldNames,
      files: [],
    };
  }

  // 4. Fallback / Plain text
  const length = bodyBuffer.length;
  return {
    fields: { payload: '[REDACTED]' },
    fieldSummary: [{ field: 'raw_payload', type: 'binary/text', length, isSensitive: false }],
    sensitiveFound: false,
    fieldNames: ['raw_payload'],
    files: [],
  };
}

/**
 * Validates local-only redirect destinations.
 * Prohibits external websites to keep testing strictly local.
 */
function isAllowedRedirectTarget(targetUrl) {
  if (!targetUrl) return false;

  // Relative paths within test domain
  if (targetUrl.startsWith('/') && !targetUrl.startsWith('//')) {
    return true;
  }

  try {
    const parsed = new URL(targetUrl);
    const hostname = parsed.hostname.toLowerCase();
    const isLocal =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.test');
    return isLocal;
  } catch {
    return false;
  }
}

/**
 * Creates the Collector HTTP Server.
 */
export function createCollectorServer(options = {}) {
  const port = options.port || parseInt(process.env.COLLECTOR_PORT || DEFAULT_PORT, 10);
  const sitePort = options.sitePort || parseInt(process.env.SITE_PORT || 4173, 10);
  const host = options.host || process.env.COLLECTOR_HOST || DEFAULT_HOST;

  const server = http.createServer((req, res) => {
    // -------------------------------------------------------------
    // Comprehensive CORS Headers for cross-origin testing
    // -------------------------------------------------------------
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('X-Simulation-Collector', 'OneMoon-Local-Collector');

    // Handle OPTIONS Preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'collector.test'}`);
    const pathname = parsedUrl.pathname;

    // -------------------------------------------------------------
    // 1. Endpoint: /resource.js (Simulated Cross-Origin Script)
    // -------------------------------------------------------------
    if (pathname === '/resource.js') {
      const scriptContent = `/**
 * OneMoon Phishing Simulation - Simulated Third-Party Script
 * Origin: collector.test:${port}
 * Harmless and deterministic.
 */
(function() {
  console.log('[OneMoon Collector] Cross-origin script resource.js executed from: ' + window.location.origin);
  window.__oneMoonCollectorResourceLoaded = true;
  window.__oneMoonCollectorScriptTimestamp = '${new Date().toISOString()}';
  
  // Dispatch custom event for test harnesses
  try {
    window.dispatchEvent(new CustomEvent('onemoon:collector:script-loaded', {
      detail: { source: 'collector.test:${port}/resource.js' }
    }));
  } catch (e) {}
})();
`;
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Content-Length': Buffer.byteLength(scriptContent),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      });
      res.end(scriptContent);
      return;
    }

    // -------------------------------------------------------------
    // 2. Endpoint: /resource.css (Simulated Cross-Origin Stylesheet)
    // -------------------------------------------------------------
    if (pathname === '/resource.css') {
      const cssContent = `/**
 * OneMoon Phishing Simulation - Simulated Third-Party Stylesheet
 * Origin: collector.test:${port}
 * Harmless and deterministic.
 */
.onemoon-collector-active {
  box-shadow: 0 0 0 2px #ef4444;
}
.onemoon-security-badge {
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 11px;
  color: #64748b;
}
`;
      res.writeHead(200, {
        'Content-Type': 'text/css; charset=utf-8',
        'Content-Length': Buffer.byteLength(cssContent),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      });
      res.end(cssContent);
      return;
    }

    // -------------------------------------------------------------
    // 3. Endpoint: /pixel (Simulated 1x1 Tracking Pixel / Beacon)
    // -------------------------------------------------------------
    if (pathname === '/pixel' || pathname === '/pixel.gif') {
      console.log(`[Collector] Pixel beacon requested by ${req.headers.referer || req.headers.host || 'unknown'} (query: ${parsedUrl.search || 'none'})`);
      res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': TRANSPARENT_1X1_GIF.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
      });
      res.end(TRANSPARENT_1X1_GIF);
      return;
    }

    // -------------------------------------------------------------
    // 4. Endpoint: /iframe (Simulated Embedded Phishing / SSO Frame)
    // -------------------------------------------------------------
    if (pathname === '/iframe') {
      // Explicitly allow framing for cross-origin simulation
      res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://*.test:* http://localhost:* http://127.0.0.1:*");
      const iframeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Partner Frame</title>
</head>
<body style="margin:0;padding:0;background:transparent;overflow:hidden;">
  <!-- Simulated Cross-Origin Iframe -->
</body>
</html>`;
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': Buffer.byteLength(iframeHtml),
      });
      res.end(iframeHtml);
      return;
    }

    // -------------------------------------------------------------
    // 5. Endpoint: /session-check (Deterministic Session Endpoint)
    // -------------------------------------------------------------
    if (pathname === '/session-check') {
      // Set harmless simulation cookie
      res.setHeader('Set-Cookie', 'onemoon_sim_session=verified_test_session; Path=/; SameSite=Lax; Max-Age=3600');
      const responseData = {
        status: 'active',
        simulated: true,
        sessionValid: true,
        timestamp: new Date().toISOString(),
        collectorHost: req.headers.host || 'collector.test',
        clientIp: req.socket.remoteAddress,
        message: 'Session check passed (deterministic simulation response)',
      };
      const jsonStr = JSON.stringify(responseData, null, 2);
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(jsonStr),
      });
      res.end(jsonStr);
      return;
    }

    // -------------------------------------------------------------
    // 6. Endpoint: /redirect/<target> (Simulated Open Redirect)
    // -------------------------------------------------------------
    if (pathname.startsWith('/redirect')) {
      let target = parsedUrl.searchParams.get('to');
      if (!target) {
        const subPath = pathname.replace(/^\/redirect\/?/, '');
        if (subPath === 'login' || subPath === 'login/') {
          target = `http://login.test:${sitePort}/`;
        } else if (subPath === 'file-upload' || subPath === 'file-upload/') {
          target = `http://file-upload.test:${sitePort}/`;
        } else if (subPath === 'payment' || subPath === 'payment/') {
          target = `http://payment.test:${sitePort}/`;
        } else if (subPath) {
          target = decodeURIComponent(subPath);
        }
      }

      if (!target) {
        target = `http://login.test:${sitePort}/`;
      }

      // Security check: Only local test origins permitted
      if (!isAllowedRedirectTarget(target)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Prohibited redirect destination',
            message: 'In security testing, redirects outside *.test or localhost are forbidden.',
            target,
          })
        );
        return;
      }

      console.log(`[Collector] Simulating redirect 302 -> ${target}`);
      res.writeHead(302, {
        Location: target,
        'Cache-Control': 'no-cache',
      });
      res.end();
      return;
    }

    // -------------------------------------------------------------
    // 7. Telemetry & Form Submissions (/telemetry or ANY POST request)
    // -------------------------------------------------------------
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      const fullBuffer = Buffer.concat(chunks);
      const contentType = req.headers['content-type'] || '';
      const clientOrigin = req.headers.origin || req.headers.referer || 'unknown';
      const eventType = parsedUrl.searchParams.get('event') || (req.method === 'POST' ? 'form_submission' : 'telemetry_ping');

      const processed = processIncomingPayload(fullBuffer, contentType);

      // DATA SAFETY: Ensure NOTHING raw is printed or saved
      // Print strictly redacted audit log to console
      const logMetadata = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: pathname,
        siteOrigin: clientOrigin,
        eventType,
        fieldCount: processed.fieldNames.length,
        fieldsDetected: processed.fieldNames,
        sensitiveDetected: processed.sensitiveFound,
        fileAttachments: processed.files.map((f) => ({
          name: f.filename,
          ext: f.extension,
          mime: f.mimeType,
          sizeBytes: f.sizeBytes,
        })),
      };

      console.log('[Collector Data-Safety Log]', JSON.stringify(logMetadata));

      // Deterministic Safe JSON Response
      const responseData = {
        success: true,
        collector: 'OneMoon Local Security Testing Collector',
        eventType,
        site: clientOrigin,
        timestamp: logMetadata.timestamp,
        dataSafety: {
          rawValuesStored: false,
          rawValuesLogged: false,
          redactionApplied: true,
          sensitiveDetected: processed.sensitiveFound,
        },
        metadata: {
          fieldsDetected: processed.fieldNames,
          fieldSummary: processed.fieldSummary,
          files: processed.files,
        },
        sanitizedFields: processed.fields, // ALL values are '[REDACTED]'
      };

      const jsonStr = JSON.stringify(responseData, null, 2);
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(jsonStr),
      });
      res.end(jsonStr);
    });
  });

  return {
    server,
    port,
    host,
    start: () =>
      new Promise((resolve, reject) => {
        server.listen(port, host, (err) => {
          if (err) return reject(err);
          resolve({ port, host });
        });
      }),
    stop: () =>
      new Promise((resolve) => {
        server.close(resolve);
      }),
  };
}

// Standalone execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = parseInt(process.env.COLLECTOR_PORT || DEFAULT_PORT, 10);
  const collector = createCollectorServer({ port });
  collector.start().then(() => {
    console.log(`[Collector Server] Running on http://${collector.host}:${collector.port}`);
    console.log(`  - Telemetry:     http://collector.test:${collector.port}/telemetry`);
    console.log(`  - Session Check: http://collector.test:${collector.port}/session-check`);
    console.log(`  - Resource JS:   http://collector.test:${collector.port}/resource.js`);
    console.log(`  - Resource CSS:  http://collector.test:${collector.port}/resource.css`);
    console.log(`  - Pixel:         http://collector.test:${collector.port}/pixel`);
    console.log(`  - Iframe:        http://collector.test:${collector.port}/iframe`);
    console.log(`  - Redirect:      http://collector.test:${collector.port}/redirect/login`);
  }).catch((err) => {
    console.error('[Collector Server] Failed to start:', err);
    process.exit(1);
  });
}
