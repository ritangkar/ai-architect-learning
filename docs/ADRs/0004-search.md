# ADR-0004: Search: Pagefind built at build time

- Status: Accepted
- Date: 2026-11-12

## Context

Search must work offline from static files, under the project base path, and no query may leave the browser (AC-F13-1, AC-F13-2).

## Decision

Run `pagefind --site dist` after `astro build`. The search island loads `pagefind.js` from the same origin with a dynamic import and queries it locally. Topic, case and pattern pages carry `data-pagefind-filter` and `data-pagefind-meta` attributes. The CSP allows `'wasm-unsafe-eval'` because Pagefind uses WebAssembly; `'unsafe-eval'` is not allowed.

## Consequences and requirement impact

Index is built in CI. In `astro dev` there is no index, and the page says so instead of failing silently.
