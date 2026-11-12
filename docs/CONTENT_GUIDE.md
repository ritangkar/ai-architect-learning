# Content guide

All content lives under `content/`; code under `src/`. UI counts are computed from this data. Run `npm run validate` after every change; the build fails on any error, naming the file and field.

```
content/
  config/engine.json        tunable engine parameters (docs/ENGINE.md)
  config/gates.json         level gates
  config/site.json          site name, contentVersion (bump when content changes meaningfully)
  curriculum/               pillars, modules, competencies, patterns, levels, resource_sources, topics.json, sap_verification.json
  topics/<id>/lesson.md     one lesson per topic (optional; absence shows the honest empty state)
  cases/CS-nnn.json         one file per case; cases/_catalog.json holds catalogue status, backlog, gaps
  sources/sources.json      source register
  questions/*.json          arrays of questions
  cards/*.json              arrays of revision cards
  resources/*.json          arrays of curated resources
  exercises/*.json          one exercise per file
  diagrams/*.json           diagrams referenced from lessons
```

## Rules that never bend

1. **No fabrication.** Do not invent case facts, metrics, diagrams, URLs, video links, SAP availability or question answers. Anything you cannot verify gets `to_verify` or is left out.
2. **Draft until reviewed.** New lessons, questions, cards and exercises are `status: draft`. Only a human reviewer changes this.
3. **Provenance is sacred.** Case facts are tagged V (with a source in the case's own `sources`), I (interpretation), R (reconstructed, labelled) or U (unknown). Never present an interpretation as a fact.
4. **Mastery comes only from assessment and exercise evidence.** Do not add anything that raises mastery from reading.
5. **No calendar dates or deadlines** in the curriculum or pathway. Dates are for revision scheduling, backup reminders and "last verified" stamps.
6. **Honest empty states.** If a lesson is not written, do not add filler. The page says so.
7. **SAP statements** need a status note and a last-verified date (`curriculum/sap_verification.json`). Known conflicts (Joule Studio GA date, end of the free-use period, Agent Hub GA) are flagged, not resolved from memory.

## Add a topic

Edit `curriculum/topics.json` (fields in `handoff/schemas/topic.schema.json`: id `Tn.m.k`, `module`, `pillar`, `pre`, `comps`, `obj`, `res`, `hands`, `assessment_plan`). `verified_case_ids` must equal the cases that list the topic in `prereq_topics` (the validator checks this). Prerequisites must exist and must not form a cycle. A SAP topic needs `sap_status` and an entry in `sap_verification.json`.

## Add a lesson

Create `content/topics/<topicId>/lesson.md`:

```markdown
---
topicId: T1.1.1
lastReviewed: '2026-11-12'
status: draft
sources: []          # source ids from the register, if any
diagrams: [rag-baseline]
---
@@ summary
...shown at every depth
@@ keyterms
@@ why
@@ lesson
...standard and deep
@@ example
@@ deep
...deep only
```

Blocks: `summary` and `keyterms` appear at all depths; `why`, `lesson` and `example` at standard and deep; `deep` only at deep. `summary` is mandatory. Embed a diagram with `{{diagram:id}}` alone on a line. Link internally with `topic:T1.2.1`, `case:CS-001`, `pattern:PAT01`, `source:SRC-001` or `page:exercises/`; never write a root-absolute link. All Markdown is sanitised.

## Add a question

Add to a file in `content/questions/`. Required: `id`, `type`, `topics`, `competencies`, `difficulty` (1-5), `stem`, `explanation`, `status`. Every competency must be developed by at least one of the question's topics. Types:

* `mcq`: `options[{id,text}]`, `correct` (id, or array of ids for multi-select).
* `scenario`: `stem`, `constraints[]`, `options[{id,text,credit}]` (best option credit 1, partial 0.5, wrong 0), `correct` (the credit-1 option), `rationales[{id,text,valid}]`, `model_answer`, `rubric[{criterion,points}]`.
* `decision_comparison`: `criteria[{id,name,weight}]`, `options`, `model_scores{optionId:{criterionId:1..5}}`.
* `architecture_review`: `design`, `checklist[{id,text,flaw,explanation}]`.
* `card`: `stem`, `model_answer`.

Mark `to_verify: true` for any item whose answer depends on product availability or pricing. Aim for scenarios to carry the majority of scored weight.

## Add a card, resource, exercise

* Card: `{id, topicId, front, back, status}`.
* Resource (`handoff/schemas/resource.schema.json`): `id, title, url, topics, whyUseful, focus, cost (free|paid), status (verified|to_verify|broken)`. Use `verified` only for a URL you actually fetched; set `lastChecked`. Unverified resources render a "link not yet verified" label. Paid resources are labelled.
* Exercise: see existing files for `architecture_review`, `options_analysis`, `discovery_drill`, `requirements_critique`. Exercises are constructed teaching scenarios and must say so.

## Add a case (research protocol)

1. **Pick** by coverage gap (see `coverage_gaps` and `backlog` in `cases/_catalog.json`).
2. **Find a builder-authored primary source** (engineering blog, conference talk by the builders, official reference architecture).
3. **Read the full page**, not a snippet.
4. **Record only stated facts**, paraphrased, each with its source id (`facts: [[text, "SRC-nnn"]]`).
5. **List Unknowns explicitly** (`unknown[]`).
6. **Write decisions** with `basis`: `documented`, or `independent analysis` where alternatives or reasoning are ours.
7. **Tier honestly:** A needs a technical primary source and at least 3 documented decisions (enforced); A-provisional means the source is identified but not fully read; B is limited depth or implementer-authored; marketing or editorial coverage caps at C.
8. **Never copy diagrams or long text.** Link to the source instead.
9. **Quotes** under 15 words, one per source.
10. **Validate** with `npm run validate`; add the source to `sources/sources.json` with grade, `supports`, `checked_on`, and `verify: true` plus `verify_reason` when sources conflict.
11. **Record the check date.**

Diversity rules: no company above 15% of the catalogue; track industry and category coverage on `/cases/`; prefer SAP-relevant cases; keep simulations separate (`simulation: true`) and labelled.

## Tiering at a glance

| Tier | Meaning | Renders |
|---|---|---|
| A | builder-authored technical source, 3+ decisions | full structured walkthrough from the data |
| A-provisional | primary source found, not fully read | only what was read, with a banner |
| B | limited depth or implementer-authored | structured analysis |
| C | marketing, editorial or secondary | catalogue stub; no invented detail |

The case page renders **only sections present in the data**.
