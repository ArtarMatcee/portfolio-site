/* ==========================================================================
   Artar's Portfolio — shared website shell behaviour
   --------------------------------------------------------------------------
   Runs on the homepage and on every case-study page, alongside each project's
   own script. It only ever touches elements whose class starts with `pf-`, so
   it cannot interfere with a project's own stories, tabs, explorers or
   lightboxes.

   Everything degrades: without JS the header, section nav, cards and footer
   are all fully readable and every link works.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var CAPTURE = /[?&]capture\b/.test(location.search);

  if (CAPTURE) root.classList.add('pf-capture');

  /* ---------------------------------------------------------------- menu --
     One accessible mobile menu, identical on every page. */
  function initMenu() {
    var btn = document.querySelector('[data-pf-menu-button]');
    var menu = document.querySelector('[data-pf-menu]');
    if (!btn || !menu) return;

    var lastFocused = null;

    function focusables() {
      return Array.prototype.filter.call(
        menu.querySelectorAll('a[href], button:not([disabled])'),
        function (el) { return el.offsetParent !== null; }
      );
    }

    function open() {
      lastFocused = document.activeElement;
      menu.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      var first = focusables()[0];
      if (first) first.focus();
      document.addEventListener('keydown', onKeydown, true);
      document.addEventListener('click', onDocClick, true);
    }

    function close(restoreFocus) {
      if (menu.hidden) return;
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('keydown', onKeydown, true);
      document.removeEventListener('click', onDocClick, true);
      if (restoreFocus !== false && lastFocused && lastFocused.focus) lastFocused.focus();
    }

    function onKeydown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab') return;

      var items = focusables();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];

      // The trap spans the toggle button and the menu, so Shift+Tab off the
      // first link lands back on the button the user opened it with.
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        btn.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        btn.focus();
      }
    }

    function onDocClick(e) {
      if (menu.contains(e.target) || btn.contains(e.target)) return;
      close(false);
    }

    btn.addEventListener('click', function () {
      if (menu.hidden) open(); else close();
    });

    // Following a link inside the menu should close it.
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) close(false);
    });

    // Never leave the panel open when the layout returns to desktop.
    var desktop = window.matchMedia('(min-width: 861px)');
    var onChange = function (e) { if (e.matches) close(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else if (desktop.addListener) desktop.addListener(onChange);
  }

  /* ----------------------------------------------------------- scrollspy --
     Marks the section nav link for whichever section the reader is in. Uses a
     probe point rather than IntersectionObserver so it behaves the same across
     four very different page layouts, including the sticky scroll stories. */
  function initSectionNav() {
    var nav = document.querySelector('[data-pf-sectionnav]');
    if (!nav) return;

    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    if (!links.length) return;

    var targets = links
      .map(function (a) {
        var id = a.getAttribute('href').slice(1);
        return id ? { link: a, el: document.getElementById(id) } : null;
      })
      .filter(function (t) { return t && t.el; });

    if (!targets.length) return;

    var current = null;
    var ticking = false;

    function chromeHeight() {
      var value = getComputedStyle(root).getPropertyValue('--pf-chrome-h');
      var n = parseFloat(value);
      return isNaN(n) ? 112 : n;
    }

    function sync() {
      ticking = false;

      var probe = window.scrollY + chromeHeight() + 24;
      var atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
      var found = null;

      if (atBottom) {
        found = targets[targets.length - 1];
      } else {
        for (var i = 0; i < targets.length; i++) {
          if (targets[i].el.getBoundingClientRect().top + window.scrollY <= probe) {
            found = targets[i];
          }
        }
      }

      if (found === current) return;
      if (current) current.link.removeAttribute('aria-current');
      if (found) found.link.setAttribute('aria-current', 'true');
      current = found;

      // Keep the active pill in view in the horizontally scrolling strip.
      if (found && nav.scrollWidth > nav.clientWidth) {
        var list = found.link.parentNode.parentNode;
        if (list && list.scrollWidth > list.clientWidth) {
          var l = found.link;
          var min = list.scrollLeft;
          var max = min + list.clientWidth;
          if (l.offsetLeft < min || l.offsetLeft + l.offsetWidth > max) {
            list.scrollTo({
              left: Math.max(0, l.offsetLeft - 16),
              behavior: reduce.matches ? 'auto' : 'smooth'
            });
          }
        }
      }
    }

    function request() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(sync);
    }

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request, { passive: true });
    window.addEventListener('hashchange', request);
    sync();
  }

  /* -------------------------------------------------------------- reveal --
     Gentle entrance for shell content only. Project content keeps its own
     reveal machinery untouched. */
  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.pf-reveal'));
    if (!items.length) return;

    function showAll() {
      items.forEach(function (el) { el.classList.add('pf-in'); });
    }

    if (CAPTURE || reduce.matches || !('IntersectionObserver' in window)) {
      showAll();
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('pf-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });

    items.forEach(function (el, i) {
      var delay = Math.min(i, 5) * 70;
      el.style.transitionDelay = delay + 'ms';
      io.observe(el);
    });
  }

  /* -------------------------------------------------------- hash landing --
     These pages are long, image-heavy and full of scroll-driven stories, and
     the browser's own jump to a `#fragment` on first load gets lost: it fires
     before layout settles and is then cancelled. Re-apply it once after layout,
     and again after `load`, so a shared deep link opens where it should.
     Abandoned the moment the reader scrolls for themselves. */
  function initHashLanding() {
    if (!location.hash || location.hash === '#') return;

    var target;
    try {
      target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    } catch (e) {
      return;
    }
    if (!target) return;

    var userScrolled = false;
    var release = function () { userScrolled = true; };
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (evt) {
      window.addEventListener(evt, release, { passive: true, once: true });
    });

    var settle = function () {
      if (userScrolled) return;
      // Every page sets `scroll-behavior: smooth`, and ScrollBehavior "auto"
      // resolves to that — a smooth jump of ten thousand pixels on a page this
      // long gets cancelled before it arrives. Suspend it for the jump.
      var previous = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
      root.style.scrollBehavior = previous;
    };

    // Layout keeps moving after first paint — webfonts swap in and change text
    // metrics, and images finish decoding — so re-apply until it stops.
    window.requestAnimationFrame(function () { window.requestAnimationFrame(settle); });

    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(settle).catch(function () {});
    }

    if (document.readyState === 'complete') {
      window.setTimeout(settle, 0);
      window.setTimeout(settle, 250);
    } else {
      window.addEventListener('load', function () {
        settle();
        window.setTimeout(settle, 250);
      }, { once: true });
    }
  }


  /* ---------------------------------------------------------------- gems --
     The stones are placed in CSS, which cannot know where the text actually
     wraps. A stone tucked behind the big display name reads as deliberate; one
     behind body copy just looks like a smudge. So after layout, hide any stone
     that lands on a glyph run smaller than display size, and re-check on
     resize. Without JS the full scatter still renders, which is harmless. */
  function initGems() {
    var gems = Array.prototype.slice.call(document.querySelectorAll('.pf-gem'));
    if (!gems.length) return;

    var DISPLAY_PX = 38;   // at or above this, a stone behind the text is fine

    function smallTextRects() {
      var rects = [];
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      var node;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue.trim()) continue;
        var el = node.parentElement;
        if (!el || el.closest('.pf-gems, .pf-gemdefs')) continue;
        if (parseFloat(getComputedStyle(el).fontSize) >= DISPLAY_PX) continue;
        var range = document.createRange();
        range.selectNodeContents(node);
        var list = range.getClientRects();
        for (var i = 0; i < list.length; i++) {
          if (list[i].width > 1 && list[i].height > 1) rects.push(list[i]);
        }
      }
      return rects;
    }

    function place() {
      gems.forEach(function (g) { g.classList.remove('pf-gem--clear'); });
      var rects = smallTextRects();
      gems.forEach(function (g) {
        var a = g.getBoundingClientRect();
        if (!a.width) return;
        var pad = 4;
        for (var i = 0; i < rects.length; i++) {
          var b = rects[i];
          if (a.left < b.right + pad && a.right > b.left - pad &&
              a.top < b.bottom + pad && a.bottom > b.top - pad) {
            g.classList.add('pf-gem--clear');
            return;
          }
        }
      });
    }

    place();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place).catch(function () {});
    // The reveal transition lifts content by 18px, so the first pass measures
    // positions the layout has not settled into yet — check again after it has.
    window.addEventListener('load', function () {
      place();
      window.setTimeout(place, 700);
      window.setTimeout(place, 1500);
    });

    var t;
    window.addEventListener('resize', function () {
      window.clearTimeout(t);
      t = window.setTimeout(place, 140);
    }, { passive: true });
  }

  function boot() {
    initMenu();
    initSectionNav();
    initReveal();
    initHashLanding();
    initGems();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
