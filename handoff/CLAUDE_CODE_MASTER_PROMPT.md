# Claude Code Master Prompt: Build the Architect Lab Learning Platform

You are Claude Code, implementing a complete personal learning portal in the connected GitHub repository. Read this whole prompt, then `00_MANIFEST.json`, then `project_spec.json`, before writing any code. The specification package is the source of truth. You must not rediscover or reduce the requirements.

## 0. Inputs you will be given
The user attaches two values in this session: `GITHUB_OWNER` and `REPO_NAME`. If either is missing, ask for it once, then continue. Never guess them. Never hard-code them anywhere except configuration files and the deployment guide's filled-in example.

## 1. Mission
Build a professional, interactive, backend-free learning management site for a person becoming an enterprise AI Solution Architect (SAP CX specialisation). It runs on GitHub Pages as a project site, assesses real understanding, adapts the learning pathway, teaches through real-world case studies with explicit provenance, tracks competency from evidence, schedules revision, and stores progress in the browser with portable JSON backup. This is a complete application, not a prototype, not a mockup.

## 2. Package you receive
- `project_spec.json`: all requirements, acceptance criteria (20 features with 60 feature-level criteria, plus 2 cross-cutting criteria, 62 in total), NFRs, stack, repository structure, deployment, testing, documentation, out-of-scope, assumptions, unresolved decisions.
- `config/engine.json`: all mastery, recommender, assessment and spaced-review parameters. Load it at runtime; do not hard-code its values.
- `schemas/*.schema.json`: JSON Schemas for topic, case, question, resource, card, source, lesson frontmatter, progress export (plus an example export).
- `content/curriculum_blueprint.json`: 3 pillars, 13 modules, 73 topics, 17 competencies, 20 patterns, levels, depth model.
- `content/case_catalog_batch1.json`: 14 cases with tagged facts (V/I/U), decisions, tiers, backlog and gaps.
- `content/source_register.json`: 30 sources with grades and check dates.
- `docs/`: research report, curriculum blueprint, catalog, functional specification (human-readable detail behind the JSON).
Relationships and load order are in `00_MANIFEST.json`.

## 3. Non-negotiable rules
1. **No silent omission.** Every feature F01-F20 and every acceptance criterion must be implemented or explicitly listed in your final report as not done, with the reason. Do not drop, defer or water down a feature without saying so.
2. **No placeholder content standing in for functionality.** Lorem ipsum, fake data, "coming soon" panels that pretend to work, and stub engines are forbidden. Where content is genuinely not authored yet, show the specified honest empty state (for example "lesson text not written yet") and say so in the report.
3. **No claiming unimplemented or untested work is complete.** State exactly what you ran and the results. If you did not run a test, say you did not.
4. **No fabricated content.** Do not invent case facts, metrics, diagrams, technology choices, source URLs, video links, SAP availability statements or question answers that are not in the package. Content you author (lessons, questions, cards, resources) must be accurate, source-backed where factual, and flagged `status: draft` until reviewed. Anything you cannot verify gets `to_verify`.
5. **No secrets.** No API keys, tokens or credentials in code, config, bundles or Git history. The portal never calls paid model APIs. Optional bring-your-own-key exercises are documentation only.
6. **No backend.** Everything runs in the browser on static hosting.
7. **Content separate from logic.** Content lives under `/content`; code under `/src`. Counts shown in the UI are computed from data, never hard-coded.
8. **Mastery rule.** Lesson views, video views and "mark complete" never raise mastery. Only assessment and exercise evidence does, per `engine.json`.
9. **No calendar dates or deadlines** in the curriculum or pathway. Dates are allowed only for revision scheduling, backup reminders and "last verified" stamps.
10. **Provenance is sacred.** Verified (V), Interpretation (I), Reconstructed (R), Unknown (U) are always visually and textually distinct, and every V claim shows its source.
11. If the spec seems contradictory or blocked, stop that item, choose the safest reading, record it as an ADR, and tell the user in the final report. Ask the user only if a blocker prevents progress.

## 4. Step-by-step workflow

