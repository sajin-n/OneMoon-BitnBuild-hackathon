/**
 * OneMoon Phishing Simulation Environment - Combined Server Launcher
 *
 * Starts both:
 *  1. Site Server (default 4173): Hosts the 3 phishing simulation sites
 *  2. Collector Server (default 4174): Hosts cross-origin resources & telemetry endpoints
 *
 * Usage:
 *  node server/start.js [--site-port 4173] [--collector-port 4174] [--host 127.0.0.1]
 */

import { createSiteServer } from './site-server.js';
import { createCollectorServer } from './collector-server.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    sitePort: parseInt(process.env.SITE_PORT || '4173', 10),
    collectorPort: parseInt(process.env.COLLECTOR_PORT || '4174', 10),
    host: process.env.SITE_HOST || '127.0.0.1',
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--site-port' && args[i + 1]) {
      options.sitePort = parseInt(args[++i], 10);
    } else if (args[i] === '--collector-port' && args[i + 1]) {
      options.collectorPort = parseInt(args[++i], 10);
    } else if (args[i] === '--host' && args[i + 1]) {
      options.host = args[++i];
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();

  const site = createSiteServer({
    port: options.sitePort,
    collectorPort: options.collectorPort,
    host: options.host,
  });

  const collector = createCollectorServer({
    port: options.collectorPort,
    sitePort: options.sitePort,
    host: options.host,
  });

  try {
    await site.start();
    await collector.start();

    console.log('\n================================================================');
    console.log('       🛡️  OneMoon Phishing Simulation Environment Ready        ');
    console.log('================================================================');
    console.log(`[Site Server]      Listening on http://${site.host}:${site.port}`);
    console.log(`[Collector Server] Listening on http://${collector.host}:${collector.port}`);
    console.log('----------------------------------------------------------------');
    console.log('HOSTNAME-BASED URLs (requires /etc/hosts setup):');
    console.log(`  • Login Simulation:       http://login.test:${site.port}/`);
    console.log(`  • File Upload Simulation: http://file-upload.test:${site.port}/`);
    console.log(`  • Payment Simulation:     http://payment.test:${site.port}/`);
    console.log(`  • Collector Host:         http://collector.test:${collector.port}/`);
    console.log('----------------------------------------------------------------');
    console.log('PATH-BASED URLs (direct localhost access without /etc/hosts):');
    console.log(`  • Central Hub:            http://localhost:${site.port}/`);
    console.log(`  • Login Simulation:       http://localhost:${site.port}/login/`);
    console.log(`  • File Upload Simulation: http://localhost:${site.port}/file-upload/`);
    console.log(`  • Payment Simulation:     http://localhost:${site.port}/payment/`);
    console.log('----------------------------------------------------------------');
    console.log('SIMULATED CROSS-ORIGIN ENDPOINTS:');
    console.log(`  • Script:        http://collector.test:${collector.port}/resource.js`);
    console.log(`  • Stylesheet:    http://collector.test:${collector.port}/resource.css`);
    console.log(`  • Pixel/Beacon:  http://collector.test:${collector.port}/pixel`);
    console.log(`  • Iframe:        http://collector.test:${collector.port}/iframe`);
    console.log(`  • Session Ping:  http://collector.test:${collector.port}/session-check`);
    console.log(`  • Open Redirect: http://collector.test:${collector.port}/redirect/login`);
    console.log(`  • Telemetry:     POST http://collector.test:${collector.port}/telemetry`);
    console.log('----------------------------------------------------------------');
    console.log('🔒 DATA SAFETY ASSURANCE:');
    console.log('  All form submissions and credential harvesting simulations are');
    console.log('  strictly sanitized in-memory. All values are replaced with');
    console.log('  "[REDACTED]". No sensitive data is ever stored, logged, or sent');
    console.log('  to any external network.');
    console.log('================================================================\n');

    const shutdown = async () => {
      console.log('\n[OneMoon] Shutting down simulation servers gracefully...');
      await Promise.all([site.stop(), collector.stop()]);
      console.log('[OneMoon] All simulation servers stopped.');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('[OneMoon] Error starting simulation servers:', err);
    process.exit(1);
  }
}

main();
