const BRANDS = {
	paypal: ['paypal.com'], amazon: ['amazon.com'], apple: ['apple.com', 'icloud.com'],
	google: ['google.com', 'accounts.google.com'], microsoft: ['microsoft.com', 'live.com', 'outlook.com', 'office.com'],
	netflix: ['netflix.com'], facebook: ['facebook.com', 'fb.com', 'meta.com'], instagram: ['instagram.com'],
	linkedin: ['linkedin.com'], twitter: ['twitter.com', 'x.com'], chase: ['chase.com'],
	binance: ['binance.com'], coinbase: ['coinbase.com'], dhl: ['dhl.com'], fedex: ['fedex.com'],
	usps: ['usps.com'], steam: ['steampowered.com', 'steamcommunity.com'], discord: ['discord.com'],
	whatsapp: ['whatsapp.com'], dropbox: ['dropbox.com'], adobe: ['adobe.com'], zoom: ['zoom.us'],
	ebay: ['ebay.com'], spotify: ['spotify.com'], ledger: ['ledger.com'], metamask: ['metamask.io'],
	openai: ['openai.com', 'chatgpt.com'], github: ['github.com'], walmart: ['walmart.com'],
	booking: ['booking.com'], airbnb: ['airbnb.com'], uber: ['uber.com'], revolut: ['revolut.com']
};

