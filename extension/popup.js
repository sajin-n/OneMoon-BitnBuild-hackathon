const loading = document.querySelector('#loading');
const error = document.querySelector('#error');
const report = document.querySelector('#report');
const refresh = document.querySelector('#refresh');

function showError(message) {
  loading.hidden = true;
  report.hidden = true;
  error.hidden = false;
  error.textContent = message;
}

function renderReport(result) {
  if (!result || result.error) {
    showError(result?.error || 'No analysis is available for this page.');
    return;
  }

  loading.hidden = true;
  error.hidden = true;
  report.hidden = false;
  document.querySelector('#score').textContent = result.score;
  document.querySelector('#classification').textContent = result.classification.replace('-', ' ');
  document.querySelector('#hostname').textContent = result.hostname || 'Unknown host';
  document.querySelector('#url-signal').textContent = result.signals.url;
  document.querySelector('#page-signal').textContent = result.signals.page;
  document.querySelector('#finding-count').textContent = result.findings.length;
  document.querySelector('#timestamp').textContent = `Analyzed ${new Date(result.analyzedAt).toLocaleTimeString()}`;

  const ring = document.querySelector('#score-ring');
  ring.className = `score-ring ${result.classification}`;
  const findings = document.querySelector('#findings');
  findings.replaceChildren();
  if (result.findings.length === 0) {
    const item = document.createElement('li');
    item.className = 'finding low';
    item.innerHTML = '<strong>No warnings</strong><p>No suspicious signals were found on this page.</p>';
    findings.append(item);
    return;
  }

  result.findings.forEach((item) => {
    const element = document.createElement('li');
    element.className = `finding ${item.severity}`;
    const title = document.createElement('strong');
    title.textContent = `${item.severity} · ${item.category}`;
    const message = document.createElement('p');
    message.textContent = item.message;
    element.append(title, message);
    findings.append(element);
  });
}

function analyzeCurrentTab() {
  loading.hidden = false;
  error.hidden = true;
  report.hidden = true;
  refresh.disabled = true;
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id == null) {
      showError('No active tab was found.');
      refresh.disabled = false;
      return;
    }
    chrome.runtime.sendMessage({ type: 'REQUEST_ANALYSIS', tabId: tab.id }, (result) => {
      refresh.disabled = false;
      if (chrome.runtime.lastError) {
        showError('This page cannot be analyzed. Try a normal website tab.');
        return;
      }
      renderReport(result);
    });
  });
}

refresh.addEventListener('click', analyzeCurrentTab);
analyzeCurrentTab();
