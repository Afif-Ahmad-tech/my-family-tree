# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary:** one family or household keeping its own family tree. A non-technical family member explores, adds, and corrects people and relationships in a browser, with no account and no server.
- **Secondary:** web developers who embed `family-chart` in their own site and configure it through the documented API.

## Product Purpose

Make a private family tree something a family can own and edit without a service: open the page, see the tree, click a person, add a relative, and back it up as a file. Success means the household's real tree replaces the example data and survives a browser reset through export.

The repository also ships the engine behind that app as an open-source D3 library, so the same rendering and editing behavior is reusable in other projects.

## Positioning

One codebase is both a complete no-account family-tree app and a framework-agnostic library. A neighbor could ship a tree widget; it could not truthfully claim that the app's own UI runs on the same published package with data that never leaves the browser.

## Operating Context

- The app lives in `site/` and is served as a static page; `build-site.js` copies it to `site-dist/` for deployment.
- State persists in `localStorage` under `my-family-tree`; nothing is sent to a backend.
- The family's current tree moves between browsers and machines as a JSON file through Export/Import.
- Photos are chosen from the local device and compressed in the browser before being stored.
- The library is consumed through npm or a script tag, styled with `family-chart/dist/styles/family-chart.css`, and its API is documented in `docs/` and the generated TypeDoc site.

## Capabilities and Constraints

**App (`site/`)**
- Pan/zoom tree canvas; click a person to inspect them.
- View and Edit modes; Edit opens the Family Chart form for adding a person, partner, child, or parent.
- People list with count, per-person detail view, and a relationships index.
- Fit to screen, reset to the bundled example family, export JSON, import JSON, autosave.
- Photo upload with client-side compression; if storage is full the user is told to export a backup first.

**Library (`src/`)**
- D3-based layout and rendering, HTML and SVG cards, `Chart`, `CardHtml`, and `EditTree` entry points, TypeScript types, Cypress tests in `cypress/`.

**Constraints**
- No accounts, login, server, or synchronization of any kind. Local-only is a durable product constraint, not a missing feature.
- `localStorage` quota is the hard ceiling on tree size and photo count.
- The app consumes the built library assets in `site/assets/`; library changes reach the app through a rebuild, not a dev-time import.
- A paid `family-chart-premium` exists as a separate repository (kinship engine, filtering, extra card variants, performance work). It is not part of this product's scope.

## Brand Commitments

- Product name **Family Chart**; the shipped app titles itself **Family Tree** with the subtitle "Explore your family history" and the footer line "Powered by Family Chart".
- Voice is plain, warm, and factual: "Changes save automatically", "Drag to pan · Scroll to zoom · Click a person".
- Logo at `examples/logo.svg`.
- The app is committed to a dark interface (`theme-color` / `color-scheme` set to `#070c12`).

## Evidence on Hand

- Marketing landing page at `site/index.html` (`site/landing.css`); the working app is at `site/app.html` (`site/app.js`, `site/style.css`).
- Working library source in `src/`, build config, and generated assets in `dist/` and `site/assets/`.
- Documentation in `docs/` (quick start, data format, API) and examples in `examples/`.
- Cypress test suite in `cypress/`.
- The "John/Jane Doe" family is example data only. There are no real customer stories, testimonials, usage numbers, or benchmarks; future work must not invent them.

## Product Principles

1. **The family's data stays theirs.** Local-only storage and plain-file export outrank convenience features that would require a server.
2. **Look first, edit second.** The tree is the landing surface; controls stay in the sidebar and out of the canvas.
3. **No dead ends.** Every edit path has a visible exit (Escape, close, cancel) and a way to recover the previous tree (export, reset to example).
4. **The app proves the library.** Anything the app needs should be expressible through the public library API rather than a private fork.
5. **Plain words over genealogy jargon.** Relationship terms are the ones a family uses.

## Accessibility & Inclusion

- Controls are real buttons with labels; mode buttons expose `aria-pressed`, the sidebar toggle exposes `aria-expanded`.
- Escape closes the edit form and open detail modals.
- Icon-only controls carry `aria-hidden` icons plus visible or accessible text.
