/* MCV Widget case study — progressive enhancement only.
   Without JS the page still shows every image, every step and every variant;
   see the <noscript> block in index.html. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var desktop = window.matchMedia('(min-width: 900px)');

  /* ------------------------------------------------------------------ *
   * 1. Reveal on scroll
   * ------------------------------------------------------------------ */
  function initReveal() {
    var targets = document.querySelectorAll('.reveal, .anno');
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(targets, function (el) {
        el.classList.add('is-in');
      });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------ *
   * 2. Sticky stories — the stage crossfades as the steps advance
   * ------------------------------------------------------------------ */
  function initStories() {
    Array.prototype.forEach.call(document.querySelectorAll('.story'), function (story) {
      var steps = Array.prototype.slice.call(story.querySelectorAll('.story__step'));
      var views = Array.prototype.slice.call(story.querySelectorAll('.story__view'));
      var pins = Array.prototype.slice.call(story.querySelectorAll('.anno__pin'));
      var caption = story.querySelector('[data-stage-caption]');
      if (!steps.length || !views.length) return;

      var active = -1;

      function show(i) {
        if (i < 0 || i === active) return;
        active = i;
        var step = steps[i];
        var view = parseInt(step.getAttribute('data-view') || '0', 10);
        var marker = step.getAttribute('data-marker') || '';

        views.forEach(function (el, n) {
          el.classList.toggle('is-current', n === view);
        });
        // a step may light more than one pin: data-marker="1 4"
        var wanted = marker.split(' ');
        pins.forEach(function (p) {
          p.classList.toggle('is-current', marker !== '' &&
            wanted.indexOf(p.getAttribute('data-pin')) !== -1);
        });
        steps.forEach(function (s, n) {
          s.classList.toggle('is-active', n === i);
        });
        if (caption) {
          // fade the caption in with the image, so the two never disagree
          caption.textContent = step.getAttribute('data-caption') || '';
          caption.classList.remove('is-fresh');
          void caption.offsetWidth;
          caption.classList.add('is-fresh');
        }
      }

      show(0);

      if (!('IntersectionObserver' in window)) return;
      var io = new IntersectionObserver(function (entries) {
        if (!desktop.matches) return;
        entries.forEach(function (e) {
          if (e.isIntersecting) show(steps.indexOf(e.target));
        });
      }, { rootMargin: '-46% 0px -46% 0px', threshold: 0 });

      steps.forEach(function (s) { io.observe(s); });
    });
  }

  /* ------------------------------------------------------------------ *
   * 3. Variant explorer
   * Every combination below maps to a real export from the Figma file.
   * ------------------------------------------------------------------ */
  var LINK_ALL = 'Tapping the widget opens All Assignments.';
  var LINK_ONE = 'Tapping an assignment opens that assignment.';
  var LINK_COURSE = 'Tapping the widget opens that course in MCV.';
  var LINK_POST = 'Tapping an announcement opens it in MCV.';
  var LINK_POST1 = 'Tapping the widget opens that announcement in MCV.';

  var WIDGETS = {
    ar: {
      name: 'Assignment Reminder',
      devices: ['ipad', 'iphone'],
      states: [['content', 'Content'], ['empty', 'Empty']],
      empty: '“Noting due today”, with the line “Go touch some grass”.',
      sizes: {
        ipad: [
          ['small', 'Small', '136 × 136', 'Up to four assignments due today. ' + LINK_ALL],
          ['medium', 'Medium', '300 × 136', 'Up to three assignments, with the course name added. ' + LINK_ALL],
          ['large', 'Large', '300 × 300', 'The week, Monday to Sunday. ' + LINK_ONE],
          ['xl', 'Extra Large', '628 × 300', 'The week again, laid out across two columns. ' + LINK_ONE]
        ],
        iphone: [
          ['small', 'Small', '158 × 158', 'Up to four assignments due today. ' + LINK_ALL],
          ['medium', 'Medium', '338 × 158', 'Up to four assignments, with the course name added. ' + LINK_ALL],
          ['large', 'Large', '338 × 354', 'The week, Monday to Sunday. ' + LINK_ONE]
        ]
      }
    },
    cs: {
      name: 'Class Schedule',
      devices: ['ipad', 'iphone'],
      states: [['content', 'Content'], ['empty', 'Empty']],
      empty: '“No more classes today”, with the line “Remember to pace yourself”.',
      sizes: {
        ipad: [
          ['small', 'Small', '136 × 136', 'The next class only. ' + LINK_COURSE],
          ['medium', 'Medium', '300 × 136', 'The next class, then the rest of the day. ' + LINK_COURSE],
          ['large', 'Large', '300 × 300', 'The next class, then the rest of the day. ' + LINK_COURSE],
          ['xl', 'Extra Large', '628 × 300', 'Three days on an hour rail. ' + LINK_COURSE]
        ],
        iphone: [
          ['small', 'Small', '158 × 158', 'The next class only. ' + LINK_COURSE],
          ['medium', 'Medium', '338 × 158', 'The next class, then the rest of the day. ' + LINK_COURSE],
          ['large', 'Large', '338 × 354', 'The next class, then the rest of the day. ' + LINK_COURSE]
        ]
      }
    },
    an: {
      name: 'Announcements',
      devices: ['ipad', 'iphone'],
      states: [['content', 'Content'], ['empty', 'Empty']],
      empty: '“No more announcements”, with the line “Cherish your downtime”.',
      sizes: {
        ipad: [
          ['small', 'Small', '136 × 136', 'The latest announcement. ' + LINK_POST1],
          ['medium', 'Medium', '300 × 136', 'The three most recent, newest at the top. ' + LINK_POST],
          ['large', 'Large', '300 × 300', 'The six most recent, newest at the top. ' + LINK_POST],
          ['xl', 'Extra Large', '628 × 300', 'The fourteen most recent, newest at the top. ' + LINK_POST]
        ],
        iphone: [
          ['small', 'Small', '158 × 158', 'The latest announcement. ' + LINK_POST1],
          ['medium', 'Medium', '338 × 158', 'The four most recent, newest at the top. ' + LINK_POST],
          ['large', 'Large', '338 × 354', 'The seven most recent, newest at the top. ' + LINK_POST]
        ]
      }
    },
    qa: {
      name: 'Quick Action',
      devices: ['iphone'],
      deviceLabel: 'iPhone and iPad',
      states: [['content', 'Version 1'], ['empty', 'Version 2']],
      tokens: { content: 'v1', empty: 'v2' },
      notes: {
        content: 'Version 1 — four labelled tiles: Notifications, Assignments, My courses, To do list.',
        empty: 'Version 2 — the same four destinations as circular icons with labels underneath.'
      },
      sizes: {
        iphone: [
          ['medium', 'Medium', '338 × 158', 'The only size drawn for this widget. Medium on iPad is the same layout.']
        ]
      }
    }
  };

  var DEVICE_LABEL = { ipad: 'iPad', iphone: 'iPhone' };

  function initExplorer() {
    var root = document.querySelector('[data-explorer]');
    if (!root) return;

    var img = root.querySelector('[data-explorer-img]');
    var box = root.querySelector('[data-explorer-box]');
    var note = root.querySelector('[data-explorer-note]');
    var dims = root.querySelector('[data-explorer-dims]');
    var zoom = root.querySelector('[data-explorer-zoom]');
    var groups = {
      widget: root.querySelector('[data-group="widget"]'),
      device: root.querySelector('[data-group="device"]'),
      size: root.querySelector('[data-group="size"]'),
      state: root.querySelector('[data-group="state"]')
    };
    var deviceRow = root.querySelector('[data-row="device"]');
    if (!img || !groups.widget) return;

    var state = { widget: 'ar', device: 'ipad', size: 'xl', state: 'content' };
    var prefDevice = 'ipad';
    var built = { device: '', size: '', state: '' };
    var swapTimer = null;

    function buttons(group) {
      return Array.prototype.slice.call(groups[group].querySelectorAll('button'));
    }

    function fill(group, items, signature) {
      if (built[group] === signature) return;
      built[group] = signature;

      var hadFocus = groups[group].contains(document.activeElement);
      groups[group].textContent = '';

      items.forEach(function (it) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'seg';
        b.textContent = it[1];
        b.setAttribute('data-value', it[0]);
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () { pick(group, it[0]); });
        groups[group].appendChild(b);
      });

      if (hadFocus) {
        var keep = groups[group].querySelector('[data-value="' + state[group] + '"]');
        if (keep) keep.focus();
      }
    }

    function pick(group, value) {
      state[group] = value;
      // Quick Action forces iPhone; remember the device the reader actually
      // chose so leaving it does not silently change the others.
      if (group === 'device') prefDevice = value;

      var w = WIDGETS[state.widget];
      if (w.devices.indexOf(prefDevice) !== -1) state.device = prefDevice;
      else if (w.devices.indexOf(state.device) === -1) state.device = w.devices[0];

      var ids = w.sizes[state.device].map(function (s) { return s[0]; });
      if (ids.indexOf(state.size) === -1) state.size = ids[ids.length - 1];

      render();
    }

    function render() {
      var w = WIDGETS[state.widget];

      fill('device', w.devices.map(function (d) { return [d, DEVICE_LABEL[d]]; }),
        state.widget);
      fill('size', w.sizes[state.device].map(function (s) { return [s[0], s[1]]; }),
        state.widget + '/' + state.device);
      fill('state', w.states, state.widget);

      if (deviceRow) deviceRow.hidden = w.devices.length < 2;

      ['widget', 'device', 'size', 'state'].forEach(function (g) {
        buttons(g).forEach(function (b) {
          b.setAttribute('aria-pressed',
            b.getAttribute('data-value') === state[g] ? 'true' : 'false');
        });
      });

      var row = w.sizes[state.device].filter(function (s) {
        return s[0] === state.size;
      })[0];
      var pt = row[2].split(' × ');

      var token = w.tokens ? w.tokens[state.state]
        : state.size + (state.state === 'empty' ? '-empty' : '');
      var mode = root.getAttribute('data-mode') || 'dark';
      var file = 'assets/img/' + state.widget + '-' + state.device + '-' +
                 token + '-' + mode + '.webp';

      var label = w.name + ' · ' + row[1] + ' · ' +
                  (w.deviceLabel || DEVICE_LABEL[state.device]) + ' · ' +
                  (mode === 'dark' ? 'dark' : 'light');

      var body = w.notes ? w.notes[state.state]
        : (state.state === 'empty'
            ? 'Nothing to show, so the widget says so: ' + w.empty
            : row[3]);

      // reserve the box before the image lands, so nothing jumps
      box.style.maxWidth = pt[0] + 'px';
      box.style.aspectRatio = pt[0] + ' / ' + pt[1];
      box.classList.toggle('widget--light', mode === 'light');

      function swap() {
        img.src = file;
        img.width = parseInt(pt[0], 10) * 2;
        img.height = parseInt(pt[1], 10) * 2;
        img.alt = label + ' — exported from the Figma file.';
        box.classList.remove('is-swapping');
      }

      window.clearTimeout(swapTimer);
      if (reduced.matches) {
        swap();
      } else {
        box.classList.add('is-swapping');
        swapTimer = window.setTimeout(swap, 140);
      }

      note.textContent = '';
      var b = document.createElement('b');
      b.textContent = label;
      note.appendChild(b);
      note.appendChild(document.createTextNode(body));
      dims.textContent = pt[0] + ' × ' + pt[1] + ' pt · 21 pt corner radius';

      if (zoom) {
        zoom.setAttribute('data-zoom', file);
        zoom.setAttribute('data-zoom-alt', label + ', enlarged.');
        zoom.setAttribute('data-zoom-caption', label);
      }
    }

    buttons('widget').forEach(function (b) {
      b.addEventListener('click', function () {
        pick('widget', b.getAttribute('data-value'));
      });
    });

    Array.prototype.forEach.call(root.querySelectorAll('[data-mode-btn]'), function (b) {
      b.addEventListener('click', function () {
        root.setAttribute('data-mode', b.getAttribute('data-mode-btn'));
        Array.prototype.forEach.call(root.querySelectorAll('[data-mode-btn]'), function (o) {
          o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
        });
        render();
      });
    });

    root.classList.add('is-live');
    render();
  }

  /* ------------------------------------------------------------------ *
   * 3b. Make the smaller widget shots openable too.
   * Runs before the lightbox binds, so the buttons it inserts are picked up.
   * ------------------------------------------------------------------ */
  function initInlineZoom() {
    // On a phone the Medium tiles inside the iPad are under 40px tall, which is
    // too small to be a tap target — there the mockup is scenery, and the widget
    // is reachable from the close-up below it and from the variant explorer.
    var selector = '.story__inline .plate, .step-aside .plate,' +
                   '.roster__shot .widget';
    if (desktop.matches) selector += ', .ipad__tile .widget';

    var boxes = document.querySelectorAll(selector);

    Array.prototype.forEach.call(boxes, function (box) {
      var img = box.querySelector('img');
      if (!img) return;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'plate__shot';
      // the page serves scaled copies as name-640.webp; the master has no suffix
      btn.setAttribute('data-zoom',
        img.getAttribute('src').replace(/-\d+(\.webp)$/, '$1'));
      btn.setAttribute('data-zoom-alt', img.alt);

      // a home screen tile names itself; anything else borrows its figure's caption
      var named = box.closest ? box.closest('[data-caption]') : null;
      if (named) {
        btn.setAttribute('data-zoom-caption', named.getAttribute('data-caption'));
      } else {
        var fig = box.parentNode;
        while (fig && fig.tagName !== 'FIGURE' && fig.tagName !== 'LI') {
          fig = fig.parentNode;
        }
        var cap = fig && (fig.querySelector('figcaption') || fig.querySelector('h3'));
        btn.setAttribute('data-zoom-caption', cap ? cap.textContent.trim() : '');
      }

      box.insertBefore(btn, img);
      btn.appendChild(img);
    });
  }

  /* ------------------------------------------------------------------ *
   * 4. Enlarged preview
   * ------------------------------------------------------------------ */
  function initLightbox() {
    var box = document.getElementById('lightbox');
    if (!box) return;
    var img = box.querySelector('img');
    var cap = box.querySelector('.lightbox__cap');
    var close = box.querySelector('.lightbox__close');
    var scroll = box.querySelector('.lightbox__scroll');
    var opener = null;

    function open(trigger) {
      opener = trigger;
      img.src = trigger.getAttribute('data-zoom');
      img.alt = trigger.getAttribute('data-zoom-alt') || '';
      cap.textContent = trigger.getAttribute('data-zoom-caption') || '';
      if (scroll) scroll.scrollLeft = 0;
      box.hidden = false;
      document.body.style.overflow = 'hidden';
      close.focus();
      document.addEventListener('keydown', onKey, true);
    }

    function shut() {
      box.hidden = true;
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey, true);
      if (opener) opener.focus();
      opener = null;
    }

    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        shut();
        return;
      }
      if (e.key !== 'Tab') return;

      // keep Tab inside the dialog
      var stops = box.querySelectorAll('button, [tabindex="0"]');
      if (!stops.length) return;
      var first = stops[0];
      var last = stops[stops.length - 1];

      if (!box.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    close.addEventListener('click', shut);
    box.addEventListener('click', function (e) {
      if (e.target === box) shut();
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-zoom]'), function (t) {
      t.classList.add('zoomable');
      t.addEventListener('click', function () { open(t); });
    });
  }

  function boot() {
    initReveal();
    initStories();
    initExplorer();
    initInlineZoom();
    initLightbox();
    document.documentElement.classList.add('js');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
