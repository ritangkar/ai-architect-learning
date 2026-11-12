# ADR-0007: Base path handling

- Status: Accepted
- Date: 2026-11-12

## Context

A GitHub Pages project site lives under `/<repo>/`; root-absolute links and assets break there.

## Decision

`scripts/site-config.mjs` derives `site` and `base` from `SITE_URL`/`BASE_PATH`, else `GITHUB_REPOSITORY` (set in Actions), else `site.config.json` for local builds. A repository named `<owner>.github.io` gets base `/`. Every internal URL goes through `src/lib/url.ts`. `scripts/check-links.ts --internal` fails the build if any internal `href`/`src` in `dist/` is relative, outside the base, or points to a missing file or anchor. End-to-end tests run against `scripts/serve-dist.mjs`, which serves only under the base path, like GitHub Pages, and assert that the same pages are absent at the server root.

## Consequences and requirement impact

Owner and repository are never hard-coded in source. They appear only in configuration (`site.config.json`) and in the deployment guide's filled-in example.
