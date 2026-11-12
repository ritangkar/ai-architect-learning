# Task list and status

Legend: Done = implemented and covered by the tests named; Partial = implemented with a stated gap; Not done = absent (reason given). Updated at the end of the build.

## Features

| ID | Feature | Status | Evidence / notes |
|---|---|---|---|
| F01 | Dashboard | Done | level and gates, 17-competency range bars, top-3 recommendations with "Because" and minutes, revision due, case progress, recent activity (relative time, no dates), backup status, dismissible notice. e2e: UJ-01, UJ-02; 360 px test. |
| F02 | Initial assessment | Done | Sections C (first), A, B; resumable; adaptive stop; low-evidence reporting; results with strengths, gaps, over/underconfident, reasons; retake with history. Unit: AC-F02-1, -3, -6. e2e: AC-F02-2, -5. |
| F03 | Adaptive pathway | Done | topological order, depth, reasons, blocking prerequisites, "confirm in 2 questions", override, no dates. Unit and e2e. Build-time cycle/dangling validation (AC-F03-4). |
| F04 | Curriculum navigation | Done | pillar/module/topic browser; filters (pillar, competency, state, hands-on, text) combine and persist in the URL; topic pages show live prerequisite states and unlocked topics. |
| F05 | Lesson pages | Done | objectives, depth switcher (instant, remembered per topic), lesson blocks, resources, check questions, related cases/patterns, cards. Mark read records an event only (e2e). "Lesson text not written yet" state. |
| F06 | Case library and detail | Done (data-limited) | Library with true counts by tier and the catalogue note; all listed filters; separate Simulations collection (empty: none authored). Detail renders only sections present in data with distinct V/I/R/U treatment, decisions table with basis badge, unknowns, prerequisite panel with "Fix gaps first, then return", concept overlay, sources with check dates. The case data has no architecture components, flows or limitations fields, so those sections are not rendered. |
| F07 | Diagrams | Done (see ADR-0005) | build-time SVG with title, description, text alternative, scroll container, Reconstructed label support. 5 lesson diagrams. No case diagrams exist (none are in the data). Mermaid not used. |
| F08 | Assessment engine | Done | five question types, seeded shuffle recorded, explanations with links, attempt fields, build-time topic/competency check. |
| F09 | Competency tracking | Done | competency list with trend and calibration, topic heat map, patterns studied, gaps with actions, regression on failed case exercise (unit + UI). |
| F10 | Resource presentation | Partial | Component with all fields, labels, paid label, video facade (privacy-enhanced domain, click to load, fallback link); link-check script writes `reports/link-report.json`. Content: 1 verified resource; all other resource slots from the blueprint are shown as "link not yet verified". No videos authored. |
| F11 | Revision | Done | boxes and penalties from config, queue persists, snooze and reset. |
| F12 | Recommendations | Done | deterministic, mix with shift explanations, routing with "then return to case X". |
| F13 | Search | Done | Pagefind index built in CI; works under the base path; filters type, pillar, industry; `/` shortcut; no external requests (e2e). |
| F14 | Knowledge map | Done | six preset questions in at most two interactions; optional graph view with list fallback; graph generated at build time. |
| F15 | Progress and gamification | Done | levels from gate evidence, milestones with "earned because", streak hidden by default. |
| F16 | Local persistence | Done | IndexedDB v1, session-only fallback and banner, migration framework with tested v1 to v2 stub, orphans retained and flagged. |
| F17 | Backup and restore | Done | export, validate, preview, replace/merge, pre-import backup, newer schema rejected, rollback; reminders. |
| F18 | Settings and transparency | Done | theme, reduced motion, density, streak, depth default, session hint, raw counts, limitations, typed-confirmation reset. |
| F19 | Sources and freshness | Done | sources page with grade, supports, check date, verify flag and citing pages; freshness page; verify markers on topic and case pages. |
| F20 | Exercises | Done | architecture review (scored), options analysis with Markdown ADR export, discovery drill, requirements critique (scored). 4 draft exercises. |
| AC-A11Y-1/2 | axe and keyboard | Done | axe on every route type in light and dark plus data states: zero serious/critical. Full assessment by keyboard only (e2e). |

## Non-functional requirements

| ID | Status | Notes |
|---|---|---|
| NFR-01 performance | see final report | JS per page is small (largest chunk 15 KB gzip). Lighthouse run result recorded in the final report. |
| NFR-02 accessibility | Done | WCAG 2.2 AA target, axe clean, reduced motion, no colour-only meaning. Screen readers not tested. |
| NFR-03 responsive | Partial | 360 px tested on all route types plus data states; 768, 1100 and 1440 px not separately tested. |
| NFR-04 security | Done | CSP meta, rel noopener, import validation and size limit, sanitised Markdown, secret scan (tree and history) and pre-commit hook. |
| NFR-05 privacy | Done | no third-party requests (e2e blocks them), self-hosted fonts, no analytics. |
| NFR-06 reliability | Partial | session-only fallback, non-destructive import; no per-island error boundary component (islands show an error box if loading fails). |
| NFR-07 maintainability | Done | content separate from logic, schema-validated, engine unit-tested, ADRs, pinned lockfile. |
| NFR-08 compatibility | Partial | tested on Chromium only. |
| NFR-09 content integrity | Done | provenance enforced by the validator; unverified items labelled. |
| NFR-10 scalability | Done by design | content loaded from data; per-route code splitting; search index at build. |

## Unresolved decisions

UD-01 resolved from the git remote (owner `ritangkar`, repository `ai-architect-learning`), to be confirmed by the user. UD-02 to UD-06 remain open content-phase items.