### Step 1: Inspect the repository and confirm deployment context
- Inspect the working tree, existing files, default branch, remotes (`git remote -v`), and any existing Pages configuration or workflows. Do not overwrite unrelated existing work; if the repo is non-empty, list what exists and integrate safely.
- Compute and display: `GITHUB_OWNER`, `REPO_NAME`, expected URL `https://<owner>.github.io/<repo>/`, and whether this is a project site (base `/<repo>`) or a user site (repo named `<owner>.github.io`, base `/`). Verify the remote matches the values the user gave. If it does not, stop and ask.
- Confirm Node and package manager availability. Record versions. Check the current stable versions of Astro and the GitHub Actions you will use rather than relying on memory.

### Step 2: Plan and record
Create `docs/ARCHITECTURE.md` and ADRs for: framework, island library, styling approach, search, diagram rendering, persistence, base-path handling. Follow the recommended stack in `project_spec.json`; if you deviate, the ADR must show that every requirement is still met. Create a task list covering every feature F01-F20 and all NFRs, and update it as you work.

### Step 3: Foundation
Scaffold the project; base-aware URL helper (all internal links go through it); design tokens and themes; layout, navigation (desktop and mobile bottom bar); content collections with Zod schemas generated from or consistent with `schemas/*.json`; the build-time validators and graph builder (section 7 of the functional spec); secret scanning script and pre-commit hook; CI workflow.

### Step 4: Engine and persistence (highest-risk logic first)
Implement under `src/lib`: scoring and mastery (spec section 8.1-8.3), calibration, initial-assessment sampling and stop rule, recommender with explanations (8.4), routing with resume pointers, regression on failed case exercises, spaced review, level gates. Implement IndexedDB storage with schema v1, migrations framework, derived-state recomputation, session-only fallback, backup export, import (validate, size-limit, preview, replace or merge, pre-import backup offer, reject newer schema). Write unit tests alongside, including boundary cases. Do this before building most UI so the UI sits on tested logic.

### Step 5: Pages and features
Implement every route and feature F01-F20 with accessible components. Build the case page renderer so that it renders only sections present in data, with distinct V/I/R/U treatment, decisions table with basis badge, unknowns list, prerequisite panel with "Fix gaps first, then return" flow, and concept overlay. Build the knowledge map (list view primary, graph optional), search with Pagefind, freshness and sources pages, exercises including ADR export, settings and backup UI. Diagrams: render Mermaid or SVG at build time with text alternatives; reconstructed diagrams carry a visible "Reconstructed" label; do not copy source diagrams.

### Step 6: Populate content
Use the package content and author what is needed so the app is genuinely useful on day one:
- Load all 73 topics, modules, competencies, patterns, 14 cases and 30 sources from the package.
- Render the 7 Tier A cases fully from their structured data. Do not invent additional sections.
- Author an **initial assessment bank** sufficient to cover all 17 competencies, at least 3 items per competency, with scenario items making up the majority of scored weight (target the blueprint ratios). Questions must be correct, tagged to topics and competencies, and marked `draft`. Do not invent facts about vendor products; for SAP items, test architectural reasoning and mark any availability-dependent item `to_verify`.
- Author lessons for the Pillar 1 foundation and architect-craft topics at minimum, with objectives, explanation, worked example, resources and check questions. Where you cannot write a lesson accurately without verification, leave the specified "lesson text not written yet" state rather than guessing.
- For every SAP topic, include the status note and last-verified field from the blueprint; keep the known conflicts flagged (Joule Studio GA date, free-use period, Agent Hub GA) and do not resolve them from memory.
- Resources: use the named authoritative sources and focus notes from the blueprint. Only insert specific URLs you have verified by actually fetching them; mark everything else `to_verify`. Do not invent YouTube links.
- Report exact counts of what was authored versus what remains.

