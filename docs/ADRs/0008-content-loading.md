# ADR-0008: Content loading: a shared Zod loader instead of Astro content collections

- Status: Accepted
- Date: 2026-11-12

## Context

The spec recommends Astro content collections with Zod. Validation must also run outside Astro: in CI before the build, in unit tests with deliberately broken fixtures, and in scripts. Relational checks (cycles, dangling ids, V-fact sources) need all collections at once.

## Decision

`src/lib/content/` provides Zod schemas consistent with `handoff/schemas/*.json`, a Node loader, relational validators and the graph builder. Astro pages call the same loader. The browser receives JSON bundles from `/data/*.json` endpoints built from validated content.

## Consequences and requirement impact

Same Zod validation, but runnable as `npm run validate` and in tests; the build fails on any error. The cost is not using the Astro collections API; migration to collections would be mechanical.
