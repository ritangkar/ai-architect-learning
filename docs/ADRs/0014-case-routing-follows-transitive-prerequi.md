# ADR-0014: Case routing follows transitive prerequisites

- Status: Accepted
- Date: 2026-11-12

## Context

Spec 8.4: recommend the earliest prerequisite of a case that is in gap or unknown. That prerequisite may itself have unmet prerequisites, and recommending it would put a topic before its own prerequisites.

## Decision

`routeTarget` collects the case's unmet prerequisites and their unmet prerequisites transitively, orders them topologically and returns the first. The resume pointer stores the case and the routed topic, so the 'Return to the case' banner appears on that topic.

## Consequences and requirement impact

Satisfies AC-F12-3 and AC-F03-1 together. A unit test and an e2e journey cover it.
