# Architect Lab

A professional, backend-free learning portal for becoming an enterprise AI solution architect (SAP CX specialisation). It runs entirely in the browser as a static site on GitHub Pages.

* **Assesses real understanding** with a scenario-weighted initial assessment and check questions; mastery comes only from assessment and exercise evidence, never from "mark complete".
* **Adapts the pathway**: prerequisite-aware ordering, compress/standard/deep depth, routing through gaps and back to the case, regression when a case exercise goes badly.
* **Teaches through cases with explicit provenance**: every case statement is V (verified, with source), I (interpretation), R (reconstructed) or U (unknown).
* **Schedules revision** with spaced boxes (dates schedule reviews only, never curriculum).
* **Keeps everything local** in IndexedDB with portable JSON backup, and falls back to session-only mode if storage is blocked.
* No backend, no accounts, no analytics, no third-party scripts, no API keys, no model calls.

Live site (after the first deployment): **https://ritangkar.github.io/ai-architect-learning/**. To publish it yourself, follow [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md).

## Quick start (development)

Requires Node 22 or later.

```bash
npm install
npm run dev          # http://localhost:4321/ai-architect-learning/
```

```bash
npm run validate     # content validators
npm test             # unit and integration tests
npm run build        # validate, build, search index, internal link check
npm run preview      # serve dist/ exactly like GitHub Pages, under the base path
npm run test:e2e     # Playwright (set CHROMIUM_PATH to use an installed Chromium)
```

`npm install` also enables the pre-commit secret scan (`.githooks/pre-commit`).

The base path comes from `GITHUB_REPOSITORY` in CI, or `SITE_URL` / `BASE_PATH`, or `site.config.json` for local builds. See [ADR-0007](docs/ADRs/0007-base-path-handling.md).

## Where things are

| Path | What |
|---|---|
| `content/` | All content: curriculum, topics and lessons, cases, sources, questions, cards, resources, exercises, diagrams, engine configuration |
| `src/lib/engine/` | Pure, tested scoring, mastery, assessment, review, recommender, pathway, gates |
| `src/lib/storage`, `src/lib/backup` | IndexedDB, migrations, export, import, merge |
| `src/pages`, `src/islands`, `src/components` | Routes and interactive views |
| `scripts/` | `validate-content`, `build-graph`, `check-links`, `scan-secrets`, `serve-dist`, `run-lighthouse` |
| `tests/` | `unit/` (Vitest), `e2e/` (Playwright, axe) |
| `docs/` | Architecture, engine, content guide, testing, deployment guide, ADRs, task list |
| `handoff/` | The original specification package, unmodified |

## Documentation

* [Deployment guide](docs/DEPLOYMENT_GUIDE.md) (written for a first-time publisher)
* [Content guide](docs/CONTENT_GUIDE.md) including the case research protocol and tiering rules
* [Engine reference](docs/ENGINE.md) with every formula and configuration key
* [Architecture](docs/ARCHITECTURE.md) and [decision records](docs/ADRs/README.md)
* [Testing](docs/TESTING.md)
* [Task list and status](docs/TASKS.md)

## Honest status

Content arrives in phases and the app shows true counts and honest empty states. Everything authored here (lessons, questions, cards, exercises) is marked **draft** until reviewed. SAP availability and pricing statements are time-sensitive and unverified in this portal; see the Freshness page.
