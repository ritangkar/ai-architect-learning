# ADR-0009: Level gates are encoded in `content/config/gates.json`

- Status: Accepted
- Date: 2026-11-12

## Context

`levels.json` describes each gate in prose (for example 'M1.3 complete; M2.1 proficient'). F15 requires levels to be computed from evidence and tunable without code changes.

## Decision

The prose is encoded as structured conditions (module topics at a minimum state, competencies at a minimum state, cases passed, exercises passed, industries covered, simulations passed, reviews current). Interpretations: 'complete' means proficient or better; 'compressed' counts toward a module gate; 'across at least 5 industries' means passed case exercises in five distinct industries. The prose is kept beside the encoding for review.

## Consequences and requirement impact

Gates are evidence-only (AC-F15-2). Several upper gates cannot be met yet: for example there are no capstone simulations, and only one architecture-review exercise exists. The UI says so with counts from the data.
