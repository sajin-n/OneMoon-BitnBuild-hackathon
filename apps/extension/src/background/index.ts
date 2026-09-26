/**
 * OneMoon - Chrome Extension Service Worker (Background)
 * Confirms that the extension is installed, active, and running.
 */

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[OneMoon] Extension installed / initialized:', details.reason);
});

// Basic message listener placeholder for internal extension communication
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'PONG', service: 'onemoon-extension' });
  }
  return true;
});
