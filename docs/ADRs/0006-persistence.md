# ADR-0006: Persistence: IndexedDB `architect-lab` v1 with write-behind memory fallback

- Status: Accepted
- Date: 2026-11-12

## Context

Progress must survive reloads, degrade gracefully when storage is unavailable (private mode, blocked), keep attempts append-only and allow derived state to be recomputed (F16).

## Decision

A small hand-written IndexedDB wrapper (`src/lib/storage/kv.ts`) creates the nine stores in schema v1. If IndexedDB is missing, throws, is blocked or times out, `openStorage` returns an in-memory store and a reason; a persistent banner appears with an export button. Runtime write failures also degrade to session-only mode. The app keeps its working state in memory and recomputes mastery from the attempt log on load (`topicState` is a derived cache only). `localStorage` holds only theme, density, motion and per-topic depth, always in try/catch. A migration registry with a tested v1 to v2 stub exists (`migrations.ts`); the live schema version is 1.

## Consequences and requirement impact

AC-F16-1 to AC-F16-4 are covered by unit and e2e tests. Orphaned records (unknown topic ids) are retained, excluded from metrics and reported.
