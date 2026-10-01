(function (global) {
  'use strict';
  function itemKey(category, key) { return category + '/' + key; }
  function createRouter(options) {
    let restoring = false;
    function navigate(key) {
      if (restoring) return;
      const url = new URL(options.location.href);
      if (key) url.searchParams.set('item', key);
      else url.searchParams.delete('item');
      if (url.href !== options.location.href) options.history.pushState({}, '', url);
    }
    function restore() {
      const key = new URL(options.location.href).searchParams.get('item');
      restoring = true;
      try {
        const item = key && options.getItems().find(item => item.routeKey === key);
        if (item && item.active) options.showItem(item);
        else options.showHome();
        if (options.onMissing) options.onMissing(Boolean(key && (!item || !item.active)));
      } finally { restoring = false; }
    }
    return { navigate, restore };
  }
  global.HoojeContentAccess = Object.freeze({ itemKey, createRouter });
})(typeof window === 'undefined' ? globalThis : window);
