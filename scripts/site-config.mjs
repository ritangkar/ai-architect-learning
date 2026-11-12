// Resolves SITE_URL and BASE_PATH. Precedence: SITE_URL/BASE_PATH env > GITHUB_REPOSITORY env (CI) > site.config.json (local).
import fs from 'node:fs';

export function resolveSite() {
  let owner;
  let repo;
  if (process.env.GITHUB_REPOSITORY?.includes('/')) [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  else {
    const cfg = JSON.parse(fs.readFileSync(new URL('../site.config.json', import.meta.url), 'utf8'));
    owner = cfg.owner;
    repo = cfg.repo;
  }
  const userSite = repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;
  const site = process.env.SITE_URL ?? `https://${owner.toLowerCase()}.github.io`;
  let base = process.env.BASE_PATH ?? (userSite ? '/' : `/${repo}`);
  if (!base.startsWith('/')) base = '/' + base;
  if (base.length > 1) base = base.replace(/\/+$/, '');
  return { owner, repo, userSite, site, base, url: site + (base === '/' ? '/' : base + '/') };
}
