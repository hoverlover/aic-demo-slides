---
name: remote-html-slide-deck
description: Create, validate, register, and publish remote-controllable static HTML slide decks for the AI Collective slide deck repository. Use when an agent needs to turn user-provided context, notes, research, or source material into a polished public HTML deck that works with the repository's /remote controller.
---

# Remote HTML Slide Deck

Use this skill to create a new public HTML slide deck in the AI Collective slide deck repository. The finished deck must be a static HTML file, listed on the app index page, and compatible with the app's cross-device remote controller.

This skill is intentionally self-contained so an agent can read it from a public URL and work against the GitHub repository with normal clone/edit/commit/push access.

## Repository Contract

Expected repo shape:

- `public/` contains static decks, served at the site root.
- `public/deck-runtime.js` owns shared slide navigation and remote-control synchronization.
- `app/decks.json` is the public deck catalog used by the index page.
- `tools/register-deck.mjs` adds or updates a catalog entry.
- `tools/validate-deck.mjs` checks whether a generated deck satisfies the runtime contract.
- `/remote`, `/api/room`, `/api/nav`, and `/api/state` are app-owned. Do not reimplement them inside a deck.

New decks should be named `public/<slug>-slides.html` and served as `/<slug>-slides.html`.

## Remote-Control Contract

Every new deck must include:

- A full-viewport `.deck` container.
- One or more `.slide` elements.
- Exactly one `.slide.active` at load time.
- A current-slide counter with `id="counter-current"`.
- A total-slide counter with `id="counter-total"`.
- The shared runtime script before `</body>`:

```html
<script
  src="/deck-runtime.js"
  data-accent="#38bdf8"
  data-badge-bg="#111827"
  data-badge-border="#374151"
  data-badge-color="#38bdf8"
></script>
```

Do not copy legacy inline remote code from older decks. Do not add hidden `#remote-ui` markup. The runtime handles click navigation, keyboard navigation, room creation, polling, and sync with the `/remote` controller.

## Workflow

1. Understand the request.
   - Identify audience, goal, desired tone, and expected length.
   - Ask only if the missing information would materially change the deck.

2. Research before writing claims.
   - Use primary or authoritative sources for factual, current, technical, legal, medical, financial, or product claims.
   - If the user provided sufficient private context, use that context as the main source of truth.
   - Keep claims concrete and avoid unsupported hype.

3. Create a brief slide plan before coding.
   - Prefer 5-9 slides unless the user asks otherwise.
   - A reliable structure is: title, context/problem, core insight, solution, how it works, proof/example, implications, next steps.
   - Each slide should have one job.

4. Build the deck.
   - Create `public/<slug>-slides.html`.
   - Use static HTML, CSS, and minimal deck-local JavaScript only for visual effects.
   - Use `/deck-runtime.js` for all slide navigation and remote-control behavior.
   - Use existing decks as visual references, but do not duplicate their inline remote API code.

5. Register the deck.
   - Run:

```bash
node tools/register-deck.mjs --name "Deck Name" --href /example-slides.html --desc "Short index description"
```

6. Validate and verify.
   - Run:

```bash
node tools/validate-deck.mjs public/example-slides.html
npm run lint
npm run build
```

   - When possible, run the app locally, open the deck, check several slides, and confirm the room badge appears.

7. Publish.
   - Commit the new deck, catalog update, and any assets.
   - Push through the normal GitHub workflow. The deployed app makes the HTML deck and this skill file public.

## HTML Template

