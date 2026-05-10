(function () {
  var KEY = 'lissy-theme';
  var META_ID = 'theme-color-meta';
  var COLORS = { dark: '#0d0221', light: '#faf5ff' };

  function apply(theme) {
    if (theme !== 'light' && theme !== 'dark') theme = 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch (e) {}
    var meta = document.getElementById(META_ID);
    if (meta) meta.setAttribute('content', COLORS[theme] || COLORS.dark);
    document.querySelectorAll('[data-theme-pick]').forEach(function (btn) {
      var pick = btn.getAttribute('data-theme-pick');
      var active = pick === theme;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    var cur = saved === 'light' ? 'light' : 'dark';
    apply(cur);
    document.querySelectorAll('[data-theme-pick]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        apply(btn.getAttribute('data-theme-pick'));
      });
    });
  });
})();
