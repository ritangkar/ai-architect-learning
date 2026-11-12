// Serves dist/ exactly like a GitHub Pages project site: only under BASE_PATH, directory index files, case-sensitive paths, 404.html for misses.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { resolveSite } from './site-config.mjs';

const { base } = resolveSite();
const root = path.resolve(process.env.DIST_DIR ?? 'dist');
const port = Number(process.env.PORT ?? 4321);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.pf_meta': 'application/octet-stream', '.pf_index': 'application/octet-stream', '.pf_fragment': 'application/octet-stream', '.pagefind': 'application/octet-stream', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain' };
const prefix = base === '/' ? '' : base;

const server = http.createServer((req, res) => {
  const u = new URL(req.url ?? '/', 'http://x');
  let p = decodeURIComponent(u.pathname);
  const send = (file, status = 200) => {
    res.writeHead(status, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  };
  const notFound = () => send(path.join(root, '404.html'), 404);
  if (prefix && !p.startsWith(prefix + '/') && p !== prefix) return notFound();
  if (prefix && p === prefix) { res.writeHead(301, { location: prefix + '/' }); return res.end(); }
  p = p.slice(prefix.length) || '/';
  let file = path.join(root, p);
  if (!file.startsWith(root)) return notFound();
  try {
    const st = fs.statSync(file);
    if (st.isDirectory()) {
      if (!p.endsWith('/')) { res.writeHead(301, { location: prefix + p + '/' }); return res.end(); }
      file = path.join(file, 'index.html');
    }
    return send(file);
  } catch { return notFound(); }
});
server.listen(port, () => console.log(`Serving ${root} at http://localhost:${port}${prefix}/`));
