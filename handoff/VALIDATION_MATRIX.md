# Part 7: Validation Matrix
Package prepared 2026-11-12. Checks the package against every requirement in the master brief and records gaps honestly.

Status key: **Met** = fully addressed in the package. **Spec'd** = fully specified, to be built by Claude Code. **Partial** = addressed but incomplete, with the gap stated. **Gap** = not yet done.

## A. Automated consistency checks (run on this package)
| Check | Result |
|---|---|
| All JSON files parse; all JSON Schemas are valid draft 2020-12 | Pass |
| 73 topics validate against `topic.schema.json` | Pass |
| 14 cases validate against `case.schema.json` | Pass |
| 30 sources validate against `source.schema.json`; no duplicate ids | Pass |
| Every case source id exists in the source register; every fact source is listed in its case | Pass |
| Prerequisite graph: no dangling ids, no cycles; every competency and pattern used | Pass |
| Every acceptance criterion in the functional spec appears in `project_spec.json` (60 feature-level + 2 cross-cutting = 62) | Pass |
| Engine weights sum to 1 (recommender, session mix, initial assessment) | Pass |
| Example progress export validates against its schema | Pass |
| Manifest lists only files that exist | Pass |
| Tier A cases each have at least 3 decisions | Pass (7 of 7) |

Counts in the package: 3 pillars, 13 modules, 73 topics (P1 38, P2 21, P3 14), 17 competencies, 20 patterns, 14 cases (A 7, A-provisional 2, B 1, C 4), 30 sources, 20 features.

## B. Requirement coverage (brief section by section)
| Brief | Requirement | Where addressed | Status | Gap or note |
|---|---|---|---|---|
| 2 | Objective: SAP CX architect leading discovery, options analysis, documents | Blueprint M1.6, M2.x, T3.3.2; F20 exercises | Met | |
| 2 | Do not assume beginner; assess first | F02 initial assessment, compress depth | Spec'd | Question bank not yet written |
| 3 | Study many real implementations; explain why | Case schema decisions table, review exercises | Partial | 14 cases, not 100-200 |
| 3 | Per-decision questions (problem, requirements, alternatives, trade-offs) | Decision table with documented vs independent-analysis basis | Met for batch 1 | Requirements and discovery-question sections not populated per case |
| 4 | Pillar 1 topics list plus additional topics | 38 topics in 6 modules, incl. emerging topics T1.6.6 | Met | Lesson text not written |
| 4 | Pillar 2 SAP curriculum with GA vs preview distinction | 21 topics; status notes; freshness page | Partial | 7 of 21 SAP topics lack a status note (T2.2.5, T2.3.5, T2.3.6, T2.4.1-T2.4.4); SAP status conflicts unresolved (UD-04) |
| 4 | Pillar 3 cross-industry, B2B emphasis | 14 topics, 10 industry lenses, B2B first | Met | Evidence is thin outside tech and e-commerce |
| 4 | Pillars intersect | 29 cross-pillar prerequisite edges; case links | Partial | 35 of 73 topics link to a case; 38 do not (P1 16, P2 11, P3 11) |
| 5 | 100-200 case catalog | 14 entries plus backlog | **Gap** | Honest count reported; protocol for scaling in functional spec section 17 |
| 5 | Prioritise primary, technical sources | Tier rules; 7 Tier A from builder-authored pages | Met for batch 1 | |
| 5 | Provenance V/I/R/U | Tags in data, schema, UI spec, build checks | Met | No R used in batch 1 |
| 5 | Source links and what each supports | Source register, case facts | Met | Some register entries have coarse `supports` |
| 5 | 27-section case template | Walkthrough sections in spec | Partial | Batch 1 data covers about half the sections; full walkthrough text for priority cases is a content-phase task |
| 5 | Simulations labelled | AC-F06-4; separate collection | Spec'd | Capstone simulations are named, not authored |
| 6 | Production readiness topics and architecture review exercises | T1.5.1-T1.5.10, T1.6.4; per-case review exercises | Met | |
| 7 | Initial assessment: MCQ, scenario (heavy), self-assessment | F02, engine config weights 25/55/20 | Spec'd | Questions not authored; free-text scoring is self-assessed |
| 7 | Adaptive pathway, prerequisites, return to case | F03, F12, engine routing with resume pointers | Spec'd | |
| 7 | No mastery from watching or completing | Rule 8, F05, F09, engine | Spec'd | |
| 7 | Spaced revision, revisit weak areas | F11, engine config | Spec'd | |
| 8 | Flexible daily recommendation; no fixed dates | F01, F12, rule 9 | Spec'd | |
| 9 | Broad ecosystem coverage, comparative trade-offs | T1.4.3, T1.4.4, T3.2.2, resource sources | Partial | Vendor facts not yet researched in depth (AWS, Azure, GCP, OpenAI, Anthropic, open source); lessons must verify current capabilities |
| 10 | Practical constraints; no local installs; browser demos | Hands-on levels `none` or `browser`; F20 | Met | Hosted playground resources not yet curated |
| 10 | No API keys; no dependence on paid calls | NFR-04, NFR-05, security requirements, rule 5 | Met | |
| 11 | Videos, docs, articles, lessons, diagrams, MCQs, cards, summaries | F05, F07, F10, F11 | Spec'd | URLs and videos are `to_verify` slots; no invented links |
| 11 | Explain why each resource is useful | Resource schema requires whyUseful and focus | Spec'd | Per-topic focus notes exist; per-URL commentary pending |
| 12 | Professional LMS UI, subtle gamification | Section 9 of spec, F15 | Spec'd | |
| 12 | GitHub Pages, verify username and path | Inputs from user; base-path helper; Step 1 verification | Met | Owner and repo supplied by you at build time |
| 12 | Static stack recommendation with trade-offs | Report section 6.1; ADR requirement | Met | |
| 12 | Local persistence, JSON backup, limits explained, no sync promise | F16, F17, user notice text | Spec'd | |
| 13 | Current research, primary sources, source register with dates | 30-source register with grades, `verify` flags | Partial | SAP findings largely secondary; some primary SAP pages could not be read in full |
| 14 | Knowledge map and the six sample questions | F14 with AC-F14-1 | Spec'd | |
| 15 | Quality: IA, typography, accessibility, performance | Spec sections 9-11, NFR-01..03 | Spec'd | |
| 16 | Phases 1-7 | Parts 1-7 | Met | Phase 4 research incomplete (see case catalog) |
| 17A | Research and architecture report | `docs/PART1_...` | Met | Later findings (cases, packaging) live in Parts 3-4 |
| 17B | Curriculum blueprint | `PART2` + JSON | Met | Resources are source-and-focus slots, not final URLs |
| 17C | Case catalog | `PART3` + JSON | Partial | See above |
| 17D | Functional and technical specification | `PART4` | Met | |
| 17E | JSON handoff with schemas and package | `project_spec.json`, `schemas/`, `config/`, `content/`, manifest | Met | Content volumes noted as incomplete |
| 17F | Claude Code master prompt | `CLAUDE_CODE_MASTER_PROMPT.md` | Met | |
| 17G | Novice deployment guide requirement | Spec section 16, `deployment_guide_requirements`, prompt Step 8 | Met | Guide itself is written by Claude Code after remote detection |
| 18 | No coding, no small demo, no generic course, no fabrication | Whole package | Met | |

