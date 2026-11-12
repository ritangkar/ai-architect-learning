# ADR-0013: Free-text justification is self-scored and not counted

- Status: Accepted
- Date: 2026-11-12

## Context

Scenario justification cannot be machine-graded, and a self-score that feeds mastery would let the learner inflate their level.

## Decision

Scenario items are scored automatically from the chosen option's credit (60%) and the selected rationales (40%). Free text and the rubric self-score are displayed to the learner and are not stored as mastery evidence. The UI states this on every scenario. Exercises that are self-judged (options analysis, discovery drill) are saved and exported but record no attempt.

## Consequences and requirement impact

Mastery cannot be raised by self-assessment. The trade-off is that free text has reflective value only.
