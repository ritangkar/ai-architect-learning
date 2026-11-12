# Deliverable D (Part 4): Functional and Technical Specification
AI Solution Architect Learning Platform (working name: "Architect Lab"; name is configurable). Draft v0.1, 2026-11-12.

Labels: **[REQ]** confirmed by you. **[REC]** my recommendation (change if you disagree). **[DEFAULT]** a tunable default stored in configuration, not hard-coded.
Inputs to be supplied at build time (not hard-coded anywhere): `GITHUB_OWNER`, `REPO_NAME`. Everything that depends on them derives from `SITE_URL` and `BASE_PATH` (see section 14).

---

## 1. Scope

A static, backend-free, GitHub Pages learning portal that: assesses current knowledge, builds an adaptive pathway across three pillars, teaches topics, teaches architecture through a library of real-world cases with explicit provenance, tracks competency from assessment evidence (never from "completed"), schedules revision, and keeps all progress in the browser with portable JSON backup. [REQ]

Out of scope for v1 (see section 19): backend, accounts, cross-device sync, embedded API keys, in-portal calls to paid model APIs, user-generated content sharing, analytics that transmit user data.

## 2. Content package the app consumes

The application reads these validated content sources (all under `/content`, none embedded in code). Files already produced:
- `curriculum_blueprint.json` (v0.2): pillars, modules, 73 topics, competencies, patterns, resource sources, depth model, levels; topics carry `verified_case_ids`.
- `case_catalog_batch1.json`: 14 cases with tiers, tagged facts, decisions.
- `PART1_source_register.json`: source register (22 sources) plus 8 sources added in the case catalog.
To be produced by the content phase (the app must work with whatever subset exists and show true counts): lesson Markdown per topic, question bank, revision cards, resource entries, further case batches, full case walkthroughs.

Rule: the app must **never** hard-code counts such as "100+ cases"; counts come from the data. [REQ]

## 3. Personas and user journeys

Single persona: the learner (experienced enterprise/SAP Commerce engineer, 2 hours/day, mobile and desktop use). No admin persona; content is edited in Git.

| ID | Journey | Steps |
|---|---|---|
| UJ-01 | First visit and initial assessment | Landing explains purpose and data-in-browser limits; start assessment; complete sections A, B, C (resumable); see profile; accept pathway |
| UJ-02 | Daily session | Dashboard shows "Recommended next" with reasons and an adjustable session mix; learner picks the recommendation or anything else; finishes; sees updated competencies and revision queue |
| UJ-03 | Case with prerequisite gap | Open case; system lists prerequisite topics with current state; "Fix gaps first" routes through topics; "Return to case" resumes at the stored position with a concept overlay |
| UJ-04 | Topic study | Choose depth (compress, standard, deep; pre-selected by profile); read lesson; use resources; take check questions; mastery updates only from assessment evidence |
| UJ-05 | Revision | Review queue shows due cards and missed questions; answer with confidence; schedule updates |
| UJ-06 | Architecture review exercise | Read a design; mark weaknesses from a structured checklist and free-text notes; compare with model findings; self-score by rubric |
| UJ-07 | Knowledge map exploration | Query: "cases that demonstrate pattern X", "topics before case Y", "my weakest competencies" |
| UJ-08 | Search and filter | Global search; case library filters |
| UJ-09 | Backup and restore | Export JSON; later import into same or another browser; choose replace or merge |
| UJ-10 | Content freshness check | View SAP topics and cases by status and last-verified date; stale items flagged |

## 4. Information architecture and routes

All links are base-path aware (section 14). Static routes: [REC]
`/` Dashboard (or landing if no profile) · `/assessment/` · `/assessment/results/` · `/pathway/` · `/curriculum/` · `/curriculum/{module}/` · `/topic/{id}/` · `/cases/` · `/case/{id}/` · `/patterns/` · `/pattern/{id}/` · `/competencies/` · `/map/` · `/review/` · `/exercise/{id}/` · `/progress/` · `/sources/` · `/freshness/` · `/settings/` (backup, restore, reset, preferences) · `/about/` (method, provenance legend, limitations) · `/404.html`.
Primary navigation: Dashboard, Pathway, Curriculum, Cases, Review, Map, Progress; utility: Search, Settings. Mobile: bottom bar for the first five plus a "More" sheet.

Acceptance (AC-IA): every route renders at `BASE_PATH`, deep links work on refresh through GitHub Pages (static HTML per route, no client-only routes), and the 404 page links home using the base path.

