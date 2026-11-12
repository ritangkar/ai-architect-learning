# ADR-0015: Depth inference for untested topics is flagged and never counts as mastery

- Status: Accepted
- Date: 2026-11-12

## Context

The depth model says proficient topics are compressed, and the L1 gate says 'proficient or compressed', but an initial assessment cannot test every topic.

## Decision

A topic with direct proficient evidence is compressed. A topic with no evidence of its own whose competencies are all proficient is compressed and marked 'inferred', with a 'confirm in 2 questions' step. Inferred compression satisfies prerequisites and module gates but never changes the topic's mastery state, which stays 'not yet assessed' until it has its own evidence.

## Consequences and requirement impact

AC-F02-3 and AC-F09-2 hold. The inference and its reason are shown to the learner.
