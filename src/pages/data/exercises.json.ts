import { getContent } from '../../lib/content/site';
export const GET = () => new Response(JSON.stringify(getContent().exercises), { headers: { 'content-type': 'application/json' } });