## 5. Feature specifications and acceptance criteria

### F01 Dashboard
Shows: current level and next gate; competency radar or bars (17 competencies) with confidence ranges; recommended next activities (top 3, each with a reason string and estimated minutes); revision due count; case progress; recent activity; backup status (last export date, warning after 7 days or 25 new attempts [DEFAULT]); data-limitation notice dismissible once per version.
- AC-F01-1: With no data the dashboard routes to the assessment invitation, not an empty chart.
- AC-F01-2: Every recommendation displays "Because ..." text derived from the scoring factors in section 8.4.
- AC-F01-3: Level, gates and counts are computed from data, not hard-coded.
- AC-F01-4: Works at 360 px width without horizontal scrolling.

### F02 Initial assessment
Structure [REQ]: Section A concept MCQs (25% weight), Section B scenario architecture questions (55%), Section C self-assessment (20% as calibration, not competence). Resumable, saved after every answer, abandon and restart allowed. Scenario items: scenario text, constraints, options or criteria, rationale selection, model answer revealed after submit. Free-text justification is optional and self-scored against criteria; the UI states plainly that free text is not machine-graded. Adaptive stop: after at least 3 items per competency, stop sampling a competency if the estimate's 80% interval lies fully above 0.8 or below 0.4 [DEFAULT].
Output: per-competency estimate with interval; per-topic state; calibration index per competency (mean self-confidence minus accuracy); depth assignments (compress, standard, deep); first pathway.
- AC-F02-1: Score contributions use the weights above; a unit test with a fixed answer set reproduces expected competency estimates.
- AC-F02-2: Refreshing mid-assessment resumes at the same question.
- AC-F02-3: Self-assessment never raises a mastery state; it only alters calibration and order of sampling.
- AC-F02-4: Results page lists strengths, gaps, overconfident and underconfident competencies, and the reasons topics were compressed or deepened.
- AC-F02-5: Retaking is allowed; history of assessment runs is preserved.
- AC-F02-6: If the question bank has fewer items than the target for a competency, the assessment still runs and reports "low evidence" for that competency.

### F03 Adaptive pathway
Ordered list built from the prerequisite graph and profile: topics grouped by module, each with state, assigned depth, reason, and blocking prerequisites. Learner may open any topic (advisory, not locked) but sees a prerequisite warning. Pathway recalculates after every assessment event.
- AC-F03-1: A topic is never listed before its prerequisites unless the learner overrides.
- AC-F03-2: Proficient topics appear compressed with a "confirm in 2 questions" step.
- AC-F03-3: No calendar dates anywhere in the pathway view. [REQ]
- AC-F03-4: Build-time validation fails on cycles or dangling prerequisites.

### F04 Curriculum navigation
Pillar → module → topic browser with state badges, depth, competencies, status (for SAP topics: availability note and last-verified date), related cases and patterns, and filter by pillar, competency, state, hands-on level.
- AC-F04-1: Filters combine (AND) and persist in the URL query string.
- AC-F04-2: Every topic page shows prerequisites with live state and "next topics unlocked".

### F05 Lesson pages
Sections in order: objectives; depth switcher; lesson body (Markdown with diagrams); "why this matters to an architect"; worked example; resources (F10); check questions; related cases and patterns; revision cards created. Lesson content is Markdown with frontmatter validated against the schema.
- AC-F05-1: Marking a lesson read records a `lessonViewed` event only; it does not change mastery. [REQ]
- AC-F05-2: Depth switch is instant and remembered per topic.
- AC-F05-3: If lesson body is absent (content phase not done), the page shows objectives, resources and questions and a clear "lesson text not written yet" banner, never filler text.

