# Artar's Portfolio — unified site

Four UX/UI case studies that were built separately, now presented as pages of one
website, plus a homepage. Static HTML, CSS and JS. No build step, no dependencies.

```
index.html                     homepage — introduction + Selected Work
assets/
  css/shell.css                the shared website shell (all classes prefixed pf-)
  js/shell.js                  header, mobile menu, section nav, reveals, deep links
  resume/Matcee-Artapiyatham-Resume-UXUI.pdf
projects/
  actorstock/                  ActorStock
  englishx/                    EnglishX
  mcv-widget/                  MCV Widget
  assessment-platform/         MyCourseVille — Assessment Platform for Instructors
serve.py                       local preview on :4180
```

## Run it

```bash
python3 serve.py
```

Then open <http://127.0.0.1:4180>. Any static host works — the URLs are
folder-per-project (`/projects/actorstock/`), so GitHub Pages, Netlify, Vercel
and S3 all serve them without rewrite rules.

## How the shell works

Each case study keeps **its own stylesheet and script, verbatim**. The four were
written independently and reuse class names — `.story`, `.reveal`, `.lightbox`,
`.subnav`, `.wrap`, `.band`, `.btn`, `.hero` — with incompatible meanings
(EnglishX's reveal class is `.is-visible`, MCV Widget's and Assessment's is
`.is-in`; EnglishX's lightbox is a native `<dialog>`, the others are custom
divs). Because each project is its own page, those never meet at runtime.

On top sits `assets/css/shell.css` + `assets/js/shell.js`, where **every class is
prefixed `pf-`** so it cannot collide with a project's own. The shell loads
*before* the project stylesheet, and its rules are class-based, so they win over
project element resets (`ul, ol { list-style: none }`) regardless of order.

The shell is white and neutral on purpose: each case study keeps its own colours
and visuals inside the page.

### What each page gets from the shell

| Component | |
|---|---|
| `pf-header` | "Artar's Portfolio" → home; Work, About, Resume, Contact. On project pages Work and About point at the homepage anchors. |
| `pf-menu` | The same accessible mobile menu everywhere — `aria-expanded`, Escape, focus trap, focus restore. |
| `pf-sectionnav` | "Back to work" plus the sections actually present on that page, with a shared scrollspy. |
| `pf-related` | "Explore more work" — the other three projects. |
| `pf-footer` | The same footer on every page. |

### Typography

`shell.css` opens with the rule the MCV Widget and Assessment stylesheets already
carried, promoted site-wide:

```css
*, *::before, *::after { letter-spacing: normal; }
```

Nothing anywhere in this site sets a tracking value — verified both by grep and
by reading the computed `letter-spacing` of every rendered element.

## Project covers

Each card carries a branded cover instead of a cropped screenshot: the project's
own Figma palette as the field, its wordmark, one verbatim sentence from its own
lede, its real screenshots in device frames, and flat SVG motifs lifted from what
the product actually contains (ActorStock: search chips, profile card, invite
code, tier pill; EnglishX: speech bubble, streak ring, radar, mic; MCV Widget:
widget tile, calendar, bell, the 21 pt corner arc; MyCourseVille: ticked checkbox,
analytics bars, the Save button, a question card).

No new image assets — the whole composition is CSS, sized in container query
units so it scales from a 335px phone card to a full-width preview. Minimum type
sizes keep the wordmark and tagline legible in the narrow 3-up "Explore more
work" grid.

Two variants ship in `shell.css`. Swap `pf-cover--motif` for `pf-cover--clean` on
a cover to drop the motifs and keep the field, wordmark and devices.

Device crops are deliberate: the two desktop projects show their dashboard
**larger than the frame** (`.pf-cover__browser img { width: 142% }`) because a
whole 1440px screen shrunk into a card is unreadable, while the ActorStock phones
show their screens at true phone scale, top-anchored — those exports are whole
scrolling pages (`home.webp` is 440 x 9,436), so the frame crops them the way a
device would.

## Editing a case study

Edit `projects/<slug>/index.html`. The chrome lives in four clearly commented
blocks (`SHARED SITE HEADER`, `LOCAL CASE-STUDY SECTION MENU`, `EXPLORE MORE
WORK`, `SHARED SITE FOOTER`); everything between them is that project's own
content and is unchanged from the original.

The original standalone folders are still next to this one and are untouched:
`../Reference` (ActorStock), `../englishx-case-study`, `../mcv-widget-case-study`,
`../mcv-assessment-case-study`. They keep the image-regeneration scripts
(`build-images.py`) and the raw `source-exports/` that this site does not need.

### Things that break silently — don't rename these

- Assessment's `.anim` starts at `opacity: 0`; renaming `.anim` or `.is-in`
  renders the whole page blank.
- Assessment binds annotation pins to steps by matching the `data-n` string, and
  each step's `<h4>` supplies its pin's accessible name.
- MCV Widget's variant explorer builds image paths at runtime from
  `{widget}-{device}-{size}[-empty]-{mode}.webp`, so 113 of its 152 images appear
  nowhere in the HTML. Keep the whole `assets/img` tree and the filenames.
- ActorStock's journey pairs its seven steps to seven stage images by `data-step`,
  and the sixteen design-system colour swatches are rendered from the `TOKENS`
  array in `main.js` — they exist nowhere in the HTML.
- EnglishX's dashboard hotspots are percentages (`data-x/y/w/h`) of
  `dashboard.webp`'s exact aspect ratio. Don't recrop that image.
- Each page needs its own single lightbox element.

## ActorStock → Figma

```bash
cd projects/actorstock && python3 build.py
```

Regenerates `capture.html` (the page plus Figma's html-to-design script, kept
separate so the shipped page never loads a third-party script) and
`dist/artifact.html`. Run it after every edit to `projects/actorstock/index.html`
— `capture.html` used to be maintained by hand and went stale.

`?capture=1` flattens any page for a Figma frame: `main.js` expands all six
feature panels, hides the tablist, unpins the journey, disables scroll-reveal and
forces every lazy image eager; `shell.js` hides the header, section menu,
"Explore more work" and footer.

## Still to supply

ActorStock's Reflection section has three cards — **What worked**, **What you
would change**, **Outcome** — that were never written. The markup is still in
`projects/actorstock/index.html`; it is hidden by one rule at the foot of
`projects/actorstock/styles.css`. Delete that rule once the copy exists.
