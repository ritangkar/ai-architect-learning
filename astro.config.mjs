import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import { resolveSite } from './scripts/site-config.mjs';

const { site, base } = resolveSite();

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', assets: '_assets' },
  integrations: [preact()],
  devToolbar: { enabled: false },
  security: {
    csp: {
      // Inline style ATTRIBUTES are allowed (layout nudges in islands); inline style/script ELEMENTS stay hash-only. See ADR-0010.
      styleDirective: { resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }] },
      // WebAssembly is required by the local Pagefind search; no 'unsafe-eval' and no remote scripts.
      scriptDirective: { resources: ["'self'", "'wasm-unsafe-eval'"] },
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-src https://www.youtube-nocookie.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
    },
  },
});
