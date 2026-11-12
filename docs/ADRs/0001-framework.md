# ADR-0001: Framework: Astro with TypeScript, static output

- Status: Accepted
- Date: 2026-11-12

## Context

The portal must be static (GitHub Pages), have one HTML file per route so deep links survive refresh, load little JavaScript on content pages, and support islands of interactivity.

## Decision

Use Astro (7.x) with `output: 'static'`, `trailingSlash: 'always'` and `build.format: 'directory'`. Content pages (topics, cases, patterns, sources) are fully server-rendered at build time. Stateful pages are thin Astro shells around client-only islands.

## Consequences and requirement impact

Static HTML per route (AC-IA). Content pages ship only the small shared scripts. Matches the recommended stack in `project_spec.json`; no deviation.
