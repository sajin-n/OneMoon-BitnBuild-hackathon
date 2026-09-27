/**
 * OneMoon Phishing Simulation Environment - Automated Smoke Test
 *
 * Verifies:
 * 1. Both servers launch successfully.
 * 2. Path-based routing works for all three sites and shared assets.
 * 3. Hostname-based virtual hosting works for login.test, file-upload.test, payment.test.
 * 4. Collector endpoints: /resource.js, /resource.css, /pixel, /iframe, /session-check, /redirect.
 * 5. Cross-origin CORS headers.
 * 6. Strict Data-Safety & Universal Redaction: sensitive values and file contents are never stored/returned.
 */

import http from 'node:http';
import { createSiteServer } from '../server/site-server.js';
import { createCollectorServer } from '../server/collector-server.js';

const TEST_SITE_PORT = 4183;
const TEST_COLLECTOR_PORT = 4184;

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const bodyBuffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: bodyBuffer.toString('utf-8'),
          rawBody: bodyBuffer,
        });
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exitCode = 1;
    throw new Error(message);
  } else {
    console.log(`  ✅ ${message}`);
  }
}

async function runSmokeTests() {
  console.log('====================================================');
  console.log('    OneMoon Simulation Shared Infrastructure Test   ');
  console.log('====================================================\n');

  const site = createSiteServer({ port: TEST_SITE_PORT, collectorPort: TEST_COLLECTOR_PORT });
  const collector = createCollectorServer({ port: TEST_COLLECTOR_PORT, sitePort: TEST_SITE_PORT });

  await site.start();
  await collector.start();

  try {
    // ----------------------------------------------------
    // TEST GROUP 1: Site Server Path-Based Routing
    // ----------------------------------------------------
    console.log('--- TEST GROUP 1: Site Server Path-Based Routing ---');

    const hubRes = await request({
      hostname: '127.0.0.1',
      port: TEST_SITE_PORT,
      path: '/',
      method: 'GET',
    });
    assert(hubRes.statusCode === 200, 'Hub page returned 200 OK');
    assert(hubRes.body.includes('OneMoon Phishing Simulation Hub'), 'Hub page contains title');

    const loginRes = await request({
      hostname: '127.0.0.1',
      port: TEST_SITE_PORT,
      path: '/login/',
      method: 'GET',
    });
    assert(loginRes.statusCode === 200, 'Path /login/ returned 200 OK');
    assert(loginRes.body.includes('Re-authenticate Session'), 'Login index served with authentic header');

    // Test suspicious path on localhost
    const suspiciousPathRes = await request({
      hostname: '127.0.0.1',
      port: TEST_SITE_PORT,
      path: '/secure-account-verification/login?session=expired&verify=1&security=required',
      method: 'GET',
    });
    assert(suspiciousPathRes.statusCode === 200, 'Suspicious URL path returned 200 OK');
    assert(suspiciousPathRes.body.includes('type="password"'), 'Form contains password input');
    assert(suspiciousPathRes.body.includes('type="email"'), 'Form contains email input');
    assert(suspiciousPathRes.body.includes('collector.test:4174/resource.css'), 'References external cross-origin CSS');
    assert(suspiciousPathRes.body.includes('collector.test:4174/resource.js'), 'References external cross-origin JS');
    assert(suspiciousPathRes.body.includes('collector.test:4174/pixel'), 'References external tracking pixel');
    assert(suspiciousPathRes.body.includes('collector.test:4174/iframe'), 'Embeds cross-origin iframe');
    assert(suspiciousPathRes.body.includes('Emergency Access: Session Token Reset'), 'Contains suspicious decoy link');
    assert(!suspiciousPathRes.body.includes('THIS IS A PHISHING TEST'), 'Does not contain giveaway phishing test banner');

    // Test completion page
    const completeRes = await request({
      hostname: '127.0.0.1',
      port: TEST_SITE_PORT,
      path: '/login/complete.html',
      method: 'GET',
    });
    assert(completeRes.statusCode === 200, '/login/complete.html returned 200 OK');
    assert(completeRes.body.includes('Identity Verified Successfully'), 'Completion page contains verified status');

    // ----------------------------------------------------
    // Test File Upload Simulation
    // ----------------------------------------------------
    const uploadRes = await request({
      hostname: '127.0.0.1',
      port: TEST_SITE_PORT,
      path: '/file-upload/',
      method: 'GET',
    });
    assert(uploadRes.statusCode === 200, 'Path /file-upload/ returned 200 OK');
    assert(uploadRes.body.includes('Confidential_Report_Q3_Audited.pdf'), 'File upload index displays document title');

    const uploadSuspiciousRes = await request({
      hostname: '127.0.0.1',
      port: TEST_SITE_PORT,
      path: '/secure-share/document-viewer?doc=Confidential_Report.pdf&access=encrypted',
      method: 'GET',
    });
    assert(uploadSuspiciousRes.statusCode === 200, 'Suspicious file-upload path returned 200 OK');
    assert(uploadSuspiciousRes.body.includes('type="email"'), 'File-upload form contains email input');
    assert(uploadSuspiciousRes.body.includes('type="password"'), 'File-upload form contains password input');
    assert(uploadSuspiciousRes.body.includes('type="file"'), 'File-upload form contains certificate file input');
    assert(uploadSuspiciousRes.body.includes('collector.test:4174/resource.css'), 'File-upload references external cross-origin CSS');
    assert(uploadSuspiciousRes.body.includes('collector.test:4174/resource.js'), 'File-upload references external cross-origin JS');
    assert(uploadSuspiciousRes.body.includes('collector.test:4174/pixel'), 'File-upload references external tracking pixel');
    assert(uploadSuspiciousRes.body.includes('collector.test:4174/iframe'), 'File-upload embeds cross-origin iframe');

    const uploadViewRes = await request({
      hostname: '127.0.0.1',
      port: TEST_SITE_PORT,
      path: '/file-upload/view.html',
      method: 'GET',
    });
    assert(uploadViewRes.statusCode === 200, '/file-upload/view.html returned 200 OK');
    assert(uploadViewRes.body.includes('CONFIDENTIAL EXECUTIVE SUMMARY'), 'Document viewer displays confidential summary');
    assert(uploadViewRes.body.includes('btn-download'), 'Document viewer includes download button');

    // ----------------------------------------------------
    // Test Payment Simulation
    // ----------------------------------------------------
    const paymentRes = await request({
      hostname: '127.0.0.1',
      port: TEST_SITE_PORT,
      path: '/payment/',
      method: 'GET',
    });
    assert(paymentRes.statusCode === 200, 'Path /payment/ returned 200 OK');
    assert(paymentRes.body.includes('₹1,499.00'), 'Payment index contains realistic amount ₹1,499.00');

    const paymentSuspiciousRes = await request({
      hostname: '127.0.0.1',
      port: TEST_SITE_PORT,
      path: '/payment/secure-verification?order=TXN8849&amount=1499',
      method: 'GET',
    });
    assert(paymentSuspiciousRes.statusCode === 200, 'Suspicious payment path returned 200 OK');
    assert(paymentSuspiciousRes.body.includes('upi_id'), 'Payment form contains UPI ID field');
    assert(paymentSuspiciousRes.body.includes('autocomplete="cc-number"'), 'Payment form contains cc-number autocomplete');
    assert(paymentSuspiciousRes.body.includes('autocomplete="cc-exp"'), 'Payment form contains cc-exp autocomplete');
    assert(paymentSuspiciousRes.body.includes('autocomplete="cc-csc"'), 'Payment form contains cc-csc autocomplete');
    assert(paymentSuspiciousRes.body.includes('autocomplete="cc-name"'), 'Payment form contains cc-name autocomplete');
    assert(paymentSuspiciousRes.body.includes('collector.test:4174/resource.css'), 'Payment references external cross-origin CSS');
    assert(paymentSuspiciousRes.body.includes('collector.test:4174/resource.js'), 'Payment references external cross-origin JS');
    assert(paymentSuspiciousRes.body.includes('collector.test:4174/pixel'), 'Payment references external tracking pixel');
    assert(paymentSuspiciousRes.body.includes('collector.test:4174/iframe'), 'Payment embeds cross-origin iframe');

    const paymentReceiptRes = await request({
      hostname: '127.0.0.1',
      port: TEST_SITE_PORT,
      path: '/payment/receipt.html',
      method: 'GET',
    });
    assert(paymentReceiptRes.statusCode === 200, '/payment/receipt.html returned 200 OK');
    assert(paymentReceiptRes.body.includes('Transaction Complete'), 'Receipt page displays Transaction Complete');

    const cssRes = await request({
      hostname: '127.0.0.1',
      port: TEST_SITE_PORT,
      path: '/shared/assets/style.css',
      method: 'GET',
    });
    assert(cssRes.statusCode === 200, 'Shared style.css returned 200 OK');
    assert(cssRes.headers['content-type'].includes('text/css'), 'style.css has text/css content type');

    const clientJsRes = await request({
      hostname: '127.0.0.1',
      port: TEST_SITE_PORT,
      path: '/shared/scripts/collector-client.js',
      method: 'GET',
    });
    assert(clientJsRes.statusCode === 200, 'Shared collector-client.js returned 200 OK');
    assert(clientJsRes.headers['content-type'].includes('javascript'), 'collector-client.js has javascript content type');

    // ----------------------------------------------------
    // TEST GROUP 2: Hostname-Based Virtual Hosting
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 2: Hostname-Based Routing ---');

    const vhostLogin = await request({
      hostname: '127.0.0.1',
      port: TEST_SITE_PORT,
      path: '/',
      method: 'GET',
      headers: { Host: `login.test:${TEST_SITE_PORT}` },
    });
    assert(vhostLogin.body.includes('Re-authenticate Session'), 'Host login.test maps to /login/index.html');

    const vhostLoginSuspicious = await request({
      hostname: '127.0.0.1',
      port: TEST_SITE_PORT,
      path: '/secure-account-verification/login?session=expired&verify=1&security=required',
      method: 'GET',
      headers: { Host: `login.test:${TEST_SITE_PORT}` },
    });
    assert(vhostLoginSuspicious.statusCode === 200, 'Host login.test serves suspicious path with 200 OK');
    assert(vhostLoginSuspicious.body.includes('type="password"'), 'Suspicious path on login.test contains password form');

    const vhostUpload = await request({
      hostname: '127.0.0.1',
      port: TEST_SITE_PORT,
      path: '/',
      method: 'GET',
      headers: { Host: `file-upload.test:${TEST_SITE_PORT}` },
    });
    assert(vhostUpload.statusCode === 200, 'Host file-upload.test returned 200 OK');
    assert(vhostUpload.body.includes('Confidential_Report_Q3_Audited.pdf'), 'Host file-upload.test maps to /file-upload/index.html');

    const vhostPayment = await request({
      hostname: '127.0.0.1',
      port: TEST_SITE_PORT,
      path: '/',
      method: 'GET',
      headers: { Host: `payment.test:${TEST_SITE_PORT}` },
    });
    assert(vhostPayment.statusCode === 200, 'Host payment.test returned 200 OK');
    assert(vhostPayment.body.includes('City Electric'), 'Host payment.test maps to /payment/index.html');

    const vhostShared = await request({
      hostname: '127.0.0.1',
      port: TEST_SITE_PORT,
      path: '/shared/assets/style.css',
      method: 'GET',
      headers: { Host: `payment.test:${TEST_SITE_PORT}` },
    });
    assert(vhostShared.statusCode === 200, 'Host payment.test can access /shared/assets/style.css');

    // ----------------------------------------------------
    // TEST GROUP 3: Collector Server Shared Resources
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 3: Collector Endpoints ---');

    const scriptRes = await request({
      hostname: '127.0.0.1',
      port: TEST_COLLECTOR_PORT,
      path: '/resource.js',
      method: 'GET',
    });
    assert(scriptRes.statusCode === 200, '/resource.js returned 200 OK');
    assert(scriptRes.headers['content-type'].includes('javascript'), '/resource.js has javascript MIME');
    assert(scriptRes.body.includes('__oneMoonCollectorResourceLoaded'), '/resource.js sets test indicator');

    const extCssRes = await request({
      hostname: '127.0.0.1',
      port: TEST_COLLECTOR_PORT,
      path: '/resource.css',
      method: 'GET',
    });
    assert(extCssRes.statusCode === 200, '/resource.css returned 200 OK');
    assert(extCssRes.headers['content-type'].includes('text/css'), '/resource.css has text/css MIME');

    const pixelRes = await request({
      hostname: '127.0.0.1',
      port: TEST_COLLECTOR_PORT,
      path: '/pixel',
      method: 'GET',
    });
    assert(pixelRes.statusCode === 200, '/pixel returned 200 OK');
    assert(pixelRes.headers['content-type'] === 'image/gif', '/pixel has image/gif MIME');
    assert(pixelRes.rawBody.length === 42, '/pixel returns valid 42-byte 1x1 transparent GIF');

    const iframeRes = await request({
      hostname: '127.0.0.1',
      port: TEST_COLLECTOR_PORT,
      path: '/iframe',
      method: 'GET',
    });
    assert(iframeRes.statusCode === 200, '/iframe returned 200 OK');
    assert(iframeRes.body.includes('Simulated Cross-Origin Iframe'), '/iframe HTML returned');

    const sessionRes = await request({
      hostname: '127.0.0.1',
      port: TEST_COLLECTOR_PORT,
      path: '/session-check',
      method: 'GET',
    });
    assert(sessionRes.statusCode === 200, '/session-check returned 200 OK');
    const sessionJson = JSON.parse(sessionRes.body);
    assert(sessionJson.status === 'active' && sessionJson.sessionValid === true, '/session-check returned valid session status');
    assert(Boolean(sessionRes.headers['set-cookie']), '/session-check sets simulated test cookie');

    const redirectRes = await request({
      hostname: '127.0.0.1',
      port: TEST_COLLECTOR_PORT,
      path: '/redirect/login',
      method: 'GET',
    });
    assert(redirectRes.statusCode === 302, '/redirect/login returned 302 Found');
    assert(redirectRes.headers['location'].includes('login.test'), 'Redirect location targets login.test');

    const badRedirectRes = await request({
      hostname: '127.0.0.1',
      port: TEST_COLLECTOR_PORT,
      path: '/redirect?to=https://evil.external.com',
      method: 'GET',
    });
    assert(badRedirectRes.statusCode === 400, 'External redirect blocked with 400 Bad Request');

    // ----------------------------------------------------
    // TEST GROUP 4: CORS & Data-Safety Sanitization
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 4: CORS & Strict Data Safety ---');

    // Preflight OPTIONS
    const corsOptions = await request({
      hostname: '127.0.0.1',
      port: TEST_COLLECTOR_PORT,
      path: '/telemetry',
      method: 'OPTIONS',
      headers: {
        Origin: 'http://login.test:4173',
        'Access-Control-Request-Method': 'POST',
      },
    });
    assert(corsOptions.statusCode === 204, 'CORS Preflight returned 204 No Content');
    assert(corsOptions.headers['access-control-allow-origin'] === 'http://login.test:4173', 'CORS origin properly mirrored');

    // POST credential submission with sensitive data
    const rawSensitiveSecret = 'SuperSecretP@ssword99!';
    const rawCardNumber = '4111-2222-3333-4444';
    const payload = JSON.stringify({
      username: 'target_user@enterprise.local',
      password: rawSensitiveSecret,
      card_number: rawCardNumber,
      cvv: '123',
      otp: '789012',
      site: 'http://login.test:4173',
    });

    const telemetryRes = await request(
      {
        hostname: '127.0.0.1',
        port: TEST_COLLECTOR_PORT,
        path: '/telemetry?event=credential_submission',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          Origin: 'http://login.test:4173',
        },
      },
      payload
    );

    assert(telemetryRes.statusCode === 200, 'POST /telemetry returned 200 OK');
    const telemetryData = JSON.parse(telemetryRes.body);

    // Assert NO raw sensitive values leaked in response
    assert(!telemetryRes.body.includes(rawSensitiveSecret), 'Raw password NEVER returned in response');
    assert(!telemetryRes.body.includes(rawCardNumber), 'Raw card number NEVER returned in response');
    assert(telemetryData.dataSafety.redactionApplied === true, 'Data safety redaction flag is true');
    assert(telemetryData.dataSafety.sensitiveDetected === true, 'Sensitive fields accurately identified');
    assert(telemetryData.sanitizedFields.password === '[REDACTED]', 'Password value replaced with [REDACTED]');
    assert(telemetryData.sanitizedFields.card_number === '[REDACTED]', 'Card number value replaced with [REDACTED]');
    assert(telemetryData.sanitizedFields.cvv === '[REDACTED]', 'CVV value replaced with [REDACTED]');
    assert(telemetryData.sanitizedFields.otp === '[REDACTED]', 'OTP value replaced with [REDACTED]');
    assert(telemetryData.sanitizedFields.username === '[REDACTED]', 'All form values replaced with [REDACTED]');

    console.log('\n====================================================');
    console.log('  🎉 All Smoke Tests Passed Successfully!');
    console.log('====================================================\n');
  } finally {
    await site.stop();
    await collector.stop();
  }
}

runSmokeTests().catch((err) => {
  console.error('\nSmoke test failed:', err);
  process.exit(1);
});