## C. Identified conflicts and risks
1. **Case library target versus evidence.** 100-200 verified cases are not achievable in one pass. The package ships 14 and a repeatable protocol. Risk: the learner may feel the library is thin early on. Mitigation: honest counts, backlog, content phases.
2. **Integration coverage.** 38 of 73 topics have no linked verified case yet, so "technical topic then case" routing works only for the 35 linked topics until more cases arrive.
3. **SAP currency.** Sources disagree on Joule Studio GA timing, free-use end date and Agent Hub status; announced items may have moved. SAP topics must be verified before publication.
4. **SAP primary pages.** CS-011 and CS-012 are provisional because the full page bodies did not load; read them before building walkthroughs.
5. **Secondary-source SAP CX claims** (partner blogs, analyst notes) are flagged `verify` and must not be taught as fact.
6. **Static-site limits.** No server-side grading, no sync. Scenario free text is self-scored. Browser storage can be lost; mitigated by backup prompts.
7. **Heuristic engine.** Thresholds are defaults, not validated psychometrics; tune after use.
8. **Third-party dependency drift.** Astro, GitHub Actions and other versions must be checked at build time.
9. **Regulatory content** is educational; statuses change; verify at authoring.
10. **Cross-industry evidence skew** toward tech and e-commerce; banking, healthcare, telecom, energy, travel and manufacturing need targeted sourcing.

## D. What Claude Code can and cannot be expected to finish in one run
Can: foundation, engine, persistence, backup, UI for all features, validators, tests, CI, deployment, docs, an initial assessment bank, and foundational lessons. Cannot responsibly finish in one run: full lessons for 73 topics, verified resource curation, 100+ cases. The prompt requires an honest report of this split.

## E. Recommended order after the first build
1. Learner takes the initial assessment; review question quality.
2. Content phase 1: verify SAP statuses; fill missing SAP status notes; read CS-011 and CS-012 in full.
3. Content phase 2: next case batches from the backlog and coverage gaps; link more topics to cases.
4. Content phase 3: lessons by pillar, resources with verified links, more questions per competency.
