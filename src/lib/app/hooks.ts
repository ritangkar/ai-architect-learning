import { useEffect, useState } from 'preact/hooks';
import { getApp, type AppState } from './state';

/** Returns the app once loaded (undefined while loading) and re-renders on any state change. */
export function useApp(needQuestions = false): { app: AppState | undefined; error?: string } {
  const [app, setApp] = useState<AppState | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [, bump] = useState(0);
  useEffect(() => {
    let off = () => {};
    let alive = true;
    getApp().then(async (a) => {
      if (needQuestions) await a.ensureQuestions();
      if (!alive) return;
      setApp(a);
      off = a.subscribe(() => bump((n) => n + 1));
    }).catch((e) => alive && setError(String(e?.message ?? e)));
    return () => { alive = false; off(); };
  }, []);
  return { app, error };
}