### F06 Case study library and detail
Library: cards with company, industry, categories, tier badge, patterns, prerequisite state, documentation depth; filters by industry, category, pattern, technology, tier, evidence depth, prerequisite readiness, SAP relevance; search; counts computed.
Detail page sections (render only sections that exist; never fabricate): header with tier and provenance legend; business problem; verified facts (V) with source chips; architecture components; flows; decisions table (selected, alternatives, reasoning, basis badge documented or independent analysis); interpretations (I) styled distinctly; reconstructed architecture (R) with banner (none in batch 1); unknowns (U) as a visible list; limitations; lessons; adaptation guidance; review exercise; prerequisite panel with "Fix gaps first, then return"; concept overlay ("where each concept is used"); sources with what each supports and check date.
- AC-F06-1: Every V claim shows at least one source ID resolvable on `/sources/`.
- AC-F06-2: V, I, R, U use distinct labels and colours plus text/icon (not colour alone).
- AC-F06-3: Build fails if a case lacks sources, a V fact cites a source not in its source list, or a Tier A case has fewer than 3 decisions.
- AC-F06-4: Simulations render with a persistent "SIMULATION" badge and are listed in a separate collection.
- AC-F06-5: The library shows true counts by tier and states when the catalog is smaller than any aspirational figure.
- AC-F06-6: Diagrams reconstructed by Claude Code from text are labelled "Reconstructed"; source diagrams are linked, not copied.

### F07 Architecture diagrams and visual explanations
Diagrams authored as Mermaid or inline SVG in Markdown; rendered at build time to static SVG [REC] to avoid runtime cost; accessible with title, description, and a text alternative list of nodes and edges.
- AC-F07-1: Each diagram has alt text; each reconstructed one carries the label.
- AC-F07-2: Diagrams reflow or scroll within a container on mobile without breaking layout.

### F08 Assessment engine (shared by F02, quizzes, exercises)
Question types: `mcq` (single and multiple), `scenario` (choose, rank, justify by criteria), `decision_comparison` (fill a weighted matrix and compare to model), `architecture_review` (mark flaws from a checklist plus free-text), `card` (recall).
Common fields: id, type, topics, competencies, difficulty 1-5, stem, options, correct, explanation, model answer, rubric criteria with points, tags, sourceCaseId (optional), status.
- AC-F08-1: Options are shuffled with a seeded shuffle recorded in the attempt.
- AC-F08-2: Explanations show after submission, with links back to topic and case.
- AC-F08-3: Each attempt stores timestamp, item id, content version, response, score, confidence rating (1-5), time spent.
- AC-F08-4: Every question must map to at least one topic and competency (build-time check).

### F09 Knowledge-gap and competency tracking
Per-topic state and per-competency estimate computed from evidence (section 8). Views: competency list with trend, topic heat map, pattern coverage ("patterns studied": a pattern counts as studied when at least one case demonstrating it has been completed and its review exercise passed), gaps list with suggested actions.
- AC-F09-1: Mastery logic matches section 8 and is covered by unit tests.
- AC-F09-2: A topic cannot be proficient or mastered with zero applied-item evidence.
- AC-F09-3: Later failed case exercises reduce related topic estimates and can reopen a topic (state regression allowed) and queue revision.

### F10 Resource presentation
Each resource: title, source type (from `resource_sources`), URL, why useful, what to focus on, relation to the objective, free or paid, language, last checked date, status (`verified`, `to_verify`, `broken`). Videos use a click-to-load facade with the privacy-enhanced embed domain and a visible fallback link; no third-party scripts load before click.
- AC-F10-1: Resources with `to_verify` status render a "link not yet verified" label.
- AC-F10-2: A build-time link-check script reports external URL failures as warnings and writes a report; it never silently drops resources.
- AC-F10-3: Paid resources are labelled.

### F11 Revision and spaced review
Cards generated from topics and from missed questions. Leitner-style boxes with intervals [1, 3, 7, 16, 35, 70] days [DEFAULT]; correct moves up one box, incorrect drops two (min box 1) [DEFAULT]; low-confidence correct answers do not advance. Review queue ordered by overdue time and competency weakness. These dates schedule revisions only and are not curriculum deadlines. [REQ]
- AC-F11-1: Intervals and penalties come from configuration.
- AC-F11-2: Queue persists across sessions; overdue items accumulate without penalty text.
- AC-F11-3: The learner can reset or snooze a card.

### F12 Recommendations ("what next")
See section 8.4. Always show at least one alternative per slot and a "choose your own" link.
- AC-F12-1: Deterministic given the same data and config (seeded tie-break).
- AC-F12-2: Recommendation includes mix balance (learn, case, exercise, revise) and explains when balance shifted.
- AC-F12-3: When prerequisites for a chosen case are in gap, the recommendation is the prerequisite topic with "then return to case X".

### F13 Search and filtering
Client-side full-text search (Pagefind [REC]) over topics, lessons, cases, patterns, resources; scoped filters (type, pillar, industry); keyboard shortcut `/`.
- AC-F13-1: Index built in CI; search works under the base path.
- AC-F13-2: No query leaves the browser.

