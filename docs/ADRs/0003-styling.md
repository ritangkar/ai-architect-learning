# ADR-0003: Styling: plain CSS with design tokens

- Status: Accepted
- Date: 2026-11-12

## Context

The design system needs light, dark and system themes, 4/8 spacing, high contrast and no runtime dependencies.

## Decision

One hand-written stylesheet (`src/styles/global.css`) built on CSS custom properties, with `data-theme` and `data-density` attributes, `prefers-color-scheme` and `prefers-reduced-motion` support, and self-hosted variable fonts (Inter, Source Serif 4, JetBrains Mono) bundled by Vite. Tailwind was considered and not needed.

## Consequences and requirement impact

No external font or CDN requests (NFR-05). Tokens make the themes testable: axe reports no serious or critical violations in either theme.
