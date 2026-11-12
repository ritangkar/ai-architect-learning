# ADR-0002: Island library: Preact

- Status: Accepted
- Date: 2026-11-12

## Context

Interactive views (assessment, dashboard, map, review) need components, state and accessible form controls, but the initial JavaScript budget is 120 KB gzip on content pages.

## Decision

Use Preact through `@astrojs/preact`, hydrated with `client:only="preact"` because the views depend on browser-only state (IndexedDB). Islands are code-split per route by Astro.

## Consequences and requirement impact

Preact is about 4 KB and covers every component need. Content pages that contain islands load only those islands. Spec allowed 'Preact or React'; no deviation.
