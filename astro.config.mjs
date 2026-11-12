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
