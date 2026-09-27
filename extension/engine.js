const SUSPICIOUS_TLDS = new Set([
	'zip', 'mov', 'top', 'click', 'gq', 'ml', 'tk', 'work', 'country', 'stream'
]);

const BRAND_NAMES = [
	'apple', 'amazon', 'bank', 'binance', 'facebook', 'google', 'instagram',
	'microsoft', 'netflix', 'paypal', 'steam', 'whatsapp'
];

const SOCIAL_ENGINEERING_TERMS = /verify your account|confirm your identity|account suspended|account locked|unusual activity|urgent action|required immediately|security alert|claim your prize|you have won/i;
const SUSPICIOUS_DATA_TERMS = /login|signin|sign-in|password|passcode|token|credential|payment|checkout|billing|credit.?card|cvv|cvc|social.?security|otp|verification/i;
const TRACKING_TERMS = /analytics|tracking|telemetry|beacon|pixel|advert|doubleclick|facebook\.com\/tr|google-analytics/i;

const HOMOGLYPH_MAP = {
	'0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's', '7': 't',
	'а': 'a', 'с': 'c', 'е': 'e', 'і': 'i', 'о': 'o', 'р': 'p', 'ѕ': 's',
	'х': 'x', 'у': 'y', 'ԁ': 'd', 'ɡ': 'g', 'һ': 'h', 'ј': 'j', 'ӏ': 'l'
};

function clamp(value, minimum = 0, maximum = 100) {
	return Math.max(minimum, Math.min(maximum, value));
}

function finding(category, severity, message, evidence) {
	return { category, severity, message, evidence: evidence || null };
}

function getHostname(url) {
	try {
		return new URL(url).hostname.toLowerCase();
	} catch {
		return '';
	}
}

function getBaseDomain(hostname) {
	const labels = hostname.split('.').filter(Boolean);
	return labels.length > 2 ? labels.slice(-2).join('.') : labels.join('.');
}

function analyzeUrl(url) {
	const findings = [];
	let parsed;

	try {
		parsed = new URL(url);
	} catch {
		return {
			score: 100,
			hostname: '',
			baseDomain: '',
			findings: [finding('url', 'high', 'The page URL is invalid or could not be parsed.', url)]
		};
	}

	const hostname = parsed.hostname.toLowerCase();
	const baseDomain = getBaseDomain(hostname);
	const labels = hostname.split('.').filter(Boolean);
	const tld = labels.at(-1) || '';
	const decodedHostname = decodeURIComponent(hostname);
	const normalizedHostname = [...decodedHostname].map((character) => HOMOGLYPH_MAP[character] || character).join('');
	let score = 0;

	if (parsed.protocol !== 'https:') {
		score += parsed.protocol === 'http:' ? 18 : 25;
		findings.push(finding('url', 'medium', 'The page does not use HTTPS.', parsed.protocol));
	}

	if (hostname.includes('xn--') || /[^\u0000-\u007f]/.test(decodedHostname)) {
		score += 35;
		findings.push(finding('homoglyph', 'high', 'The hostname uses IDN or non-ASCII characters that can imitate another domain.', hostname));
	}

	if (normalizedHostname !== hostname && BRAND_NAMES.some((brand) => normalizedHostname.includes(brand))) {
		score += 30;
		findings.push(finding('homoglyph', 'high', 'The hostname contains characters that normalize to a known brand name.', normalizedHostname));
	}

	if (hostname.split('.').length > 4) {
		score += 12;
		findings.push(finding('url', 'medium', 'The hostname has an unusually deep subdomain chain.', hostname));
	}

	if (SUSPICIOUS_TLDS.has(tld)) {
		score += 10;
		findings.push(finding('url', 'low', 'The top-level domain is frequently used in abuse reports.', `.${tld}`));
	}

	if (parsed.username || parsed.password) {
		score += 25;
		findings.push(finding('url', 'high', 'The URL contains embedded credentials, which can hide the real destination.', `${parsed.username}@${hostname}`));
	}

	const hostTokens = `${hostname}${parsed.pathname}`.toLowerCase();
	if (BRAND_NAMES.some((brand) => hostTokens.includes(brand) && !baseDomain.startsWith(brand))) {
		score += 15;
		findings.push(finding('url', 'medium', 'A brand-like term appears outside the apparent registrable domain.', hostTokens));
	}

	return { score: clamp(score), hostname, baseDomain, findings };
}

