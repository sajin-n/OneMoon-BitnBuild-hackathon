/**
 * OneMoon Phishing Simulation Environment - Site Server
 *
 * Serves the three static simulation applications:
 *  - login.test (or /login)
 *  - file-upload.test (or /file-upload)
 *  - payment.test (or /payment)
 * Along with shared assets and scripts (/shared).
 *
 * Local-only, never contacts external websites.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEBTESTING_ROOT = path.resolve(__dirname, '..');

const DEFAULT_PORT = 4173;
const DEFAULT_HOST = '127.0.0.1';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
};

/**
 * Determine the physical filesystem path based on Host header or path prefix.
 */
function resolveFilePath(req) {
  const hostHeader = (req.headers.host || '').toLowerCase().split(':')[0];
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Normalize slashes
  if (pathname.includes('\\')) {
    pathname = pathname.replace(/\\/g, '/');
  }

  // 1. Check for shared assets/scripts first (available to all hosts)
  if (pathname.startsWith('/shared/')) {
    const relativePart = pathname.slice('/shared/'.length);
    const targetPath = path.resolve(WEBTESTING_ROOT, 'shared', relativePart);
    return { targetPath, basePath: path.resolve(WEBTESTING_ROOT, 'shared') };
  }

  // 2. Hostname-based routing
  if (hostHeader === 'login.test') {
    const relativePart = pathname.replace(/^\//, '');
    let targetPath = path.resolve(WEBTESTING_ROOT, 'login', relativePart);
    if (!fs.existsSync(targetPath) && !path.extname(targetPath)) {
      targetPath = path.resolve(WEBTESTING_ROOT, 'login', 'index.html');
    }
    return { targetPath, basePath: path.resolve(WEBTESTING_ROOT, 'login') };
  }

  if (hostHeader === 'file-upload.test') {
    const relativePart = pathname.replace(/^\//, '');
    let targetPath = path.resolve(WEBTESTING_ROOT, 'file-upload', relativePart);
    if (!fs.existsSync(targetPath) && !path.extname(targetPath)) {
      targetPath = path.resolve(WEBTESTING_ROOT, 'file-upload', 'index.html');
    }
    return { targetPath, basePath: path.resolve(WEBTESTING_ROOT, 'file-upload') };
  }

  if (hostHeader === 'payment.test') {
    const relativePart = pathname.replace(/^\//, '');
    let targetPath = path.resolve(WEBTESTING_ROOT, 'payment', relativePart);
    if (!fs.existsSync(targetPath) && !path.extname(targetPath)) {
      targetPath = path.resolve(WEBTESTING_ROOT, 'payment', 'index.html');
    }
    return { targetPath, basePath: path.resolve(WEBTESTING_ROOT, 'payment') };
  }

  // 3. Path-based routing for localhost / 127.0.0.1
  if (pathname === '/login' || pathname.startsWith('/login/')) {
    const relativePart = pathname.replace(/^\/login\/?/, '');
    let targetPath = path.resolve(WEBTESTING_ROOT, 'login', relativePart);
    if (!fs.existsSync(targetPath) && !path.extname(targetPath)) {
      targetPath = path.resolve(WEBTESTING_ROOT, 'login', 'index.html');
    }
    return { targetPath, basePath: path.resolve(WEBTESTING_ROOT, 'login') };
  }

  // Direct access to suspicious simulation URLs on localhost
  if (
    pathname.startsWith('/secure-account-verification') ||
    pathname.startsWith('/account/security') ||
    pathname.startsWith('/signin/verify-account')
  ) {
    return {
      targetPath: path.resolve(WEBTESTING_ROOT, 'login', 'index.html'),
      basePath: path.resolve(WEBTESTING_ROOT, 'login'),
    };
  }

  if (pathname === '/file-upload' || pathname.startsWith('/file-upload/')) {
    const relativePart = pathname.replace(/^\/file-upload\/?/, '');
    let targetPath = path.resolve(WEBTESTING_ROOT, 'file-upload', relativePart);
    if (!fs.existsSync(targetPath) && !path.extname(targetPath)) {
      targetPath = path.resolve(WEBTESTING_ROOT, 'file-upload', 'index.html');
    }
    return { targetPath, basePath: path.resolve(WEBTESTING_ROOT, 'file-upload') };
  }

  // Direct access to file-upload suspicious URLs on localhost
  if (
    pathname.startsWith('/secure-share') ||
    pathname.startsWith('/document/preview') ||
    pathname.startsWith('/sharepoint/doc-access')
  ) {
    return {
      targetPath: path.resolve(WEBTESTING_ROOT, 'file-upload', 'index.html'),
      basePath: path.resolve(WEBTESTING_ROOT, 'file-upload'),
    };
  }

  if (pathname === '/payment' || pathname.startsWith('/payment/')) {
    const relativePart = pathname.replace(/^\/payment\/?/, '');
    let targetPath = path.resolve(WEBTESTING_ROOT, 'payment', relativePart);
    if (!fs.existsSync(targetPath) && !path.extname(targetPath)) {
      targetPath = path.resolve(WEBTESTING_ROOT, 'payment', 'index.html');
    }
    return { targetPath, basePath: path.resolve(WEBTESTING_ROOT, 'payment') };
  }

  // Direct access to payment suspicious URLs on localhost
  if (
    pathname.startsWith('/refund/claim') ||
    pathname.startsWith('/checkout/account-confirmation') ||
    pathname.startsWith('/payment/secure-verification')
  ) {
    return {
      targetPath: path.resolve(WEBTESTING_ROOT, 'payment', 'index.html'),
      basePath: path.resolve(WEBTESTING_ROOT, 'payment'),
    };
  }

  // 4. Root / Hub page
  if (pathname === '/' || pathname === '/index.html') {
    return { isHubPage: true };
  }

  // Fallback to checking root if specifically requested
  const generalPath = path.resolve(WEBTESTING_ROOT, pathname.replace(/^\//, ''));
  return { targetPath: generalPath, basePath: WEBTESTING_ROOT };
}

/**
 * Generate a friendly hub HTML page for path-based browsing and status verification.
 */
function renderHubPage(sitePort, collectorPort) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OneMoon Simulation Hub</title>
  <link rel="stylesheet" href="/shared/assets/style.css">
  <style>
    .hub-container { max-width: 860px; margin: 40px auto; padding: 0 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; }
    .badge { display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 9999px; background: #e0e7ff; color: #4338ca; }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 24px; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .card h3 { margin-top: 0; color: #0f172a; font-size: 18px; }
    .card p { font-size: 14px; color: #64748b; line-height: 1.5; }
    .card a { display: inline-block; margin-top: 12px; color: #2563eb; text-decoration: none; font-weight: 600; }
    .card a:hover { text-decoration: underline; }
    .hosts-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-top: 30px; font-family: monospace; font-size: 13px; }
  </style>
</head>
<body>
  <div class="hub-container">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <h1>🛡️ OneMoon Phishing Simulation Hub</h1>
      <span class="badge">Local Testing Environment</span>
    </div>
    <p>This server provides controlled phishing-simulation environments for testing the OneMoon browser extension without contacting external networks.</p>

    <h2>Simulation Applications</h2>
    <div class="card-grid">
      <div class="card">
        <h3>1. Login Portal</h3>
        <p>Simulated credential harvesting portal mimicking corporate SSO / login flow.</p>
        <div><strong>Hostname URL:</strong> <a href="http://login.test:${sitePort}/secure-account-verification/login?session=expired&verify=1&security=required">http://login.test:${sitePort}/secure-account-verification/login?session=expired&verify=1...</a></div>
        <div style="margin-top: 6px;"><strong>Path URL:</strong> <a href="/login/secure-account-verification/login?session=expired&verify=1&security=required">http://localhost:${sitePort}/login/secure-account-verification/login?...</a></div>
      </div>

      <div class="card">
        <h3>2. File Upload</h3>
        <p>Simulated malicious document/resume verification upload portal.</p>
        <div><strong>Hostname URL:</strong> <a href="http://file-upload.test:${sitePort}/secure-share/document-viewer?doc=Confidential_Report.pdf&access=encrypted">http://file-upload.test:${sitePort}/secure-share/...</a></div>
        <div style="margin-top: 6px;"><strong>Path URL:</strong> <a href="/file-upload/secure-share/document-viewer?doc=Confidential_Report.pdf&access=encrypted">http://localhost:${sitePort}/file-upload/secure-share/...</a></div>
      </div>

      <div class="card">
        <h3>3. Payment Gateway</h3>
        <p>Simulated fake checkout / payment card collection gateway.</p>
        <div><strong>Hostname URL:</strong> <a href="http://payment.test:${sitePort}/payment/secure-verification?order=TXN8849&amount=1499">http://payment.test:${sitePort}/payment/secure-verification?...</a></div>
        <div style="margin-top: 6px;"><strong>Path URL:</strong> <a href="/payment/secure-verification?order=TXN8849&amount=1499">http://localhost:${sitePort}/payment/secure-verification?...</a></div>
      </div>
    </div>

    <h2 style="margin-top: 36px;">Cross-Origin Collector Server (Port ${collectorPort})</h2>
    <p>Simulates third-party telemetry, tracking pixels, cross-origin scripts, stylesheets, and redirections.</p>
    <ul>
      <li><code><a href="http://collector.test:${collectorPort}/session-check">/session-check</a></code> - Deterministic session validation</li>
      <li><code><a href="http://collector.test:${collectorPort}/resource.js">/resource.js</a></code> - Cross-origin script resource</li>
      <li><code><a href="http://collector.test:${collectorPort}/resource.css">/resource.css</a></code> - Cross-origin stylesheet</li>
      <li><code><a href="http://collector.test:${collectorPort}/pixel">/pixel</a></code> - 1x1 tracking pixel</li>
      <li><code><a href="http://collector.test:${collectorPort}/iframe">/iframe</a></code> - Embedded phishing / verification frame</li>
      <li><code><a href="http://collector.test:${collectorPort}/redirect/login">/redirect/login</a></code> - Simulated open redirect</li>
      <li><code>/telemetry</code> - Sanitized data collection (POST only)</li>
    </ul>

    <div class="hosts-box">
      <strong>Local Hostnames Resolution (/etc/hosts):</strong><br>
      127.0.0.1 login.test<br>
      127.0.0.1 file-upload.test<br>
      127.0.0.1 payment.test<br>
      127.0.0.1 collector.test<br><br>
      <em>Run <code>bash scripts/setup-hosts.sh</code> to verify or configure these entries.</em>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Creates and configures the HTTP Site Server.
 */
export function createSiteServer(options = {}) {
  const port = options.port || parseInt(process.env.SITE_PORT || DEFAULT_PORT, 10);
  const collectorPort = options.collectorPort || parseInt(process.env.COLLECTOR_PORT || 4174, 10);
  const host = options.host || process.env.SITE_HOST || DEFAULT_HOST;

  const server = http.createServer((req, res) => {
    // Add permissive CORS and local security headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('X-Simulation-Environment', 'OneMoon-Local-Only');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
      return;
    }

    try {
      const resolution = resolveFilePath(req);

      if (resolution.isHubPage) {
        const body = renderHubPage(port, collectorPort);
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Length': Buffer.byteLength(body),
        });
        if (req.method === 'HEAD') {
          res.end();
        } else {
          res.end(body);
        }
        return;
      }

      let filePath = resolution.targetPath;
      const basePath = resolution.basePath;

      // Prevent directory traversal attacks
      const relative = path.relative(basePath, filePath);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden: Access outside sandbox directory is prohibited');
        return;
      }

      // Check if path exists
      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;">
          <h2>404 Not Found</h2>
          <p>The requested simulation resource <code>${encodeURIComponent(req.url)}</code> was not found.</p>
          <a href="/">Return to Simulation Hub</a>
        </body></html>`);
        return;
      }

      // If directory, look for index.html
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
        if (!fs.existsSync(filePath)) {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;">
            <h2>Directory Index Missing</h2>
            <p>No <code>index.html</code> found in requested folder.</p>
          </body></html>`);
          return;
        }
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      const fileStat = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': fileStat.size,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      });

      if (req.method === 'HEAD') {
        res.end();
        return;
      }

      const readStream = fs.createReadStream(filePath);
      readStream.on('error', (err) => {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
        }
        res.end('Internal Server Error reading file');
      });
      readStream.pipe(res);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Server Error: ${err.message}`);
    }
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
  const port = parseInt(process.env.SITE_PORT || DEFAULT_PORT, 10);
  const site = createSiteServer({ port });
  site.start().then(() => {
    console.log(`[Site Server] Running on http://${site.host}:${site.port}`);
    console.log(`  - Login:       http://login.test:${site.port}/ or http://localhost:${site.port}/login/`);
    console.log(`  - File Upload: http://file-upload.test:${site.port}/ or http://localhost:${site.port}/file-upload/`);
    console.log(`  - Payment:     http://payment.test:${site.port}/ or http://localhost:${site.port}/payment/`);
  }).catch((err) => {
    console.error('[Site Server] Failed to start:', err);
    process.exit(1);
  });
}
