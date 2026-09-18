/* EnglishX — Current Design case study
   Progressive enhancement only: every section is readable with JS disabled. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isReduced = function () { return reduced.matches; };
  var isDesktop = function () { return window.matchMedia('(min-width: 901px)').matches; };

  /* ---------------------------------------------------- hero entrance -- */
  requestAnimationFrame(function () { document.body.classList.add('is-ready'); });

  /* -------------------------------------------------- scroll reveals -- */
  /* A plain scroll sweep rather than IntersectionObserver alone: jumping down
     the page (anchor link, scrollbar drag, trackpad fling) can move an element
     from "below the fold" to "above the fold" without ever intersecting, and an
     observer never fires for that. Anything at or above the fold is revealed. */
  var revealables = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  function sweepReveals() {
    if (!revealables.length) { return; }
    var limit = window.innerHeight * 0.92;
    revealables = revealables.filter(function (el) {
      if (el.getBoundingClientRect().top < limit) {
        el.classList.add('is-visible');
        return false;
      }
      return true;
    });
  }

  if (isReduced()) {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
    revealables = [];
  }

  /* -------------------------------------------------------- sub-nav -- */
  var subnav = document.getElementById('subnav');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.subnav__list a'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if (subnav && 'IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    subnav.parentNode.insertBefore(sentinel, subnav);
    new IntersectionObserver(function (e) {
      subnav.classList.toggle('is-stuck', !e[0].isIntersecting);
    }, { threshold: 1 }).observe(sentinel);
  }

  function syncNav() {
    var mark = window.scrollY + (window.innerHeight * 0.32);
    var current = null;
    sections.forEach(function (section) {
      if (section.offsetTop <= mark) { current = section; }
    });
    navLinks.forEach(function (link) {
      var on = current && link.getAttribute('href') === '#' + current.id;
      if (on) { link.setAttribute('aria-current', 'true'); }
      else { link.removeAttribute('aria-current'); }
    });
  }
  var scrollTick = false;
  function onScroll() {
    if (scrollTick) { return; }
    scrollTick = true;
    requestAnimationFrame(function () {
      syncNav();
      sweepReveals();
      syncStories();
      scrollTick = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('load', onScroll);
  syncNav();
  sweepReveals();

  /* --------------------------------------------- sticky scroll stories -- */
  var stories = [];

  document.querySelectorAll('[data-story]').forEach(function (story) {
    var mode = story.getAttribute('data-stage');
    var steps = Array.prototype.slice.call(story.querySelectorAll('[data-step]'));
    var layers = Array.prototype.slice.call(story.querySelectorAll('[data-layer]'));
    var hotspot = story.querySelector('[data-hotspot]');
    var label = story.querySelector('[data-stage-label]');
    if (!steps.length) { return; }

    var state = { active: -1 };

    function activate(index) {
      index = Math.max(0, Math.min(steps.length - 1, index));
      if (index === state.active) { return; }
      state.active = index;

      if (isDesktop()) {
        steps.forEach(function (step, i) { step.classList.toggle('is-active', i === index); });
      }

      if (mode === 'fade' && layers.length) {
        layers.forEach(function (layer, i) { layer.classList.toggle('is-active', i === index); });
        if (label) {
          var text = steps[index].getAttribute('data-label');
          if (text) { label.textContent = text; }
        }
      }

      if (mode === 'hotspot' && hotspot) {
        var step = steps[index];
        hotspot.style.setProperty('--x', step.getAttribute('data-x'));
        hotspot.style.setProperty('--y', step.getAttribute('data-y'));
        hotspot.style.setProperty('--w', step.getAttribute('data-w'));
        hotspot.style.setProperty('--h', step.getAttribute('data-h'));
      }
    }

    /* Read positions directly on each scroll pass. An observer can be skipped
       entirely when the page jumps, which would strand the stage on the wrong
       screen; measuring is cheap for a handful of steps and never goes stale. */
    function sync() {
      if (!isDesktop()) {
        steps.forEach(function (step) { step.classList.add('is-active'); });
        if (hotspot) { hotspot.classList.remove('is-on'); }
        return;
      }
      if (hotspot) { hotspot.classList.add('is-on'); }

      var mark = window.innerHeight * 0.45;
      var index = 0;
      steps.forEach(function (step, i) {
        if (step.getBoundingClientRect().top <= mark) { index = i; }
      });
      activate(index);
      steps.forEach(function (step, i) { step.classList.toggle('is-active', i === state.active); });
    }

    activate(0);
    stories.push(sync);
  });

  function syncStories() { stories.forEach(function (fn) { fn(); }); }
  syncStories();

  /* ------------------------------------------------------ tab groups -- */
  document.querySelectorAll('[data-switcher]').forEach(function (group) {
    var tabs = Array.prototype.slice.call(group.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (tab) {
      return document.getElementById(tab.getAttribute('aria-controls'));
    });

    function select(index, focus) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
        if (panels[i]) {
          panels[i].hidden = !on;
          panels[i].classList.toggle('is-active', on);
        }
      });
      if (focus) { tabs[index].focus(); }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i); });
      // Horizontal tablist: left/right only, so Up/Down and PageUp/PageDown
      // still scroll the page while a tab has focus.
      tab.addEventListener('keydown', function (event) {
        var next = null;
        if (event.key === 'ArrowRight') { next = (i + 1) % tabs.length; }
        else if (event.key === 'ArrowLeft') { next = (i - 1 + tabs.length) % tabs.length; }
        else if (event.key === 'Home') { next = 0; }
        else if (event.key === 'End') { next = tabs.length - 1; }
        if (next !== null) { event.preventDefault(); select(next, true); }
      });
    });
  });

  /* -------------------------------------------------------- lightbox -- */
  var dialog = document.getElementById('lightbox');
  var dialogImg = document.getElementById('lightbox-img');
  var dialogCap = document.getElementById('lightbox-cap');
  var opener = null;

  if (dialog && typeof dialog.showModal === 'function') {
    document.querySelectorAll('[data-zoom]').forEach(function (trigger) {
      var img = trigger.querySelector('img');
      if (img) {
        trigger.setAttribute('aria-label', 'Enlarge screen: ' + (trigger.getAttribute('data-zoom-caption') || img.alt));
      }
      trigger.addEventListener('click', function () {
        opener = trigger;
        dialogImg.src = trigger.getAttribute('data-zoom');
        dialogImg.alt = img ? img.alt : '';
        dialogCap.textContent = trigger.getAttribute('data-zoom-caption') || '';
        dialog.showModal();
      });
    });

    dialog.querySelector('[data-close]').addEventListener('click', function () { dialog.close(); });

    // Click outside the figure closes, same as Escape.
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) { dialog.close(); }
    });

    // Chrome closes a modal <dialog> on Escape by itself, but the close request
    // does not always reach the element (embedded webviews, some kiosk shells).
    // Handling the key explicitly makes Escape deterministic everywhere; the
    // second close() is a no-op when the browser already handled it.
    dialog.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' || event.key === 'Esc') {
        event.preventDefault();
        dialog.close();
      }
    });

    dialog.addEventListener('close', function () {
      dialogImg.removeAttribute('src');
      if (opener) { opener.focus(); opener = null; }
    });
  } else {
    // No dialog support: let the screenshot open in a new tab instead.
    document.querySelectorAll('[data-zoom]').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        window.open(trigger.getAttribute('data-zoom'), '_blank', 'noopener');
      });
    });
  }
})();
