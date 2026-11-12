import { getContent } from '../../lib/content/site';
import { buildGraph } from '../../lib/content/graph';
export const GET = () => new Response(JSON.stringify(buildGraph(getContent())), { headers: { 'content-type': 'application/json' } });