const SUSPICIOUS_TLDS = new Set([
	'tk', 'ml', 'ga', 'cf', 'gq', 'top', 'buzz', 'cam', 'rest', 'quest', 'monster', 'icu',
	'click', 'country', 'stream', 'download', 'loan', 'racing', 'win', 'bid', 'date', 'review',
	'party', 'work', 'zip', 'mov', 'cfd', 'info', 'help', 'live', 'site', 'online', 'shop', 'sbs'
]);
const SHORTENERS = new Set(['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'cutt.ly', 'tiny.cc', 'rb.gy', 't.ly']);
const PATH_KEYWORDS = /login|signin|sign-in|verify|verification|secure|account|update|billing|confirm|suspend|unlock|wallet|recover|password|credential|authenticate|oauth|validate|reauth/i;
const URGENCY_PHRASES = /verify your account|account suspended|account has been suspended|unusual activity|suspicious activity|confirm your identity|immediately|within 24 hours|limited time|act now|urgent|final notice|last warning|will be closed|will be suspended|legal action|avoid suspension|restricted|unauthorized|locked your account|verify now|update your payment|payment declined|claim your prize|you have won|wire transfer|gift card|bitcoin|crypto|refund/i;
const DATA_TERMS = /login|signin|sign-in|password|passcode|token|credential|payment|checkout|billing|credit.?card|cvv|cvc|social.?security|otp|verification/i;
const TRACKING_TERMS = /analytics|tracking|telemetry|beacon|pixel|advert|doubleclick|facebook\.com\/tr|google-analytics/i;
const CONFUSABLES = { '0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's', '6': 'g', '7': 't', '8': 'b', '9': 'g', '@': 'a', '$': 's', '!': 'i', '|': 'l', 'а': 'a', 'с': 'c', 'е': 'e', 'і': 'i', 'о': 'o', 'р': 'p', 'ѕ': 's', 'х': 'x', 'у': 'y', 'ј': 'j', 'һ': 'h', 'ӏ': 'l' };
const IP_HOST = /^(\d{1,3}\.){3}\d{1,3}$|^\[?[0-9a-f:]+\]?$/i;

function clamp(value, minimum = 0, maximum = 100) {
	return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

function signal(id, weight, severity, message, evidence) {
	return { id, weight, severity, message, evidence: evidence || null };
}

function deobfuscate(value) {
	return [...value.toLowerCase()].map((character) => CONFUSABLES[character] || character).join('');
}

function levenshtein(left, right) {
	const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
	for (let row = 1; row <= left.length; row += 1) {
		let diagonal = previous[0];
		previous[0] = row;
		for (let column = 1; column <= right.length; column += 1) {
			const above = previous[column];
			previous[column] = Math.min(previous[column] + 1, previous[column - 1] + 1, diagonal + (left[row - 1] === right[column - 1] ? 0 : 1));
			diagonal = above;
		}
	}
	return previous[right.length];
}

function registrable(hostname) {
	const labels = hostname.split('.').filter(Boolean);
	if (labels.length < 2) return hostname;
	const suffix = labels.at(-2);
	return suffix.length <= 3 && ['co', 'com', 'net', 'org', 'gov', 'ac'].includes(suffix)
		? labels.slice(-3).join('.') : labels.slice(-2).join('.');
}

function officialBrand(hostname) {
	return Object.values(BRANDS).flat().some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

function analyzeUrl(rawUrl) {
	const input = String(rawUrl || '').trim();
	const signals = [];
	let url;
	try { url = new URL(input); } catch {
		return { score: 100, hostname: '', baseDomain: '', signals: [signal('invalid-url', 100, 'high', 'The page URL is invalid or could not be parsed.', input)] };
	}
	if (['data:', 'javascript:', 'vbscript:', 'file:'].includes(url.protocol)) {
		signals.push(signal('dangerous-scheme', 55, 'high', `Dangerous URL scheme: ${url.protocol}`, 'This scheme can execute or embed content directly instead of using a normal website.'));
		return { ...finalize(signals), hostname: url.hostname, baseDomain: registrable(url.hostname) };
	}

	const hostname = url.hostname.toLowerCase();
	const baseDomain = registrable(hostname);
	const sld = baseDomain.split('.')[0] || hostname;
	const path = `${url.pathname}${url.search}`.toLowerCase();
	const tld = hostname.split('.').at(-1) || '';
	const normalized = deobfuscate(sld.replace(/-/g, ''));
	if (url.protocol === 'http:') signals.push(signal('http', 12, 'medium', 'The page uses unencrypted HTTP.', url.protocol));
	if (IP_HOST.test(hostname)) signals.push(signal('ip-host', 35, 'high', 'The page uses a raw IP address as its hostname.', hostname));
	if (url.username || url.password) signals.push(signal('embedded-credentials', 50, 'high', 'Credentials are embedded in the URL.', `${url.username}@${hostname}`));
	if (hostname.includes('xn--') || /[^\u0000-\u007f]/.test(hostname)) signals.push(signal('punycode', 40, 'high', 'The hostname uses IDN or non-ASCII characters.', hostname));
	if (SUSPICIOUS_TLDS.has(tld)) signals.push(signal('suspicious-tld', 18, 'medium', `The top-level domain .${tld} is frequently abused.`, `.${tld}`));
	if (SHORTENERS.has(baseDomain)) signals.push(signal('url-shortener', 15, 'medium', 'The URL uses a link-shortening service.', baseDomain));
	const subdomainCount = Math.max(0, hostname.split('.').length - baseDomain.split('.').length);
	if (subdomainCount >= 3) signals.push(signal('nested-subdomains', 15, 'medium', 'The hostname contains deeply nested subdomains.', hostname));
	if ((sld.match(/-/g) || []).length >= 2) signals.push(signal('domain-hyphens', 10, 'low', 'The hostname contains multiple separator-heavy labels.', sld));
	if (input.length > 100) signals.push(signal('long-url', 8, 'low', 'The URL is unusually long.', input.length));
	if (url.port && !['80', '443'].includes(url.port)) signals.push(signal('odd-port', 15, 'medium', `The page uses a non-standard port :${url.port}.`, url.port));
	if (PATH_KEYWORDS.test(path) && !officialBrand(hostname)) signals.push(signal('credential-path', 20, 'medium', 'The URL contains credential or account-verification bait.', path));
	if (/\.(exe|msi|apk|scr|bat|cmd|ps1|jar|vbs|iso|dmg|pkg|hta)(?:$|[?#])/i.test(url.pathname)) signals.push(signal('executable-download', 40, 'high', 'The URL points directly to an executable download.', url.pathname));
	if (/\/[A-Za-z0-9+_=-]{24,}/.test(path)) signals.push(signal('encoded-path', 18, 'medium', 'The URL contains an opaque encoded payload.', path.slice(0, 120)));

	if (!officialBrand(hostname)) {
		for (const [brand, domains] of Object.entries(BRANDS)) {
			if (normalized !== brand && normalized.length >= brand.length - 1 && levenshtein(normalized, brand) <= (brand.length <= 6 ? 1 : 2)) {
				signals.push(signal('typosquat', 45, 'high', `The hostname resembles ${brand}.`, `${hostname} differs from ${domains[0]}.`));
				break;
			}
			if (hostname.split('.').some((label) => deobfuscate(label.replace(/-/g, '')).includes(brand)) && !baseDomain.startsWith(brand)) {
				signals.push(signal('brand-in-host', 35, 'high', `The brand name ${brand} appears on an unrelated domain.`, baseDomain));
				break;
			}
		}
		const pathBrand = Object.keys(BRANDS).find((brand) => path.includes(brand));
		if (pathBrand) signals.push(signal('brand-in-path', 20, 'medium', `The URL uses ${pathBrand} in the path on an unrelated domain.`, path));
	} else {
		signals.push(signal('official-domain', -15, 'good', 'The hostname belongs to a recognized official brand domain.', hostname));
	}
	return { ...finalize(signals), hostname, baseDomain };
}

function analyzePageSnapshot(snapshot = {}) {
	const signals = [];
	const forms = snapshot.forms || [];
	const resources = snapshot.externalResources || [];
	const iframes = snapshot.iframes || [];
	const scripts = snapshot.scripts || [];
	const requests = snapshot.externalRequests || [];
	const pageText = `${snapshot.pageContent?.title || ''} ${snapshot.pageContent?.text || ''}`;
	const pageHost = snapshot.hostname || '';

	const sensitiveForms = forms.filter((form) => form.requestsSensitiveData);
	if (sensitiveForms.length) signals.push(signal('sensitive-form', 25, 'high', 'The page asks for sensitive information.', sensitiveForms));
	for (const form of sensitiveForms) {
		try {
			const action = new URL(form.action || snapshot.url, snapshot.url);
			if (action.protocol === 'http:') signals.push(signal('form-http', 45, 'high', 'Sensitive data is submitted over plaintext HTTP.', form.action));
			else if (action.origin !== new URL(snapshot.url).origin) signals.push(signal('form-cross-origin', 45, 'high', 'A sensitive form submits data to another origin.', form.action));
		} catch {}
	}
	const crossOriginResources = resources.filter((resource) => resource.crossOrigin);
	if (crossOriginResources.length) signals.push(signal('external-resources', Math.min(18, crossOriginResources.length * 4), 'medium', 'The page loads resources from other origins.', crossOriginResources));
	const suspiciousResources = crossOriginResources.filter((resource) => DATA_TERMS.test(resource.url || '') || TRACKING_TERMS.test(resource.url || ''));
	if (suspiciousResources.length) signals.push(signal('suspicious-resources', Math.min(20, suspiciousResources.length * 5), 'medium', 'External resources are associated with data collection or sensitive actions.', suspiciousResources));
	const hiddenFrames = iframes.filter((frame) => frame.hidden || frame.crossOrigin);
	if (hiddenFrames.length) signals.push(signal('hidden-iframe', 20, 'medium', 'The page contains hidden or cross-origin iframe content.', hiddenFrames));
	const suspiciousScripts = scripts.filter((script) => script.obfuscated || script.usesDangerousEval);
	if (suspiciousScripts.length) signals.push(signal('obfuscated-script', 35, 'high', 'A script is obfuscated or uses dynamic code execution.', suspiciousScripts));
	if (snapshot.redirectCount > 0) signals.push(signal('redirects', Math.min(25, snapshot.redirectCount * 8), 'medium', 'The page reached its destination through redirects.', snapshot.redirectCount));
	const suspiciousRequests = requests.filter((request) => /xmlhttprequest|fetch|beacon|ping/.test(request.type || '') && DATA_TERMS.test(request.url || ''));
	if (suspiciousRequests.length) signals.push(signal('sensitive-transmission', Math.min(30, suspiciousRequests.length * 10), 'high', 'The page sent data to a credential or payment-related endpoint.', suspiciousRequests));
	const crossOriginPosts = requests.filter((request) => request.crossOrigin && request.method === 'POST');
	if (crossOriginPosts.length) signals.push(signal('cross-origin-post', Math.min(25, crossOriginPosts.length * 8), 'high', 'The page sent POST data to another origin.', crossOriginPosts));
	const trackingRequests = requests.filter((request) => request.crossOrigin && TRACKING_TERMS.test(request.url || ''));
	if (trackingRequests.length) signals.push(signal('tracking-request', Math.min(12, trackingRequests.length * 3), 'low', 'The page contacted a tracking or telemetry endpoint.', trackingRequests));
	const urgencyHits = pageText.match(URGENCY_PHRASES) || [];
	if (urgencyHits.length) signals.push(signal('social-engineering', Math.min(30, 8 + urgencyHits.length * 5), 'medium', 'The page uses urgency, fear, or reward language common in social engineering.', urgencyHits));
	const contentBrands = (snapshot.pageContent?.brandNames || []).filter((brand) => Object.prototype.hasOwnProperty.call(BRANDS, brand));
	if (contentBrands.length && !contentBrands.some((brand) => pageHost.includes(brand))) signals.push(signal('fake-brand-content', 30, 'high', 'The page uses recognizable brand language on an unrelated hostname.', contentBrands));
	const cookieNames = (snapshot.cookieNames || []).filter((name) => /track|analytics|pixel|ad|session|token/i.test(name));
	if (cookieNames.length || snapshot.thirdPartyCookieCount > 0) signals.push(signal('tracking-cookies', Math.min(15, cookieNames.length * 2 + (snapshot.thirdPartyCookieCount || 0) * 3), 'low', 'The page exposes tracking or third-party cookies.', cookieNames));
	return { score: finalize(signals).score, signals };
}

function finalize(signals) {
	return { score: clamp(signals.reduce((total, item) => total + item.weight, 0)), signals: signals.sort((left, right) => right.weight - left.weight) };
}

function toFinding(item, category) {
	return { category, severity: item.severity, message: item.message, evidence: item.evidence };
}

function analyzePage({ url, snapshot = {} } = {}) {
	const urlAnalysis = analyzeUrl(url || '');
	const pageAnalysis = analyzePageSnapshot({ ...snapshot, url, hostname: urlAnalysis.hostname });
	const urlSignals = urlAnalysis.signals.filter((item) => item.weight > 0);
	const pageSignals = pageAnalysis.signals.filter((item) => item.weight > 0);
	const score = clamp(urlAnalysis.score * 0.55 + pageAnalysis.score * 0.45);
	return {
		version: 2,
		analyzedAt: new Date().toISOString(),
		url: url || '',
		hostname: urlAnalysis.hostname,
		baseDomain: urlAnalysis.baseDomain,
		score,
		classification: score >= 70 ? 'high-risk' : score >= 35 ? 'suspicious' : 'low-risk',
		findings: [...urlSignals.map((item) => toFinding(item, 'url')), ...pageSignals.map((item) => toFinding(item, item.id.includes('form') ? 'forms' : item.id.includes('script') ? 'javascript' : item.id.includes('iframe') ? 'iframes' : item.id.includes('resource') ? 'external-resources' : item.id.includes('cookie') || item.id.includes('tracking') ? 'cookies' : item.id.includes('redirect') ? 'redirects' : item.id.includes('transmission') || item.id.includes('post') ? 'external-requests' : 'page-content'))],
		signals: { url: urlAnalysis.score, page: pageAnalysis.score }
	};
}

const PhishingDetector = { analyzeUrl, analyzePageSnapshot, analyzePage, BRANDS, levenshtein, deobfuscate };
if (typeof globalThis !== 'undefined') globalThis.PhishingDetector = PhishingDetector;
if (typeof module !== 'undefined') module.exports = PhishingDetector;