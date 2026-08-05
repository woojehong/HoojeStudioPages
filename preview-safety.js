(function (global) {
  'use strict';

  const PREVIEW_HOST = 'woojehong.github.io';
  const PREVIEW_PATH = /^\/HoojeStudioPages(?:\/|$)/i;
  const BLOCKED_FUNCTION_PATHS = new Set([
    '/notify',
    '/.netlify/functions/notify',
    '/.netlify/functions/cf-downloads'
  ]);
  const BLOCKED_FUNCTION_HOSTS = new Set([
    'notifyorder-znq5mv362a-du.a.run.app'
  ]);

  function isReadOnlyLocation(locationLike) {
    if (!locationLike) return false;
    const hostname = String(locationLike.hostname || '').toLowerCase();
    const pathname = String(locationLike.pathname || '/');
    return hostname === PREVIEW_HOST && PREVIEW_PATH.test(pathname);
  }

  function requestUrl(input) {
    if (typeof input === 'string') return input;
    if (input && typeof input.url === 'string') return input.url;
    return String(input || '');
  }

  function isBlockedRequest(input, init, locationLike) {
    if (!isReadOnlyLocation(locationLike)) return false;

    let url;
    try {
      const base = locationLike && locationLike.href
        ? locationLike.href
        : 'https://woojehong.github.io/HoojeStudioPages/';
      url = new URL(requestUrl(input), base);
    } catch (_) {
      return false;
    }

    const pathname = url.pathname.replace(/^\/HoojeStudioPages(?=\/|$)/i, '') || '/';
    if (BLOCKED_FUNCTION_PATHS.has(pathname)) return true;
    if (BLOCKED_FUNCTION_HOSTS.has(url.hostname.toLowerCase())) return true;
    if (url.hostname === 'api.telegram.org' && /^\/bot/i.test(url.pathname)) return true;

    const method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    const isFirebase = /(?:^|\.)firebaseio\.com$/i.test(url.hostname)
      || /(?:^|\.)firebasedatabase\.app$/i.test(url.hostname);
    return isFirebase && !['GET', 'HEAD', 'OPTIONS'].includes(method);
  }

  const isReadOnly = isReadOnlyLocation(global.location);
  let lastNoticeAt = 0;

  function installNoIndex() {
    if (!isReadOnly || !global.document || !global.document.head) return;
    let meta = global.document.head.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = global.document.createElement('meta');
      meta.name = 'robots';
      global.document.head.appendChild(meta);
    }
    meta.content = 'noindex, nofollow, noarchive';
  }

  function mountBanner() {
    if (!isReadOnly || !global.document || !global.document.body) return;
    if (global.document.getElementById('hooje-preview-banner')) return;

    const banner = global.document.createElement('div');
    banner.id = 'hooje-preview-banner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.textContent = '시험환경 · 읽기 전용 — 주문·통계·관리자 변경 및 알림 전송이 차단됩니다.';
    Object.assign(banner.style, {
      position: 'fixed',
      left: '50%',
      top: '10px',
      transform: 'translateX(-50%)',
      zIndex: '2147483647',
      maxWidth: 'calc(100vw - 24px)',
      padding: '9px 16px',
      border: '1px solid rgba(251, 191, 36, .78)',
      borderRadius: '999px',
      background: 'rgba(69, 26, 3, .96)',
      color: '#fef3c7',
      boxShadow: '0 8px 28px rgba(0, 0, 0, .45)',
      fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: '12px',
      fontWeight: '800',
      lineHeight: '1.45',
      letterSpacing: '-.01em',
      textAlign: 'center',
      pointerEvents: 'none'
    });
    global.document.body.appendChild(banner);
  }

  function notifyBlocked(action) {
    mountBanner();
    const now = Date.now();
    if (now - lastNoticeAt < 800) return;
    lastNoticeAt = now;

    const banner = global.document && global.document.getElementById('hooje-preview-banner');
    if (banner && typeof banner.animate === 'function') {
      banner.animate(
        [{ transform: 'translateX(-50%) scale(1)' }, { transform: 'translateX(-50%) scale(1.05)' }, { transform: 'translateX(-50%) scale(1)' }],
        { duration: 420, easing: 'ease-out' }
      );
    }
    if (global.console && typeof global.console.warn === 'function') {
      global.console.warn('[시험환경] 차단된 작업:', action);
    }
  }

  function allowWrite(action) {
    if (!isReadOnly) return true;
    notifyBlocked(action || '쓰기');
    return false;
  }

  function runWrite(action, writer) {
    if (!allowWrite(action)) {
      const error = new Error('시험환경에서는 운영 데이터 변경이 차단됩니다.');
      error.name = 'PreviewWriteBlockedError';
      return Promise.reject(error);
    }
    return writer();
  }

  installNoIndex();
  if (isReadOnly && global.document) {
    global.document.documentElement.setAttribute('data-hooje-preview', 'readonly');
    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', mountBanner, { once: true });
    } else {
      mountBanner();
    }
  }

  const nativeFetch = typeof global.fetch === 'function' ? global.fetch.bind(global) : null;
  if (isReadOnly && nativeFetch) {
    global.fetch = function guardedPreviewFetch(input, init) {
      if (isBlockedRequest(input, init, global.location)) {
        notifyBlocked('알림 또는 운영 데이터 요청');
        const error = new Error('시험환경에서는 알림 및 운영 데이터 쓰기 요청이 차단됩니다.');
        error.name = 'PreviewNetworkWriteBlockedError';
        return Promise.reject(error);
      }
      return nativeFetch(input, init);
    };
  }

  global.HoojePreviewGuard = Object.freeze({
    isReadOnly,
    isReadOnlyLocation,
    isBlockedRequest,
    allowWrite,
    runWrite
  });
})(window);
