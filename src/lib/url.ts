// The ONE place internal URLs are built. Every internal href/src in the app goes through url() (or a helper below).
const RAW_BASE = (import.meta.env?.BASE_URL as string | undefined) ?? '/';
export const BASE = RAW_BASE.endsWith('/') ? RAW_BASE : RAW_BASE + '/';

/** url('topic/T1.1.1/') -> '/<repo>/topic/T1.1.1/'. Never pass an absolute or external URL. */
export function url(path = ''): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('//')) throw new Error(`url() is for internal paths only: ${path}`);
  return BASE + path.replace(/^\/+/, '');
}
export const topicUrl = (id: string) => url(`topic/${id}/`);
export const caseUrl = (id: string, hash = '') => url(`case/${id}/`) + hash;
export const patternUrl = (id: string) => url(`pattern/${id}/`);
export const moduleUrl = (id: string) => url(`curriculum/${id}/`);
export const exerciseUrl = (id: string) => url(`exercise/${id}/`);
export const sourceUrl = (id: string) => url('sources/') + `#${id}`;
export const dataUrl = (name: string) => url(`data/${name}.json`);
