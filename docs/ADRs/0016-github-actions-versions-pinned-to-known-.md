# ADR-0016: GitHub Actions versions pinned to known majors; currency not verified in this build

- Status: Accepted
- Date: 2026-11-12

## Context

The brief asks to check current action versions. The build environment cannot reach the GitHub API for other repositories, so release lists could not be read.

## Decision

Pinned `actions/checkout@v4`, `actions/setup-node@v4`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4` and `actions/upload-artifact@v4`. These majors exist and are widely used; newer majors may exist.

## Consequences and requirement impact

Before relying on the pipeline, check each action's release page and update the versions (see the deployment guide). This is listed as a known limitation in the final report.
