# ADR-0005: Diagrams: build-time SVG from validated JSON (deviation from Mermaid)

- Status: Accepted
- Date: 2026-11-12

## Context

The spec recommends Mermaid prerendered to SVG at build time. Prerendering Mermaid needs a headless browser in every build, in CI and for contributors who cannot install local tooling. Requirements are: static SVG, alt text, text alternative, mobile scroll container, and a visible 'Reconstructed' label where relevant (F07, AC-F06-6).

## Decision

Diagrams are JSON files (`content/diagrams/*.json`: nodes, edges, title, description) validated by Zod and rendered to inline SVG by `src/lib/render/diagram.ts` during the build, with a layered left-to-right or top-down layout. Each figure has `<title>`/`<desc>`, a text-alternative disclosure listing nodes and edges, a horizontally scrollable container, and either an 'Illustrative' badge or an 'R Reconstructed' label. The same renderer draws the Knowledge Map graph view in the browser, and the list remains the primary view.

## Consequences and requirement impact

Every F07 criterion is met without a browser dependency. Limitation: layouts are simple layered diagrams; complex architecture drawings would need a richer renderer. Mermaid can be adopted later by replacing the renderer; content would need converting.
