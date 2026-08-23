const ALLOWED_TAGS = new Set(['P','DIV','BR','STRONG','B','EM','I','U','S','H2','H3','BLOCKQUOTE','UL','OL','LI','HR','SPAN','A','IMG']);
const ALLOWED_COLORS = new Map([
  ['#f3f4f6','#f3f4f6'], ['rgb(243, 244, 246)','#f3f4f6'],
  ['#fecaca','#fecaca'], ['rgb(254, 202, 202)','#fecaca'],
  ['#fca5a5','#fca5a5'], ['rgb(252, 165, 165)','#fca5a5'],
  ['#fbbf24','#fbbf24'], ['rgb(251, 191, 36)','#fbbf24'],
  ['#c4b5fd','#c4b5fd'], ['rgb(196, 181, 253)','#c4b5fd'],
  ['#9ca3af','#9ca3af'], ['rgb(156, 163, 175)','#9ca3af']
]);
const ALLOWED_SIZES = new Set(['0.82rem','1rem','1.2rem','1.5rem']);
const ALLOWED_FONTS = new Set(['Pretendard, sans-serif','Georgia, serif']);
const STORAGE_HOSTS = new Set(['firebasestorage.googleapis.com','storage.googleapis.com']);

function safeUrl(value, image = false) {
  try {
    const url = new URL(String(value || ''), location.origin);
    if (url.protocol !== 'https:') return '';
    if (image && !STORAGE_HOSTS.has(url.hostname)) return '';
    return url.href;
  } catch (_) { return ''; }
}

function cleanStyle(source, target, tagName) {
  const align = source.style.textAlign;
  if (['left','center','right'].includes(align)) target.style.textAlign = align;
  const color = source.style.color;
  if (ALLOWED_COLORS.has(color.toLowerCase())) target.style.color = ALLOWED_COLORS.get(color.toLowerCase());
  const size = source.style.fontSize;
  if (ALLOWED_SIZES.has(size)) target.style.fontSize = size;
  const family = source.style.fontFamily;
  if (ALLOWED_FONTS.has(family)) target.style.fontFamily = family;
  if (tagName === 'IMG') {
    const width = Number.parseInt(source.style.width || source.getAttribute('width') || '100', 10);
    target.style.width = `${Math.min(100, Math.max(25, Number.isFinite(width) ? width : 100))}%`;
    target.style.maxWidth = '100%';
    target.style.height = 'auto';
    target.style.display = 'block';
    const float = source.style.float;
    if (float === 'left' || float === 'right') {
      target.style.float = float;
      target.style.margin = float === 'left' ? '0.75rem 1rem 0.75rem 0' : '0.75rem 0 0.75rem 1rem';
    } else {
      target.style.margin = '0.75rem auto';
    }
    target.style.borderRadius = '0.75rem';
  }
}

function cleanNode(source, doc) {
  if (source.nodeType === Node.TEXT_NODE) return doc.createTextNode(source.textContent || '');
  if (source.nodeType !== Node.ELEMENT_NODE || !ALLOWED_TAGS.has(source.tagName)) {
    const fragment = doc.createDocumentFragment();
    source.childNodes.forEach(child => fragment.appendChild(cleanNode(child, doc)));
    return fragment;
  }
  const target = doc.createElement(source.tagName.toLowerCase());
  cleanStyle(source, target, source.tagName);
  if (source.tagName === 'A') {
    const href = safeUrl(source.getAttribute('href'));
    if (href) { target.href = href; target.target = '_blank'; target.rel = 'noopener noreferrer'; }
  }
  if (source.tagName === 'IMG') {
    const src = safeUrl(source.getAttribute('src'), true);
    if (!src) return doc.createDocumentFragment();
    target.src = src;
    target.alt = String(source.getAttribute('alt') || '긴급 공지 이미지').slice(0, 120);
    target.loading = 'eager';
  } else {
    source.childNodes.forEach(child => target.appendChild(cleanNode(child, doc)));
  }
  return target;
}

export function sanitizeUrgentHTML(raw) {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(`<div>${String(raw || '')}</div>`, 'text/html');
  const output = document.createElement('div');
  parsed.body.firstElementChild?.childNodes.forEach(node => output.appendChild(cleanNode(node, document)));
  return output.innerHTML;
}

export function urgentPlainText(html) {
  const temp = document.createElement('div');
  temp.innerHTML = sanitizeUrgentHTML(html);
  return (temp.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 5000);
}

export function urgentImageUrls(html) {
  const temp = document.createElement('div');
  temp.innerHTML = sanitizeUrgentHTML(html);
  return [...temp.querySelectorAll('img')].map(img => img.src);
}
