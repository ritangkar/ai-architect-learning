# Architecture

Architect Lab is a static site (Astro, TypeScript, Preact islands) with all state in the browser. Decisions are recorded in `docs/ADRs/`.

```
content/ (JSON + Markdown)  --load+validate-->  src/lib/content  --+--> Astro pages (static HTML per route)
                                                                   +--> /data/*.json bundles (core, questions, graph, exercises, cases-detail)
browser:  islands (Preact) -> src/lib/app/state.ts (AppState) -> src/lib/engine (pure) 
                                                    |-> src/lib/storage (IndexedDB or memory) 
                                                    '-> src/lib/backup (export, import, merge)
```

## Layers

* **Content** (`content/`): data only. Validated by Zod schemas and relational validators (`src/lib/content/validate.ts`) in `npm run validate`, in the Astro build, and in tests with broken fixtures.
* **Engine** (`src/lib/engine`): pure functions, no I/O, no randomness. Scoring, mastery, assessment sampling and results, spaced review, learner state, level gates, pathway, recommender, routing and regression. Fully unit-tested. See `docs/ENGINE.md`.
* **Storage** (`src/lib/storage`): IndexedDB database `architect-lab` v1 (stores `meta`, `profile`, `attempts`, `topicState`, `cardState`, `caseProgress`, `notes`, `events`, `settings`), a memory fallback, a migration registry. Attempts are append-only; `topicState` is a derived cache; everything is recomputed from attempts on load.
* **Backup** (`src/lib/backup`): versioned export with a SHA-256 checksum, strict import validation, size limit, replace or merge, rollback on failure, reminder logic.
* **App state** (`src/lib/app/state.ts`): one singleton that loads core data and storage, exposes actions (record attempt, review card, case exercise, import) and recomputes the learner state after each change. If a write fails it switches to session-only mode and raises the banner.
* **Pages and islands**: stateless content (topics, cases, patterns, sources, about) is rendered at build time; stateful views are client-only islands. Every internal URL comes from `src/lib/url.ts`.

## Build and deploy

`npm run build` = validate content, write a graph summary, `astro build`, Pagefind index, internal link check. `deploy.yml` builds, tests and publishes `dist/` to GitHub Pages with minimal permissions. See `docs/DEPLOYMENT_GUIDE.md`.

## Security and privacy

No secrets (secret scan in CI and pre-commit), no backend, no analytics, no third-party scripts or fonts. CSP meta policy with script hashes. Imported files are untrusted (size limit, schema, checksum, never evaluated); Markdown is sanitised; external links use `rel="noopener noreferrer"`; video embeds (when added) are click-to-load from the privacy-enhanced domain.

## Task list (kept current in `docs/TASKS.md`)

Feature F01 to F20 and NFR status is tracked in `docs/TASKS.md`.
