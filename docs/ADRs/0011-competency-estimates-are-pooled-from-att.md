# ADR-0011: Competency estimates are pooled from attempts, not averaged over topic estimates

- Status: Accepted
- Date: 2026-11-12

## Context

Spec 8.3 defines the competency score as the evidence-weighted mean of its topics' E, excluding topics in state 'unknown' (mass below 3). In an initial assessment each topic receives one or two items, so almost every topic is 'unknown' and no competency would have an estimate.

## Decision

The competency estimate applies the same formula as a topic (weights, decay, cap, overconfidence, thresholds) to all attempts tagged with the competency, pooled across topics. The build validator ensures a question's competencies are developed by at least one of its topics, so the two views agree. Coverage (topics touched of topics total) is reported separately.

## Consequences and requirement impact

Documented deviation from the literal text of 8.3, needed for AC-F02-1 and F02 to function. Tests pin the hand-computed numbers.