### F14 Knowledge map
Interactive map linking topics, prerequisites, cases, patterns, competencies; presets answer the questions in the brief: cases demonstrating a pattern; cases using multi-agent orchestration; topics to learn before case X; patterns studied; weakest competencies; what to learn next. Implemented as filterable lists plus an optional graph view; the list view is the accessible primary.
- AC-F14-1: Each of the six sample questions is answerable in two interactions or fewer.
- AC-F14-2: Graph view degrades to list when JavaScript graph rendering is unavailable.
- AC-F14-3: Graph data generated at build time from validated content.

### F15 Progress tracking and gamification (subtle)
Levels L0-L5 with gates (blueprint), milestone achievements (first assessment, first case with passed review exercise, first pillar milestones, all-competency developing, etc.), completion indicators, streak counter (days with any assessed activity, hidden by default; toggle in settings) [REC]. Visual tone professional: no confetti, mascots or points inflation. Milestones state evidence ("earned because ...").
- AC-F15-1: Streak never blocks or scolds; missed days display no penalty.
- AC-F15-2: Level changes only from gate evidence.

### F16 Local persistence
IndexedDB database `architect-lab` schema version 1 [REC]. Stores: `meta` (schema version, content version seen, install id), `profile` (assessment runs, calibration), `attempts` (append-only), `topicState` (derived cache), `cardState`, `caseProgress` (viewed sections, resume pointers, exercise results), `notes`, `settings`. Derived state is recomputable from attempts so corruption can be repaired.
localStorage only for small UI preferences (theme, collapsed panels) with try/catch and in-memory fallback. If IndexedDB is unavailable (private mode, blocked), the app runs in session-only mode and shows a persistent warning with an export button.
- AC-F16-1: Reload preserves state.
- AC-F16-2: Simulated storage failure (test) triggers session-only banner, no crash.
- AC-F16-3: Schema migration framework exists with at least a tested v1→v2 stub.
- AC-F16-4: When content IDs are removed or renamed, orphaned records are retained, flagged, and excluded from active metrics, never deleted silently.

### F17 Backup and restore
Export: single JSON file `architect-lab-progress-YYYY-MM-DD.json` with `{schema:"architect-lab-progress", version, exportedAt, contentVersion, installId, data:{...}, checksum}`. Import: validate schema and checksum; preview counts; choose Replace or Merge; merge by record id with latest-timestamp-wins for mutable stores and union for attempts; refuse files from a newer schema version with clear message; always offer to download an automatic pre-import backup. Plain-language notice: data lives only in this browser profile on this device; clearing site data or switching device loses it unless restored from a backup; there is no automatic sync. [REQ]
- AC-F17-1: Round-trip test: export, wipe, import reproduces identical derived state.
- AC-F17-2: Malformed, truncated or wrong-schema files are rejected with a specific message and change nothing.
- AC-F17-3: Merge test with two diverging exports yields union of attempts and no duplicate attempt ids.
- AC-F17-4: Backup reminder logic per F01.

### F18 Settings and transparency
Theme (system, light, dark), reduced motion, density, streak visibility, depth defaults, session-length hint (default 120 minutes, advisory), reset-all with typed confirmation, view raw stored data counts, data-limitations text.

### F19 Sources and freshness
`/sources/` lists every source with grade (primary, partner, secondary, vendor), what it supports, check date, verify flag. `/freshness/` lists SAP and fast-moving topics by status and last-verified date, highlighting items older than 90 days or flagged `verify` [DEFAULT].
- AC-F19-1: Items marked `verify` display a visible "verify before use" marker on the topic or case page that cites them.

### F20 Exercises
Types: architecture review, options analysis (4-5 options against weighted criteria with ADR output), discovery question drill, requirements critique. Work saved locally; exported with progress; printable as Markdown download of the learner's ADR. No external calls.
- AC-F20-1: ADR export produces valid Markdown with decision, options, criteria, trade-offs.

## 6. Data model (summary; full JSON Schemas are produced in Part 5)

Entities: Pillar, Module, Topic, Competency, Pattern, Resource, ResourceSource, Case, CaseFact (text, sourceId, tag), CaseDecision, Source, Question, Rubric, Card, Level, Milestone. Relationships: Topic→prerequisites(Topic), Topic→competencies, Topic→patterns, Topic↔Case (prereq and demonstrated), Case→patterns, Case→sources, Question→topics and competencies, Card→topic. Build step generates `graph.json` and validation report.

