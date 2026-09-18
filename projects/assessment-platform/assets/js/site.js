/* MyCourseVille assessment case study — reveals, V1/V2 comparison, lightbox.
   Everything here is progressive: without JS the page shows both versions of
   every comparison, every annotation and every section, already in place. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var desktop = window.matchMedia('(min-width: 1000px)');
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- reveals
     A sweep rather than an IntersectionObserver: a jump to #compare, or any
     fast scroll, leaves an observer's skipped elements hidden for good. This
     reveals everything at or above the fold every frame it needs to, so no
     section can end up permanently blank. */
  (function reveals() {
    var items = $$('.anim');
    if (!items.length) return;

    function revealAll() { items.forEach(function (el) { el.classList.add('is-in'); }); items = []; }
    if (reduced.matches) { revealAll(); return; }

    var queued = false;
    function sweep() {
      queued = false;
      var edge = window.innerHeight * 0.92;
      items = items.filter(function (el) {
        if (el.getBoundingClientRect().top > edge) return true;
        el.classList.add('is-in');
        return false;
      });
      if (!items.length) {
        window.removeEventListener('scroll', request);
        window.removeEventListener('resize', request);
      }
    }
    function request() { if (!queued) { queued = true; requestAnimationFrame(sweep); } }

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    window.addEventListener('hashchange', request);
    window.addEventListener('load', request);
    sweep();
  }());

  /* ------------------------------------------------- section nav highlight */
  (function navState() {
    var links = $$('.nav__list a');
    if (!links.length || !('IntersectionObserver' in window)) return;

    var map = {};
    var targets = [];
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (!section) return;
      map[id] = a;
      targets.push(section);
    });

    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        visible[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0;
      });
      var best = null, bestRatio = 0;
      Object.keys(visible).forEach(function (id) {
        if (visible[id] > bestRatio) { bestRatio = visible[id]; best = id; }
      });
      links.forEach(function (a) { a.removeAttribute('aria-current'); });
      if (best && map[best]) map[best].setAttribute('aria-current', 'true');
    }, { rootMargin: '-64px 0px -55% 0px', threshold: [0, 0.05, 0.25, 0.5, 1] });

    targets.forEach(function (t) { io.observe(t); });
  }());

  /* ------------------------------------------------ V1 / V2 story viewers */
  function setupStory(story) {
    var shots   = $$('.shot', story);
    var buttons = $$('.tabs button', story);
    var steps   = $$('.step', story);
    if (!shots.length) return;

    var current = 'v2';

    function showVersion(v) {
      current = v;
      shots.forEach(function (s) {
        s.setAttribute('data-state', s.getAttribute('data-v') === v ? 'on' : 'off');
      });
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v));
      });
    }

    function markStep(step) {
      steps.forEach(function (s) {
        if (s === step) { s.setAttribute('aria-current', 'step'); }
        else { s.removeAttribute('aria-current'); }
      });
      var n = step && step.getAttribute('data-n');
      $$('.anno__pin', story).forEach(function (pin) {
        pin.setAttribute('data-active', String(!!n && pin.getAttribute('data-n') === n));
      });
    }

    /* Scrolling advances the explanation and lights the matching pin on
       whichever version is on screen. It never changes the version itself:
       the toggle belongs to the reader, and both versions carry the same
       numbered pins, so the sequence reads correctly either way. */

    buttons.forEach(function (b, i) {
      b.addEventListener('click', function () { showVersion(b.getAttribute('data-v')); });
      b.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = buttons[(i + 1) % buttons.length];
        if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   next = buttons[(i - 1 + buttons.length) % buttons.length];
        if (!next) return;
        e.preventDefault();
        next.focus();
        showVersion(next.getAttribute('data-v'));
      });
    });

    steps.forEach(function (step) {
      step.addEventListener('click', function () { markStep(step); });
      step.addEventListener('focus', function () { if (desktop.matches) markStep(step); });
    });

    /* a pin selects the change it belongs to, and borrows its name */
    $$('.anno__pin', story).forEach(function (pin) {
      var owner = steps.filter(function (s) {
        return s.getAttribute('data-n') === pin.getAttribute('data-n');
      })[0];
      var heading = owner && owner.querySelector('h4');
      pin.setAttribute('aria-label',
        'Change ' + pin.getAttribute('data-n') + (heading ? ': ' + heading.textContent.trim() : ''));
      pin.addEventListener('click', function () { if (owner) markStep(owner); });
    });

    /* light the pins once the stage has arrived */
    var annos = $$('.anno', story);
    if (reduced.matches || !('IntersectionObserver' in window)) {
      annos.forEach(function (a) { a.classList.add('is-lit'); });
    } else {
      var lit = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-lit'); lit.unobserve(e.target); }
        });
      }, { threshold: 0.3 });
      annos.forEach(function (a) { lit.observe(a); });
    }

    /* scroll-driven step syncing, desktop only — the stage is static on mobile */
    if (steps.length && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (!desktop.matches) return;
        var hit = entries.filter(function (e) { return e.isIntersecting; });
        if (!hit.length) return;
        hit.sort(function (a, b) {
          return a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top;
        });
        markStep(hit[0].target);
      }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });
      steps.forEach(function (s) { io.observe(s); });
    }

    if (steps.length) markStep(steps[0]);
    showVersion('v2');
  }

  $$('.story').forEach(setupStory);

  /* ------------------------------------------------------------- lightbox */
  (function lightbox() {
    var triggers = $$('.zoom');
    if (!triggers.length) return;

    var box     = $('#lightbox');
    var img     = $('#lightbox-img');
    var cap     = $('#lightbox-cap');
    var closeBt = $('#lightbox-close');
    var scroll  = $('.lb__scroll', box);
    if (!box || !img) return;

    var opener = null;

    function open(trigger) {
      opener = trigger;
      img.src = trigger.getAttribute('data-full');
      img.width  = trigger.getAttribute('data-w') || '';
      img.height = trigger.getAttribute('data-h') || '';
      img.alt = trigger.getAttribute('data-alt') || '';
      cap.innerHTML = trigger.getAttribute('data-cap') || '';
      box.classList.add('is-open');
      box.removeAttribute('aria-hidden');
      document.body.classList.add('lb-open');
      if (scroll) scroll.scrollTop = 0;
      closeBt.focus();
      document.addEventListener('keydown', onKey, true);
    }

    function close() {
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lb-open');
      document.removeEventListener('keydown', onKey, true);
      img.removeAttribute('src');
      if (opener) { opener.focus(); opener = null; }
    }

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      /* only two focusables inside: keep the ring on them */
      var focusables = $$('button, [href], [tabindex]:not([tabindex="-1"])', box)
        .filter(function (el) { return el.offsetParent !== null || el === closeBt; });
      if (!focusables.length) return;
      var first = focusables[0];
      var last  = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    triggers.forEach(function (t) {
      t.addEventListener('click', function () { open(t); });
    });
    closeBt.addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
  }());
}());
