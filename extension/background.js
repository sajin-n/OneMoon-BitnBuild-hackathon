importScripts('engine.js');

const requestsByTab = new Map();

function analyzeTabUrl(tabId, url) {
  const report = globalThis.PhishingDetector.analyzePage({
    url,
    snapshot: { externalRequests: requestsByTab.get(tabId) || [] }
  });
  chrome.storage.session.set({ [`tab:${tabId}`]: report });
  return report;
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0) return;
    const requests = requestsByTab.get(details.tabId) || [];
    requests.push({ type: details.type, url: details.url });
    requests[requests.length - 1].method = details.method || 'GET';
    requestsByTab.set(details.tabId, requests.slice(-100));
  },
  { urls: ['<all_urls>'] }
);

chrome.webRequest.onBeforeRedirect.addListener(
  (details) => {
    if (details.tabId < 0) return;
    const requests = requestsByTab.get(details.tabId) || [];
    requests.push({ type: 'redirect', url: details.redirectUrl, from: details.url });
    requestsByTab.set(details.tabId, requests.slice(-100));
  },
  { urls: ['<all_urls>'] }
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REQUEST_ANALYSIS' && message.tabId != null) {
    chrome.tabs.sendMessage(message.tabId, { type: 'REQUEST_ANALYSIS' }, (response) => {
      if (chrome.runtime.lastError) {
        chrome.tabs.get(message.tabId, (tab) => {
          if (chrome.runtime.lastError || !tab?.url) {
            sendResponse({ error: 'This page does not expose a readable URL.' });
            return;
          }
          sendResponse(analyzeTabUrl(message.tabId, tab.url));
        });
        return;
      }
      sendResponse(response || { error: 'No analysis was returned.' });
    });
    return true;
  }

  if (message.type !== 'PAGE_SNAPSHOT' || !sender.tab) return;

  const url = sender.tab.url || '';
  const requests = requestsByTab.get(sender.tab.id) || [];
  const pageOrigin = (() => {
    try { return new URL(url).origin; } catch { return ''; }
  })();
  const snapshot = {
    ...message.snapshot,
    externalRequests: requests.map((request) => ({
      ...request,
      crossOrigin: (() => {
        try { return new URL(request.url).origin !== pageOrigin; } catch { return false; }
      })()
    })),
    redirectCount: requests.filter((request) => request.type === 'redirect').length,
    externalRequestCount: requests.filter((request) => {
      try { return new URL(request.url).origin !== pageOrigin; } catch { return false; }
    }).length
  };
  const report = globalThis.PhishingDetector.analyzePage({ url, snapshot });

  chrome.storage.session.set({ [`tab:${sender.tab.id}`]: report });
  sendResponse(report);
  return true;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  requestsByTab.delete(tabId);
  chrome.storage.session.remove(`tab:${tabId}`);
});