Build-time validations (must fail CI): unknown IDs; cycles; topics without competency; questions without topic and competency; cases without sources; V facts with unlisted source; Tier A with fewer than 3 decisions; SAP topic without status note and last-verified date once lessons exist; duplicate IDs; internal links not under base path.

## 7. Content schemas (frontmatter essentials)

Lesson: `topicId, depthVariants{compress,standard,deep}, lastReviewed, sources[], diagrams[]`.
Case walkthrough: the 27 sections of the brief map to optional blocks; each block's claims carry tags V/I/R/U and source IDs.
Resource: fields in F10.
Question: fields in F08.
Config (`/content/config/engine.json`): all weights, thresholds, intervals, gates, mix targets.

## 8. Assessment, mastery and adaptive engine (deterministic, no model calls)

All numbers are [DEFAULT] values in `engine.json`.

### 8.1 Evidence weights
Item type weight: mcq 1; scenario 3; decision_comparison 3; architecture_review 3; card 0.5. Recency: each older attempt for the topic is multiplied by 0.85 per subsequent attempt (cap at last 12). Score per item in [0,1]; rubric items score = earned/total points.

### 8.2 Topic evidence score
E = Σ(w·s·decay)/Σ(w·decay). Evidence mass M = Σ(w·decay).
- **unknown**: M < 3
- **gap**: E < 0.50
- **developing**: 0.50 ≤ E < 0.70
- **proficient**: E ≥ 0.70, M ≥ 6, and at least one applied item (scenario, decision_comparison, architecture_review) with score ≥ 0.70
- **mastered**: E ≥ 0.85, at least two applied items ≥ 0.80 on different days, and at least one correct review ≥ 7 days after first proficient
Lesson views, video views and "mark complete" contribute nothing. [REQ]
Overconfidence: for items with confidence 4-5 and score < 0.4, apply an additional ×1.5 weight to that attempt's negative contribution [DEFAULT].

### 8.3 Competency estimate
Competency score = evidence-weighted mean of its topics' E (topics with state unknown excluded but counted as "coverage"), with interval from item count: half-width ≈ 0.5/√(M). Competency state uses the same thresholds. Calibration = mean(confidence/5) − mean(score) over last 20 items.

### 8.4 Recommender
Candidate activities: next topic, deepen topic, case, exercise, review set. Score = 0.35·gapSeverity + 0.25·unblockValue + 0.15·caseRelevance + 0.15·reviewDue + 0.10·levelFit, each term normalised 0-1.
- gapSeverity: (1 − E) for the topic's weakest competency, 1 for gap, 0.7 for unknown.
- unblockValue: share of locked or warned downstream topics and cases this activity unblocks.
- caseRelevance: strength of links to the learner's current or queued case.
- reviewDue: overdue cards for the topic normalised.
- levelFit: 1 if it advances the current level gate, else 0.5.
Session mix target [DEFAULT]: learn 40%, case 30%, exercise 15%, revise 15%, shifted automatically: +20 points to revise when due cards exceed 25; +15 to learn when more than 3 topics are in gap; +10 to case when all prerequisites of a queued case are proficient. Tie-break by seeded hash of date-free key to keep results stable.
Routing rule: if a chosen case has any prerequisite in unknown or gap, recommend the earliest such prerequisite at depth deep (gap) or standard (unknown), store a `resume` pointer `{caseId, section}`, and on completion of the prerequisite's assessment show "Return to case".
Regression: when a case exercise score < 0.5, link missed concepts to topics, subtract evidence, queue cards, and surface "Revisit before continuing".

### 8.5 Levels and gates
From blueprint `levels`; threshold numbers live in config and can be tuned.

### 8.6 Limits to disclose in UI
Scenario justification is self-scored; confidence intervals widen with few items; thresholds are heuristics, not certifications.

## 9. UI/UX and design system [REC]

Direction: "serious professional workbench". Calm neutral palette with one restrained accent; high-contrast text; generous reading measure (65-75 characters); no stock gradients or generic hero sections; data-dense but quiet dashboards. Typography: self-hosted variable fonts (a readable serif or humanist sans for lessons, a clean sans for UI, mono for code) loaded with `font-display: swap`; no external font CDN. Tokens as CSS custom properties; light and dark themes with explicit backgrounds; spacing scale 4/8; radii small; focus rings clearly visible. Components: card, badge (tier, provenance, state), table (responsive), accordion, tabs, stepper, progress bar, radar or bar chart (SVG), callout (V/I/R/U), diagram container, quiz panel, resource row, empty state, toast. Provenance colours must pair with icons and text. Respect `prefers-reduced-motion` and `prefers-color-scheme`. Avoid childish elements. [REQ]

