import { useApp } from '../lib/app/hooks';
import { topicUrl, caseUrl, sourceUrl } from '../lib/url';
import { ErrorBox, Loading } from './ui';

export interface FreshRow { kind: 'topic' | 'case'; id: string; title: string; status: string; noteDate: string | null; lastVerified: string | null; verifySources: string[] }

export default function Freshness({ rows }: { rows: FreshRow[] }) {
  const { app, error } = useApp();
  if (error) return <ErrorBox error={error} />;
  const stale = app?.core.engine.freshness.stale_after_days ?? 90;
  const now = app ? Date.parse(app.now()) : Date.now();
  const age = (d: string | null) => (d ? Math.floor((now - Date.parse(d)) / 86400000) : null);
  if (!app) return <Loading what="Computing freshness" />;
  return (
    <div class="table-wrap">
      <table class="stack-table">
        <thead><tr><th scope="col">Item</th><th scope="col">Status note</th><th scope="col">Note written</th><th scope="col">Last verified</th><th scope="col">Flags</th></tr></thead>
        <tbody>{rows.map((r) => {
          const a = age(r.lastVerified ?? r.noteDate);
          const never = !r.lastVerified;
          return (
            <tr key={r.kind + r.id}>
              <td data-label="Item"><a href={r.kind === 'topic' ? topicUrl(r.id) : caseUrl(r.id)}>{r.id}</a> {r.title}</td>
              <td data-label="Status note">{r.status}</td>
              <td data-label="Note written">{r.noteDate ?? 'n/a'}</td>
              <td data-label="Last verified">{r.lastVerified ?? 'not yet verified'}</td>
              <td data-label="Flags">
                {never ? <span class="badge warn">never verified here</span> : null}{' '}
                {a !== null && a > stale ? <span class="badge warn">older than {stale} days ({a}d)</span> : null}{' '}
                {r.verifySources.map((s) => <a key={s} class="src-chip verify" href={sourceUrl(s)}>verify {s}</a>)}
              </td>
            </tr>
          );
        })}</tbody>
      </table>
    </div>
  );
}
