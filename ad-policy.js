/* A local layout sample only. No advertising requests are made by this file. */
(function () {
  'use strict';
  const url = new URL(window.location.href);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.searchParams.get('adPreview') !== '1') return;
  document.querySelectorAll('[data-hooje-ad-preview]').forEach(function (slot) {
    slot.hidden = false;
    slot.textContent = (slot.textContent || '광고 위치 미리보기') + ' — 실제 광고 아님';
  });
})();
