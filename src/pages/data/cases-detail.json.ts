import { getContent } from '../../lib/content/site';
export const GET = () => new Response(JSON.stringify(getContent().cases), { headers: { 'content-type': 'application/json' } });
