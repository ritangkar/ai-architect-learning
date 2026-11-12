# ADR-0012: Initial assessment: self-rating first, adaptive A/B interleave

- Status: Accepted
- Date: 2026-11-12

## Context

Spec lists sections A (25%), B (55%), C (20% calibration). AC-F02-3 says self-assessment alters 'calibration and order of sampling', which requires ratings before sampling.

## Decision

Order of taking: C (self-rating of 17 competencies), then adaptive A/B items. Per competency the pattern A,B,A,B,A,B,A (4:3 by count) gives about 25:55 by scored weight with mcq weight 1 and scenario weight 3. The next competency is the one with the widest interval (fewest items first), then higher self-rating first so that claimed strengths are tested. Sampling stops per competency after at least 3 items when the 80% interval is entirely above 0.8 or below 0.4, at a cap of 7, or when the bank is exhausted. Self-ratings never enter mastery.

## Consequences and requirement impact

Section C is first in time but still 20% in role (calibration). `section_pattern` and `max_items_per_competency` were added to `engine.json` as tunable keys.
