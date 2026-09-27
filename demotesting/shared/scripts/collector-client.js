/**
 * OneMoon Phishing Simulation Environment - Client Helper Library
 *
 * Provides helper functions for simulation pages to trigger cross-origin
 * network behaviors that the OneMoon browser extension can monitor:
 *  - Cross-origin fetch / POST telemetry
 *  - 1x1 Tracking pixel beacon
 *  - Cross-origin external script loading
 *  - Cross-origin external stylesheet loading
 *  - Cross-origin iframe embedding
 *  - Session check validation
 *  - Open redirect navigation
 *
 * All requests target the local collector server on *.test or localhost.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OneMoonCollectorClient = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Determine collector URL based on current host
  const isTestDomain = window.location.hostname.endsWith('.test');
  const collectorHost = isTestDomain ? 'collector.test' : 'localhost';
  const collectorPort = '4174';
  const DEFAULT_COLLECTOR_ORIGIN = `http://${collectorHost}:${collectorPort}`;

  class CollectorClient {
    constructor(collectorOrigin = DEFAULT_COLLECTOR_ORIGIN) {
      this.collectorOrigin = collectorOrigin;
    }

    /**
     * Send simulated telemetry / form exfiltration event via cross-origin fetch.
     * Note: Server strictly redacts all values.
     */
    async sendTelemetry(eventType = 'test_telemetry', payload = {}) {
      const url = `${this.collectorOrigin}/telemetry?event=${encodeURIComponent(eventType)}`;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            site: window.location.origin,
            eventType,
            timestamp: new Date().toISOString(),
            ...payload,
          }),
        });
        const data = await response.json();
        console.log('[CollectorClient] Telemetry sent successfully:', data);
        return data;
      } catch (err) {
        console.warn('[CollectorClient] Failed to send telemetry to collector:', err);
        throw err;
      }
    }

    /**
     * Trigger a 1x1 tracking pixel / beacon request.
     */
    triggerPixel(params = {}) {
      const qs = new URLSearchParams(params).toString();
      const pixelUrl = `${this.collectorOrigin}/pixel${qs ? '?' + qs : ''}`;
      const img = new Image(1, 1);
      img.src = pixelUrl;
      img.style.display = 'none';
      document.body.appendChild(img);
      console.log('[CollectorClient] Triggered pixel request:', pixelUrl);
      return img;
    }

    /**
     * Dynamically loads the external script from collector server.
     */
    injectCrossoriginScript() {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${this.collectorOrigin}/resource.js`;
        script.async = true;
        script.onload = () => {
          console.log('[CollectorClient] Cross-origin script loaded successfully');
          resolve(script);
        };
        script.onerror = (err) => {
          console.warn('[CollectorClient] Failed to load cross-origin script:', err);
          reject(err);
        };
        document.head.appendChild(script);
      });
    }

    /**
     * Dynamically attaches the cross-origin stylesheet from collector server.
     */
    injectCrossoriginStylesheet() {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${this.collectorOrigin}/resource.css`;
      document.head.appendChild(link);
      console.log('[CollectorClient] Cross-origin stylesheet injected');
      return link;
    }

    /**
     * Dynamically creates and embeds the cross-origin iframe.
     */
    createCrossoriginIframe(containerSelector = 'body') {
      const iframe = document.createElement('iframe');
      iframe.src = `${this.collectorOrigin}/iframe`;
      iframe.width = '100%';
      iframe.height = '120';
      iframe.style.border = 'none';
      iframe.style.marginTop = '12px';

      const container = document.querySelector(containerSelector) || document.body;
      container.appendChild(iframe);
      console.log('[CollectorClient] Embedded cross-origin iframe');
      return iframe;
    }

    /**
     * Performs a session-check ping against the collector.
     */
    async checkSession() {
      const url = `${this.collectorOrigin}/session-check`;
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });
      return await response.json();
    }

    /**
     * Triggers simulated open redirect through collector.
     */
    triggerRedirect(target = 'login') {
      window.location.href = `${this.collectorOrigin}/redirect/${target}`;
    }
  }

  return new CollectorClient();
});
