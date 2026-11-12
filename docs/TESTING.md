# Testing

Everything below is run by CI (`.github/workflows/ci.yml` and `deploy.yml`). The final report of each build states exactly what ran.

## Commands

| Command | What it runs |
|---|---|
| `npm run validate` | Content validators (schemas, cycles, dangling ids, sources, Tier A decisions, question tags, lessons, exercises, config). Exit 1 on any error. |
| `npm test` | Vitest: engine, backup and storage, validators with broken fixtures, rendering, content integrity. |
| `npm run build` | Validate, build graph summary, Astro build, Pagefind index, internal link check under the base path. |
| `npm run test:e2e` | Playwright against `dist/` served by `scripts/serve-dist.mjs` under the real base path. |
| `npm run lhci` | Lighthouse CI budgets on sampled routes (mobile emulation). |
| `npm run audit` | `npm audit --omit=dev --audit-level=high` on shipped dependencies (blocking in CI). The full audit also runs, informationally: at the time of writing its only finding was `basic-ftp` in the Lighthouse CI tooling chain, which is never shipped. |
| `npm run check:links` | External link probe, writes `reports/link-report.json`. Warnings only. |
| `npm run scan:secrets` / `scan:history` | Pattern scan of the working tree or the full git history. Also runs as a pre-commit hook. |

To run browsers locally without `playwright install` set `CHROMIUM_PATH` to a Chromium binary.

## Unit and integration (Vitest)

* `mastery.test.ts`: evidence score, decay, cap, thresholds with boundary cases (mass 3, E 0.5, E 0.7, mass 6), applied-evidence rule (AC-F09-2), mastered conditions, overconfidence, interval, calibration, orphans.
* `assessment.test.ts`: fixed answer set reproduces hand-computed estimates (AC-F02-1), self-rating never changes evidence (AC-F02-3), sampling determinism and stop rule, low evidence (AC-F02-6), depth assignment, scoring for each item type, seeded shuffle.
* `srs.test.ts`: intervals, drops, floors, low-confidence rule, snooze, reset, queue order, configuration.
* `recommender.test.ts`: pathway order on the real 73 topics, gates, determinism, golden hand-verified scores, routing, mix shifts and boundary at 25, regression and its 0.5 boundary.
* `storage-backup.test.ts`: reload with fake IndexedDB, storage failure modes, migration stub, round trip, malformed/truncated/wrong-schema/newer/tampered/oversize rejection, rollback, merge (union and latest wins), reminder boundaries, Ajv cross-check against the handoff schema.
* `validators.test.ts`: in-memory mutations and on-disk broken fixtures run through the CLI for a cycle, a dangling id, a missing source, a V fact with an unlisted source, a Tier A case with fewer than 3 decisions and malformed JSON.
* `render.test.ts`: sanitisation, link rewriting, diagrams, ADR export, content integrity.

## End-to-end (Playwright)

* `journeys.spec.ts`: UJ-01 to UJ-10, resume mid-assessment, depth memory, mark-read does not change mastery, honest empty states, SAP verify markers, filters in the URL, local search under the base path with all non-origin requests blocked.
* `resilience.spec.ts`: reload persistence, IndexedDB missing/blocked, export, wipe and import identical derived state, merge of two browsers, import errors, full assessment by keyboard only, 360 px no horizontal scroll, bottom bar touch targets, deep-link refresh, 404 page, requests stay under the base, pages absent at the server root.
* `a11y.spec.ts`: axe (WCAG 2.0/2.1/2.2 A and AA tags) on every route type in light and dark themes plus states that need data. The test fails on any *serious* or *critical* violation.

## Manual keyboard checklist

1. Tab reaches the skip link first, and it works.
2. Every control is reachable in a logical order and has a visible focus ring.
3. Assessment: arrow keys change the self-rating, Space selects options, Enter submits, focus moves to the next question heading and to the feedback after submit.
4. The "Where this concept is used" dialog traps focus and closes with Escape.
5. The mobile "More" sheet opens with Enter and closes with Escape.

## Not covered by automation

Screen-reader behaviour (NVDA, VoiceOver), real devices, Safari and Firefox (Playwright runs Chromium here), print layouts, and the content's factual accuracy (everything authored is marked draft).
