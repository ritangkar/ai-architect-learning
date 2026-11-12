import { useEffect, useState } from 'preact/hooks';
/** Filter state mirrored into the URL query string (AC-F04-1). Multiple filters combine with AND. */
export function useQueryState<T extends Record<string, string>>(defaults: T): [T, (k: keyof T, v: string) => void, () => void] {
  const read = (): T => {
    const p = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);
    const out: any = { ...defaults };
    for (const k of Object.keys(defaults)) if (p.has(k)) out[k] = p.get(k)!;
    return out;
  };
  const [state, setState] = useState<T>(defaults);
  useEffect(() => { setState(read()); const on = () => setState(read()); window.addEventListener('popstate', on); return () => window.removeEventListener('popstate', on); }, []);
  const write = (next: T) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v && v !== (defaults as any)[k]) p.set(k, v);
    const qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    setState(next);
  };
  return [state, (k, v) => write({ ...state, [k]: v }), () => write({ ...defaults })];
}
