/**
 * Block Chicken — i18n Engine v1.0
 * Lightweight internationalisation: loads external JSON locales,
 * supports nested-key lookups, list rendering, attribute binding,
 * placeholder injection, browser-language detection, and localStorage persistence.
 */
(function (window, document) {
  'use strict';

  const STORAGE_KEY = 'blockchicken-lang';
  const LOCALE_PATH = 'i18n/';
  const SUPPORTED = ['en', 'zh'];

  // ── State ──────────────────────────────────────────────────────────
  let _locales  = {};          // { en: {...}, zh: {...} } – all loaded
  let _current  = 'en';        // active locale code
  let _pending  = null;        // Promise for ongoing load

  // ── Helpers ────────────────────────────────────────────────────────
  function resolve(obj, path) {
    return path.split('.').reduce(function (o, k) {
      return (o && o[k] !== undefined) ? o[k] : undefined;
    }, obj);
  }

  /** Best guess at the user's language from navigator + stored pref. */
  function detectLanguage() {
    // 1) stored
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (_) {}
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;

    // 2) navigator
    var nav = (navigator.language || navigator.userLanguage || '').split('-')[0];
    if (SUPPORTED.indexOf(nav) !== -1) return nav;

    // 3) default
    return 'en';
  }

  // ── Loader ─────────────────────────────────────────────────────────
  function loadLocale(code) {
    if (_locales[code]) return Promise.resolve(_locales[code]);

    return fetch(LOCALE_PATH + code + '.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + code);
        return r.json();
      })
      .then(function (data) {
        _locales[code] = data;
        return data;
      });
  }

  /** Preload all supported locales (non-blocking). */
  function preloadAll() {
    return Promise.all(SUPPORTED.map(loadLocale)).then(function () {
      return applyLanguage(_current);
    });
  }

  // ── Apply ──────────────────────────────────────────────────────────
  function applyLanguage(code) {
    _current = code;
    var t = _locales[code];
    if (!t) return;

    // document metadata
    document.documentElement.lang = code === 'zh' ? 'zh-HK' : 'en';
    document.documentElement.dir  = t.dir || 'ltr';

    // title
    var titleMap = {
      en: '🐔 Block Chicken — Blockchain Poultry Traceability | 區塊雞',
      zh: '🐔 區塊雞 — 區塊鏈雞隻溯源追蹤平台 | Block Chicken Traceability'
    };
    document.title = titleMap[code] || titleMap.en;

    // data-i18n  (innerHTML)
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var key = el.getAttribute('data-i18n');
      var val = resolve(t, key);
      if (val !== undefined) el.innerHTML = val;
    }

    // data-i18n-list  (render array → <li> items)
    var listEls = document.querySelectorAll('[data-i18n-list]');
    for (var j = 0; j < listEls.length; j++) {
      var lel = listEls[j];
      var lkey = lel.getAttribute('data-i18n-list');
      var items = resolve(t, lkey);
      if (Array.isArray(items)) {
        lel.innerHTML = items.map(function (item) {
          return '<li>' + item + '</li>';
        }).join('');
      }
    }

    // data-i18n-placeholder
    var phEls = document.querySelectorAll('[data-i18n-placeholder]');
    for (var k = 0; k < phEls.length; k++) {
      var pel = phEls[k];
      var pkey = pel.getAttribute('data-i18n-placeholder');
      var pval = resolve(t, pkey);
      if (typeof pval === 'string') pel.placeholder = pval;
    }

    // data-i18n-attr  (e.g. data-i18n-attr="title|nav.home")
    var attrEls = document.querySelectorAll('[data-i18n-attr]');
    for (var m = 0; m < attrEls.length; m++) {
      var ael = attrEls[m];
      var spec = ael.getAttribute('data-i18n-attr'); // "title|nav.home"
      var parts = spec.split('|');
      if (parts.length >= 2) {
        var attrName = parts[0].trim();
        var attrPath = parts.slice(1).join('|').trim();
        var aval = resolve(t, attrPath);
        if (typeof aval === 'string') ael.setAttribute(attrName, aval);
      }
    }

    // language switcher buttons
    var btns = document.querySelectorAll('.lang-switch button');
    for (var n = 0; n < btns.length; n++) {
      var btn = btns[n];
      var btnLang = btn.getAttribute('data-lang');
      if (btnLang === code) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  }

  // ── Public API ─────────────────────────────────────────────────────
  function setLanguage(code) {
    if (SUPPORTED.indexOf(code) === -1) code = 'en';

    // persist
    try { localStorage.setItem(STORAGE_KEY, code); } catch (_) {}

    var loadP = loadLocale(code).then(function () {
      applyLanguage(code);
    });

    // If switching to English, also preload Chinese in background
    if (code !== 'en') loadLocale('en');
    if (code !== 'zh') loadLocale('zh');

    return loadP;
  }

  function getLanguage() {
    return _current;
  }

  function t(key) {
    var val = resolve(_locales[_current], key);
    return val !== undefined ? val : key;
  }

  // ── Bootstrap ──────────────────────────────────────────────────────
  var detected = detectLanguage();
  _current = detected;

  // Show nothing until loaded (prevent FOUC — flash of untranslated content)
  document.documentElement.style.visibility = 'hidden';

  _pending = preloadAll().then(function () {
    document.documentElement.style.visibility = '';
  }).catch(function (err) {
    console.error('[i18n] Bootstrap failed:', err);
    // fallback: try to show whatever we have
    document.documentElement.style.visibility = '';
    applyLanguage(_current);
  });

  // ── Expose ─────────────────────────────────────────────────────────
  window.__i18n = {
    setLanguage: setLanguage,
    getLanguage: getLanguage,
    t: t,
    get pending() { return _pending; },
    get supported() { return SUPPORTED.slice(); },
    get current() { return _current; }
  };

  // Also expose setLang for existing code compatibility
  window.setLang = setLanguage;

})(window, document);
