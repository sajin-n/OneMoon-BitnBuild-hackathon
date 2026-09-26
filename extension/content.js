function isSensitiveField(field) {
  const text = `${field.type} ${field.name} ${field.id} ${field.autocomplete} ${field.placeholder}`.toLowerCase();
  return /password|passcode|credit|card|cvv|cvc|ssn|social|otp|one.?time|security.?code|account/.test(text);
}

function getOrigin(url) {
  try {
    return new URL(url, location.href).origin;
  } catch {
    return '';
  }
}

function collectPageSnapshot() {
  const pageOrigin = location.origin;
  const forms = [...document.forms].map((form) => ({
    action: form.action || location.href,
    method: (form.method || 'get').toUpperCase(),
    crossOriginAction: getOrigin(form.action || location.href) !== pageOrigin,
    requestsSensitiveData: [...form.elements].some(isSensitiveField)
  }));

  const externalResources = [...document.querySelectorAll('script[src], img[src], link[href], iframe[src]')]
    .map((element) => ({
      type: element.tagName.toLowerCase() === 'link' ? 'style' : element.tagName.toLowerCase(),
      url: element.src || element.href,
      crossOrigin: getOrigin(element.src || element.href) !== pageOrigin
    }))
    .filter((resource) => resource.url);

  const iframes = [...document.querySelectorAll('iframe')].map((frame) => ({
    url: frame.src,
    hidden: frame.hidden || frame.clientWidth === 0 || frame.clientHeight === 0 || getComputedStyle(frame).display === 'none',
    crossOrigin: getOrigin(frame.src) !== pageOrigin
  }));

  const scripts = [...document.scripts].map((script) => {
    const source = script.textContent || '';
    return {
      url: script.src || null,
      inline: !script.src,
      obfuscated: /\\x[0-9a-f]{2}|\\u[0-9a-f]{4}|String\.fromCharCode|atob\(|eval\(|document\.write\(/i.test(source),
      usesDangerousEval: /(^|[^\w])(?:eval|Function)\s*\(/.test(source)
    };
  });

  return {
    forms,
    externalResources,
    iframes,
    scripts,
    title: document.title,
    hasPasswordField: Boolean(document.querySelector('input[type="password"]'))
  };
}

function sendPageSnapshot() {
  chrome.runtime.sendMessage({
    type: 'PAGE_SNAPSHOT',
    snapshot: collectPageSnapshot()
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'REQUEST_ANALYSIS') return;
  const snapshot = collectPageSnapshot();
  chrome.runtime.sendMessage({ type: 'PAGE_SNAPSHOT', snapshot }, sendResponse);
  return true;
});

sendPageSnapshot();
