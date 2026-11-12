# Architecture decision records

One file per significant decision, newest ideas appended with the next number. Superseded records are marked, never deleted.

- ADR-0001: Framework: Astro with TypeScript, static output
- ADR-0002: Island library: Preact
- ADR-0003: Styling: plain CSS with design tokens
- ADR-0004: Search: Pagefind built at build time
- ADR-0005: Diagrams: build-time SVG from validated JSON (deviation from Mermaid)
- ADR-0006: Persistence: IndexedDB `architect-lab` v1 with write-behind memory fallback
- ADR-0007: Base path handling
- ADR-0008: Content loading: a shared Zod loader instead of Astro content collections
- ADR-0009: Level gates are encoded in `content/config/gates.json`
- ADR-0010: CSP: hashes for scripts and style elements, `unsafe-inline` for style attributes only
- ADR-0011: Competency estimates are pooled from attempts, not averaged over topic estimates
- ADR-0012: Initial assessment: self-rating first, adaptive A/B interleave
- ADR-0013: Free-text justification is self-scored and not counted
- ADR-0014: Case routing follows transitive prerequisites
- ADR-0015: Depth inference for untested topics is flagged and never counts as mastery
- ADR-0016: GitHub Actions versions pinned to known majors; currency not verified in this build
