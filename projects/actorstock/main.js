/* ActorStock case study — interactions
   Everything degrades to a readable, fully visible page without JS. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  /* ?capture=1 renders the page as one static document for the Figma export:
     no scroll-reveal, no tabs, no sticky stage, and every image eager. */
  var CAPTURE = /[?&]capture\b/.test(window.location.search);
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------
     1. Design-system swatches — values read from the Figma variables
     --------------------------------------------------------------- */
  var TOKENS = [
    ['Primary/Default',   '#FF6468'], ['Primary/Light',    '#FFC0B6'],
    ['Primary/BG',        '#FFDFDC'], ['Primary/Light BG', '#FFF2F1'],
    ['Secondary/Default', '#07C1B6'], ['Secondary/Medium', '#069A92'],
    ['Secondary/Light',   '#88E5DC'], ['Secondary/BG',     '#DCEFEE'],
    ['BG/Darkest',        '#282E45'], ['BG/Default',       '#F1F5F9'],
    ['BG/Light',          '#F8FAFC'], ['BG/White',         '#FFFFFF'],
    ['Text/High',         '#000000'], ['Text/Medium',      '#707070'],
    ['Text/Placeholder',  '#94A3B8'], ['Border/Default',   '#CBD5E1']
  ];
  var swHost = $('#swatches');
  if (swHost) {
    TOKENS.forEach(function (t) {
      var el = document.createElement('div');
      el.className = 'sw';
      el.innerHTML =
        '<div class="sw__chip" style="background:' + t[1] + '"></div>' +
        '<div class="sw__meta"><span class="sw__name">' + t[0] + '</span>' +
        '<span class="sw__hex">' + t[1] + '</span></div>';
      swHost.appendChild(el);
    });
  }

  /* ---------------------------------------------------------------
     2. Scroll reveals — added by JS so the page is complete without it
     --------------------------------------------------------------- */
  if ('IntersectionObserver' in window && !reduce.matches && !CAPTURE) {
    var groups = ['.section-head', '.ov', '.factcell', '.measured li', '.ds-block', '.coda__grid > .shot', '.tablist'];
    var targets = [];
    groups.forEach(function (sel) {
      $$(sel).forEach(function (el, i) {
        if (el.closest('.hero') || el.closest('.panel')) return;
        el.classList.add('js-reveal', 'reveal-ready');
        el.style.transitionDelay = Math.min(i, 5) * 60 + 'ms';
        targets.push(el);
      });
    });
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('reveal-in'); revealObs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    targets.forEach(function (el) { revealObs.observe(el); });
  }

  /* ---------------------------------------------------------------
     3. Sticky nav — active section highlighting
     --------------------------------------------------------------- */
  var navLinks = $$('.nav__links a');
  var sections = navLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var ticking = false;

  function syncNav() {
    ticking = false;
    var probe = window.scrollY + window.innerHeight * 0.35;
    var current = 0;
    sections.forEach(function (sec, i) {
      if (sec && sec.offsetTop <= probe) current = i;
    });
    if (window.scrollY < 40) current = -1;
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) current = navLinks.length - 1;
    navLinks.forEach(function (a, i) {
      if (i === current) { a.setAttribute('aria-current', 'true'); }
      else { a.removeAttribute('aria-current'); }
    });
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(syncNav); }
  }, { passive: true });
  window.addEventListener('resize', syncNav);
  syncNav();

  /* ---------------------------------------------------------------
     4. Journey — sticky screen follows the step in view (desktop)
     --------------------------------------------------------------- */
  var steps = $$('.step');
  var stageImgs = $$('.journey__stage .phone__screen img');
  var stageShot = $('#stageShot');

  function setStep(n) {
    steps.forEach(function (s) { s.classList.toggle('is-active', s.dataset.step === n); });
    stageImgs.forEach(function (img) { img.classList.toggle('is-active', img.dataset.step === n); });
    var source = $('.step[data-step="' + n + '"] .step__phone .shot');
    if (stageShot && source) {
      stageShot.dataset.src = source.dataset.src;
      stageShot.dataset.title = source.dataset.title;
    }
  }

  if (steps.length && 'IntersectionObserver' in window) {
    var stepObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) setStep(e.target.dataset.step);
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    steps.forEach(function (s) { stepObs.observe(s); });
  }

  /* ---------------------------------------------------------------
     5. Feature tabs
     --------------------------------------------------------------- */
  var tabs = $$('.tab');
  var tablistEl = $('.tablist');
  function selectTab(tab, focus) {
    var before = tablistEl ? tablistEl.getBoundingClientRect().top : null;
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (!panel) return;
      if (on) { panel.hidden = false; panel.style.animation = 'none'; panel.offsetHeight; panel.style.animation = ''; }
      else { panel.hidden = true; }
    });
    if (before !== null) {
      var after = tablistEl.getBoundingClientRect().top;
      if (Math.abs(after - before) > 1) window.scrollBy(0, after - before);
    }
    if (focus) tab.focus();
  }
  if (CAPTURE) {
    document.body.classList.add('is-capture');
    var tl = $('.tablist');
    if (tl) tl.hidden = true;
    $$('.panel').forEach(function (panel) {
      panel.hidden = false;
      panel.style.animation = 'none';
      panel.style.marginBottom = '72px';
    });
    /* lazy images below the fold are never fetched, so they would serialize blank */
    $$('img[loading="lazy"]').forEach(function (img) { img.loading = 'eager'; });
    /* the sticky stage shows one screen at a time; the per-step phones show all of them */
    $$('.journey__stage img').forEach(function (img) { img.classList.add('is-active'); });
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectTab(next, true); }
    });
  });

  /* ---------------------------------------------------------------
     6. Full-screen screen previews
     --------------------------------------------------------------- */
  var gallery = [];
  $$('.shot[data-src]').forEach(function (btn) {
    if (btn.id === 'stageShot') return;
    if (gallery.some(function (g) { return g.src === btn.dataset.src; })) return;
    gallery.push({ src: btn.dataset.src, title: btn.dataset.title || 'Screen' });
  });

  var lb       = $('#lightbox'),
      lbImg    = $('#lbImg'),
      lbTitle  = $('#lbTitle'),
      lbCount  = $('#lbCount'),
      lbScroll = $('#lbScroll'),
      lbClose  = $('#lbClose'),
      lbPrev   = $('#lbPrev'),
      lbNext   = $('#lbNext');
  var lbIndex = 0, lastFocused = null;

  function show(i) {
    if (!gallery.length) return;
    lbIndex = (i + gallery.length) % gallery.length;
    var item = gallery[lbIndex];
    lbImg.src = item.src;
    lbImg.alt = item.title + ' — full screen';
    lbTitle.textContent = item.title;
    lbCount.textContent = (lbIndex + 1) + ' / ' + gallery.length;
    lbScroll.scrollTop = 0;
  }

  function openLb(src, title) {
    var i = gallery.findIndex(function (g) { return g.src === src; });
    if (i < 0) { gallery.push({ src: src, title: title || 'Screen' }); i = gallery.length - 1; }
    lastFocused = document.activeElement;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    show(i);
    lbClose.focus();
  }

  function closeLb() {
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  $$('.shot[data-src]').forEach(function (btn) {
    btn.addEventListener('click', function () { openLb(btn.dataset.src, btn.dataset.title); });
  });

  if (lb) {
    lbClose.addEventListener('click', closeLb);
    lbPrev.addEventListener('click', function () { show(lbIndex - 1); });
    lbNext.addEventListener('click', function () { show(lbIndex + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target === lbScroll) closeLb(); });

    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); closeLb(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(lbIndex - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(lbIndex + 1); }
      else if (e.key === 'Tab') {
        var f = $$('button', lb);
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
})();
