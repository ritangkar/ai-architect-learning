import { getContent } from '../../lib/content/site';
import { buildCore } from '../../lib/app/bundle';
export const GET = () => new Response(JSON.stringify(buildCore(getContent())), { headers: { 'content-type': 'application/json' } });