function analyzePageSnapshot(snapshot = {}) {
	const findings = [];
	let score = 0;
	const forms = snapshot.forms || [];
	const externalResources = snapshot.externalResources || [];
	const iframes = snapshot.iframes || [];
	const scripts = snapshot.scripts || [];
	const externalRequests = snapshot.externalRequests || [];

	if (forms.some((form) => form.requestsSensitiveData)) {
		score += 25;
		findings.push(finding('forms', 'high', 'A form requests sensitive information.', forms.filter((form) => form.requestsSensitiveData)));
	}
	if (forms.some((form) => form.crossOriginAction)) {
		score += 25;
		findings.push(finding('forms', 'high', 'A form submits data to another origin.', forms.filter((form) => form.crossOriginAction)));
	}
	const crossOriginResources = externalResources.filter((resource) => resource.crossOrigin);
	if (crossOriginResources.length > 0) {
		score += Math.min(18, crossOriginResources.length * 4);
		findings.push(finding('external-resources', 'medium', 'The page loads resources from another origin.', crossOriginResources));
	}
	const suspiciousResources = crossOriginResources.filter((resource) => SUSPICIOUS_DATA_TERMS.test(resource.url || '') || TRACKING_TERMS.test(resource.url || ''));
	if (suspiciousResources.length > 0) {
		score += Math.min(15, suspiciousResources.length * 5);
		findings.push(finding('external-resources', 'medium', 'The page loads external resources associated with data collection or sensitive actions.', suspiciousResources));
	}
	if (iframes.some((frame) => frame.hidden || frame.crossOrigin)) {
		score += 18;
		findings.push(finding('iframes', 'medium', 'The page contains a hidden or cross-origin iframe.', iframes.filter((frame) => frame.hidden || frame.crossOrigin)));
	}
	if (scripts.some((script) => script.obfuscated || script.usesDangerousEval)) {
		score += 22;
		findings.push(finding('javascript', 'high', 'A script uses obfuscation or dynamic code execution.', scripts.filter((script) => script.obfuscated || script.usesDangerousEval)));
	}
	if (snapshot.redirectCount > 0) {
		score += Math.min(20, snapshot.redirectCount * 8);
		findings.push(finding('redirects', 'medium', 'The page reached the current URL through redirects.', snapshot.redirectCount));
	}
	if (snapshot.thirdPartyCookieCount > 0) {
		score += Math.min(15, snapshot.thirdPartyCookieCount * 3);
		findings.push(finding('cookies', 'low', 'The page set third-party cookies.', snapshot.thirdPartyCookieCount));
	}
	const suspiciousRequests = externalRequests.filter((request) =>
		/xmlhttprequest|fetch|beacon|ping/.test(request.type || '') && SUSPICIOUS_DATA_TERMS.test(request.url || '')
	);
	if (suspiciousRequests.length > 0) {
		score += Math.min(25, suspiciousRequests.length * 10);
		findings.push(finding('external-requests', 'high', 'The page sent request data to a credential or payment-related endpoint.', suspiciousRequests));
	}
	const crossOriginPosts = externalRequests.filter((request) => request.crossOrigin && request.method === 'POST');
	if (crossOriginPosts.length > 0) {
		score += Math.min(20, crossOriginPosts.length * 8);
		findings.push(finding('external-requests', 'high', 'The page sent POST data to another origin.', crossOriginPosts));
	}
	const trackingRequests = externalRequests.filter((request) => request.crossOrigin && TRACKING_TERMS.test(request.url || ''));
	if (trackingRequests.length > 0) {
		score += Math.min(12, trackingRequests.length * 3);
		findings.push(finding('cookies', 'low', 'The page contacted a known tracking or telemetry endpoint.', trackingRequests));
	}
	const pageContent = snapshot.pageContent || {};
	const contentText = `${pageContent.title || ''} ${pageContent.text || ''}`;
	if (SOCIAL_ENGINEERING_TERMS.test(contentText)) {
		score += 18;
		findings.push(finding('page-content', 'high', 'The page contains urgent account, identity, or reward language commonly used in social engineering.', contentText.slice(0, 500)));
	}
	const contentBrands = (pageContent.brandNames || []).filter((brand) => BRAND_NAMES.includes(brand));
	if (contentBrands.length > 0 && !contentBrands.some((brand) => (snapshot.hostname || '').includes(brand))) {
		score += 15;
		findings.push(finding('page-content', 'high', 'The page uses recognizable brand language, but the hostname does not match that brand.', contentBrands));
	}
	const suspiciousCookies = (snapshot.cookieNames || []).filter((name) => /track|analytics|pixel|ad|session|token/i.test(name));
	if (suspiciousCookies.length > 0) {
		score += Math.min(10, suspiciousCookies.length * 2);
		findings.push(finding('cookies', 'low', 'The page exposes cookies associated with tracking or session data.', suspiciousCookies));
	}

	return { score: clamp(score), findings };
}

function analyzePage({ url, snapshot } = {}) {
	const urlAnalysis = analyzeUrl(url || '');
	const pageAnalysis = analyzePageSnapshot({ ...snapshot, hostname: urlAnalysis.hostname });
	const findings = [...urlAnalysis.findings, ...pageAnalysis.findings];
	const score = clamp(Math.round(urlAnalysis.score * 0.55 + pageAnalysis.score * 0.45));

	return {
		version: 1,
		analyzedAt: new Date().toISOString(),
		url: url || '',
		hostname: urlAnalysis.hostname,
		baseDomain: urlAnalysis.baseDomain,
		score,
		classification: score >= 70 ? 'high-risk' : score >= 35 ? 'suspicious' : 'low-risk',
		findings,
		signals: {
			url: urlAnalysis.score,
			page: pageAnalysis.score
		}
	};
}

const PhishingDetector = { analyzeUrl, analyzePageSnapshot, analyzePage };

if (typeof globalThis !== 'undefined') {
	globalThis.PhishingDetector = PhishingDetector;
}

if (typeof module !== 'undefined') {
	module.exports = PhishingDetector;
}