### Step 7: Test and validate
Run and report: unit tests; content validators including deliberately broken fixtures proving failures are caught; e2e tests (Playwright) for user journeys UJ-01 to UJ-10 against a build served under the real base path; reload persistence; storage-failure mode; backup round-trip and merge; malformed import rejection; keyboard-only assessment; mobile viewport; axe accessibility on every route type; Lighthouse CI budgets; link check report; secret scan. Fix failures; do not weaken tests to pass. Verify that no internal link or asset breaks under `/<repo>/`, including deep-link refresh.

### Step 8: Deployment and documentation
- Add `.github/workflows/deploy.yml` (build, validate, test, upload Pages artifact, deploy) with minimal permissions, and `ci.yml` for pull requests. Use current action versions.
- Write `docs/DEPLOYMENT_GUIDE.md` for a complete novice, standalone text, following `deployment_guide_requirements` in the spec. Fill in the verified owner, repo and expected URL. Include: Settings > Pages, choosing GitHub Actions as the source, exact options and what to save, triggering the first run, watching the Actions tab, finding the final URL, a verification checklist, troubleshooting (404, blank page or missing styles from a wrong base path, permissions errors, Pages not enabled, validation failures, environment protection rules, case-sensitive paths, cache delay), how to update, how to roll back, and how to back up progress first. Do not make it depend on screenshots.
- Write `README.md`, `docs/CONTENT_GUIDE.md` (including the case research protocol and tiering rules), `docs/ENGINE.md` (all formulas, config keys), `docs/TESTING.md`.

### Step 9: Commit and push to main
- Work in logical commits. Before the first push, show the user the remote, branch and what will be pushed, and confirm it is the intended repository. Then push to `main`. Do not force-push. If `main` has unrelated history, stop and ask.
- After pushing, check the Actions run status. If Pages is not yet enabled in settings, say so plainly and point the user to the deployment guide; do not claim the site is live until you have verified the live URL returns the home page and one deep link (or state that you could not verify and why).

### Step 10: Final report
Provide, in this order:
1. What was implemented, mapped to F01-F20 and cross-cutting criteria, each marked Done, Partial or Not done with reasons.
2. What content was authored (counts) and what remains.
3. What was tested, exactly what was run and the results; what was not run.
4. Deployment status and the verified or expected URL.
5. Known limitations, deviations from the spec (with ADR references), unresolved decisions (UD-01 to UD-06 status), and items flagged `to_verify`.
6. Recommended next steps for content phases.
Do not pad the report with claims you cannot back.

## 5. Implementation details that are easy to get wrong
- GitHub Pages project sites require `site` and `base` configuration; `/` absolute links break. Generate every internal URL through the helper. Test under the real base path, not only at root.
- Static HTML per route is required so refreshing a deep link works. Avoid client-only routing.
- IndexedDB can be unavailable (private mode). The session-only fallback and banner are required, plus an export button.
- localStorage access must be wrapped in try/catch.
- Imported backup files are untrusted. Validate against `progress_export.schema.json`, enforce the size limit, never use `eval`, sanitise rendered Markdown.
- Fonts self-hosted; no external CDN requests on page load. Video embeds are click-to-load via the privacy-enhanced domain with a visible fallback link.
- Derived mastery state must be recomputable from attempts; keep attempts append-only.
- Orphaned records (content ids removed) are retained and flagged, never silently deleted.
- Scenario free-text justification is self-scored against criteria; the UI must say it is not machine-graded.
- Do not add analytics, trackers, or third-party scripts.

## 6. Definition of done
All of the following are true and evidenced in your report: the site builds in CI with validators passing; all F01-F20 features exist and function; engine unit tests pass including boundary cases; e2e journeys pass under the project-site base path; accessibility and performance checks meet budgets or deviations are documented; backup and restore round-trips; no secrets in repo or history; documentation set exists including the novice deployment guide; changes are pushed to `main` on the confirmed repository; deployment status is stated truthfully.

## 7. If you run short of capacity
Prioritise in this order and say clearly what was not completed: (1) foundation, base-path correctness, validators, deployment; (2) engine, persistence, backup; (3) assessment, pathway, dashboard; (4) case library and detail pages; (5) review, map, search, sources; (6) content authoring volume. Never hide an unfinished item.