Responsive: breakpoints 360, 768, 1100, 1440; mobile-first; tables become stacked cards; touch targets ≥ 44 px.

## 10. Accessibility (WCAG 2.2 AA target) [REC]
Semantic landmarks; skip link; keyboard-operable everything; visible focus; ARIA only where needed; live regions for quiz feedback; no colour-only meaning; contrast ≥ 4.5:1 text; headings hierarchy; form labels; reduced motion; diagrams with text alternatives; automated axe checks in CI plus a manual keyboard checklist in docs.
- AC-A11Y-1: axe reports zero serious or critical violations on every route type in CI.
- AC-A11Y-2: Full assessment completable by keyboard only.

## 11. Performance [REC]
Budgets (mobile, throttled): LCP ≤ 2.5 s on key pages; initial JS ≤ 120 KB gzip on content pages; interactive islands loaded on demand; total page weight ≤ 500 KB excluding video; images optimised; no layout shift; fonts subset. Lighthouse CI thresholds: performance ≥ 90, accessibility ≥ 95 on sampled routes [DEFAULT]. Large datasets (question bank, graph) are code-split and loaded per route.

## 12. Security and privacy [REQ + REC]
- No secrets, API keys, tokens or credentials in repo, bundle, config or Git history; secret scanning in CI (a pattern scan script plus a scanning action) and a pre-commit check.
- No backend; no network calls except static assets, optional click-to-load video embeds, and external links.
- Strict Content-Security-Policy via meta tag (self scripts and styles; frame-src limited to the privacy-enhanced video domain; no inline script without hashes); `rel="noopener noreferrer"` on external links; no third-party analytics.
- Imported JSON treated as untrusted: schema-validated, size-limited (default 25 MB), never evaluated; rendered with escaping; Markdown sanitised.
- Optional bring-your-own-key exercises are **documentation only** in v1: instructions to run experiments in the learner's own environment, with cost and key-handling guidance. The portal never asks for or stores keys. [REQ]
- Dependency policy: minimal, pinned via lockfile, automated vulnerability audit in CI.
- Privacy statement page: all data stays on device.

## 13. Error handling
Content validation errors fail the build with file and field. Runtime: error boundary per island with fallback text and "export your data" link; import errors specific and non-destructive; unavailable storage banner; broken external links flagged not hidden; offline: static pages work after first load; service worker is optional [REC: not in v1 to limit cache-staleness risk].

## 14. Technical architecture [REC]

Stack: Astro (static output) with TypeScript; content collections validated by Zod from JSON and Markdown; Preact or React islands for assessment, dashboard, map; Pagefind search; Mermaid prerendered to SVG at build; plain CSS with tokens (Tailwind acceptable if the implementer prefers; decision recorded in an ADR); Vitest for unit tests; Playwright for end-to-end; axe for accessibility; Lighthouse CI.
GitHub Pages project site: `site = https://{GITHUB_OWNER}.github.io`, `base = /{REPO_NAME}` read from environment variables with a documented default; all internal URLs generated through one helper; assets under base; no absolute `/` links. If the repository is named `{owner}.github.io` (user site) the base is `/`. Claude Code must detect the actual remote and set these, not assume. Deployment via GitHub Actions with Pages source "GitHub Actions": build job (checkout, install from lockfile, validate content, test, build, link-check report, upload artifact) and deploy job (deploy-pages) with minimal permissions (contents read, pages write, id-token write). Action versions must be checked for currency at build time.

Repository structure:
```
/
  README.md
  docs/ DEPLOYMENT_GUIDE.md, CONTENT_GUIDE.md, ARCHITECTURE.md, ENGINE.md, TESTING.md, ADRs/
  content/ config/engine.json | curriculum/ | topics/{id}/lesson.md | cases/{id}.md|json | questions/ | cards/ | resources/ | sources/ | patterns/
  src/ pages/ components/ islands/ lib/ (engine, storage, backup, search) styles/ layouts/
  scripts/ validate-content.ts, build-graph.ts, check-links.ts, scan-secrets.ts
  tests/ unit/ e2e/ fixtures/
  .github/workflows/ deploy.yml, ci.yml
  public/ fonts/ icons/
```