Use this as the minimum starting point. Replace copy, visual language, colors, and slide structure to match the deck subject.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Deck Title</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  html,
  body {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #071014;
    color: #f8fafc;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .deck {
    width: 100vw;
    height: 100vh;
    position: relative;
  }

  .slide {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4vh;
    padding: 9vh 8vw;
    opacity: 0;
    pointer-events: none;
    transition: opacity 240ms ease;
    overflow: hidden;
  }

  .slide.active {
    opacity: 1;
    pointer-events: auto;
  }

  .slide::before {
    content: "";
    position: absolute;
    inset: -20%;
    z-index: 0;
    background:
      radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.18), transparent 32%),
      radial-gradient(circle at 80% 70%, rgba(34, 197, 94, 0.12), transparent 34%);
  }

  .slide > * {
    position: relative;
    z-index: 1;
  }

  .slide-counter {
    position: fixed;
    top: 2vh;
    right: 3vw;
    z-index: 100;
    color: rgba(248, 250, 252, 0.48);
    font: 600 0.78rem ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  .slide-counter .current {
    color: #38bdf8;
  }

  .eyebrow {
    color: #38bdf8;
    font-size: clamp(0.76rem, 1vw, 0.92rem);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0;
  }

  h1 {
    max-width: 980px;
    color: #ffffff;
    font-size: clamp(3rem, 7vw, 6rem);
    line-height: 0.96;
    letter-spacing: 0;
  }

  h2 {
    max-width: 940px;
    color: #ffffff;
    font-size: clamp(2.2rem, 4.6vw, 4.5rem);
    line-height: 1;
    letter-spacing: 0;
  }

  p {
    max-width: 760px;
    color: rgba(248, 250, 252, 0.74);
    font-size: clamp(1rem, 1.5vw, 1.45rem);
    line-height: 1.55;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    width: min(100%, 1040px);
  }

  .panel {
    min-height: 180px;
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 8px;
    background: rgba(15, 23, 42, 0.74);
    padding: 1.2rem;
  }

  .panel strong {
    display: block;
    margin-bottom: 0.65rem;
    color: #ffffff;
    font-size: 1rem;
  }

  .panel span {
    color: rgba(226, 232, 240, 0.72);
    font-size: 0.95rem;
    line-height: 1.45;
  }

  .footer {
    position: absolute;
    left: 8vw;
    right: 8vw;
    bottom: 4vh;
    display: flex;
    justify-content: space-between;
    color: rgba(148, 163, 184, 0.66);
    font-size: 0.78rem;
  }

  @media (max-width: 760px) {
    .slide { padding: 8vh 6vw; }
    .grid { grid-template-columns: 1fr; }
    .footer { left: 6vw; right: 6vw; }
  }
</style>
</head>
<body>
<div class="deck">
  <div class="slide-counter"><span class="current" id="counter-current">1</span> / <span id="counter-total">3</span></div>

  <section class="slide active">
    <div class="eyebrow">Context</div>
    <h1>Deck Title</h1>
    <p>One clear sentence that frames the point of the deck for the intended audience.</p>
    <div class="footer">
      <span>AI Collective</span>
      <span>Remote-ready HTML deck</span>
    </div>
  </section>

  <section class="slide">
    <div class="eyebrow">Core Idea</div>
    <h2>The main argument belongs here</h2>
    <p>Explain the shift, problem, or opportunity in concrete terms.</p>
    <div class="footer">
      <span>AI Collective</span>
      <span>2</span>
    </div>
  </section>

  <section class="slide">
    <div class="eyebrow">Takeaways</div>
    <h2>What should the room remember?</h2>
    <div class="grid">
      <div class="panel"><strong>Takeaway one</strong><span>Short, specific, defensible point.</span></div>
      <div class="panel"><strong>Takeaway two</strong><span>Short, specific, defensible point.</span></div>
      <div class="panel"><strong>Takeaway three</strong><span>Short, specific, defensible point.</span></div>
    </div>
    <div class="footer">
      <span>AI Collective</span>
      <span>3</span>
    </div>
  </section>
</div>

<script
  src="/deck-runtime.js"
  data-accent="#38bdf8"
  data-badge-bg="#071014"
  data-badge-border="#1f2937"
  data-badge-color="#38bdf8"
></script>
</body>
</html>
```

## Design Requirements

- Build the actual deck, not a landing page.
- Make slides visually specific to the subject. Use real screenshots, generated bitmap assets, diagrams, or concrete product visuals when they clarify the story.
- Keep text short enough to present live. Use speaker-friendly fragments, not paragraphs of prose.
- Ensure every slide fits desktop and mobile viewports without text overlap.
- Use stable layout dimensions for repeated grids, panels, counters, toolbars, and visual systems.
- Use `letter-spacing: 0`; do not use negative letter spacing.
- Avoid one-note palettes. Use a restrained primary accent plus neutral surfaces and at least one secondary color when the subject allows.
- Avoid cards inside cards. Panels are fine for repeated items, but do not frame the whole slide inside a decorative card.
- Do not include unused controls or placeholder copy in the final deck.

## Quality Bar

Before finalizing, confirm:

- The deck file exists under `public/`.
- The catalog entry exists in `app/decks.json`.
- `node tools/validate-deck.mjs public/<slug>-slides.html` passes.
- `npm run lint` passes.
- `npm run build` passes.
- The deck loads in a browser and advances forward/backward.
- The room badge appears when the app is running with Vercel KV configured.
- Any new images/assets are committed and referenced with correct relative paths.