## 15. Testing requirements
Unit: scoring, mastery thresholds (boundary cases), decay, calibration, recommender (golden outputs), routing rule, spaced-repetition, backup round-trip and merge, migration, validation scripts. Integration: content validators with deliberately broken fixtures (cycle, dangling id, missing source). E2E (Playwright, run against a build served under the real base path): UJ-01 through UJ-10; reload persistence; storage-failure mode; import errors; keyboard-only assessment; mobile viewport. Accessibility: axe on every route type. Performance: Lighthouse CI. Deployment smoke test: after deploy, fetch live URL and verify home and one deep link return 200. Claude Code must report which tests ran and results; it must not claim coverage it did not execute.

## 16. Documentation requirements
README; ARCHITECTURE; CONTENT_GUIDE (how to add topic, case, question, resource; tiering and provenance rules; case research protocol); ENGINE (all formulas and config); TESTING; ADRs for stack, persistence, search, base path.
**DEPLOYMENT_GUIDE.md (Deliverable G)** for a novice: open repository → Settings → Pages; choose Source: GitHub Actions; what to select and save; trigger first run via push to `main` or Actions → Run workflow; watch Actions tab; where the final URL appears (Pages settings and deployment job summary); expected URL `https://<owner>.github.io/<repo>/` with actual values filled in after remote detection; verification checklist (home loads, deep link refresh, search, assessment, export); troubleshooting (404 page, blank page with missing CSS indicating wrong base, Actions permission errors, Pages not enabled, build failing on validation, environment protection rules, case-sensitive paths, cache delays); how to update (edit content, commit, push, wait); how to roll back; how to back up progress before big updates. Screenshots optional; guide must stand alone in text.

## 17. Case research protocol (for the content phase)
For each candidate: (1) pick by coverage gap; (2) find builder-authored primary source; (3) read full page, not a snippet; (4) record only stated facts, paraphrased, each with source ID; (5) list Unknowns explicitly; (6) write decisions with `documented` or `independent analysis` basis; (7) tier honestly (A needs a technical primary source; marketing or editorial caps at C); (8) never copy diagrams or long text; (9) quotes under 15 words, one per source; (10) validate against schema; (11) record check date. Diversity rules: ≤15% of catalog per company; industry and category coverage tracked on `/cases/`; prefer SAP-relevant cases; simulations kept separate and labelled.

## 18. Content delivery order [REC]
Phase 1 app shell, schemas, validators, engine, persistence, backup, deployment. Phase 2 initial assessment bank (enough items for all 17 competencies) and Pillar 1 core lessons. Phase 3 Pillar 2 lessons with verified SAP status. Phase 4 Pillar 3 lessons. Phase 5 case walkthroughs for the priority cases and further catalog batches. The app ships usable at Phase 1 with honest empty-state banners.

## 19. Explicitly out of scope (v1)
Backend or database server; user accounts; cross-device sync; in-portal LLM calls or API keys; automated grading of free text by a model; multi-user features; payments; mobile native app; analytics collection; push notifications; service-worker offline mode; embedding third-party SAP system data.

## 20. Assumptions and unresolved decisions
- GitHub owner and repo name: supplied by you; the build derives paths from them. Unresolved until attached.
- Stack choice is a recommendation; implementer must record an ADR if deviating.
- Gate thresholds, weights, intervals are defaults to tune after real use.
- Content volume (lessons, ~290 MCQs, ~134 scenarios, 438 cards in blueprint targets) will arrive in phases; the app must handle partial content.
- SAP availability facts are time-sensitive; every SAP topic requires status plus last-verified date and verification before publication.
- Legal and regulatory topics are educational, not legal advice; EU and other regulatory statuses must be verified at authoring time.
- Self-scored scenario justification is a known limitation of a static site.

## 21. Requirement traceability (summary; full matrix in Part 7)
Brief §4 pillars → blueprint and F04; §5 cases and provenance → F06, section 17; §6 NFRs → topics T1.5.x and F20; §7 adaptive → F02, F03, F08, F09, F11, F12, section 8; §8 daily experience → F01, F12 (no dates); §10 constraints → F20, section 12; §11 resources → F10; §12 portal → all F; §14 knowledge map → F14; §15 quality → sections 9-11; Deliverable G → section 16.
