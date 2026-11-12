import type { ComponentChildren } from 'preact';
import { topicUrl, url } from "../lib/url";
import type { Core } from '../lib/app/bundle';
import type { MasteryState } from '../lib/engine/types';

export const STATE_LABEL: Record<MasteryState, string> = { unknown: 'Not yet assessed', gap: 'Gap', developing: 'Developing', proficient: 'Proficient', mastered: 'Mastered' };
const STATE_ICON: Record<MasteryState, string> = { unknown: '○', gap: '▼', developing: '◐', proficient: '●', mastered: '★' };

export function StateBadge({ state, label }: { state: MasteryState; label?: string }) {
  return <span class={`state ${state}`}><span aria-hidden="true">{STATE_ICON[state]}</span>{label ?? STATE_LABEL[state]}</span>;
}
export function Loading({ what = 'Loading' }: { what?: string }) { return <p role="status" class="muted">{what}…</p>; }
export function ErrorBox({ error }: { error: string }) {
  return <div class="banner warn" role="alert"><p><strong>Something went wrong loading this view.</strong> {error}</p><p>Your saved progress is not affected. You can <a href={url("settings/")}>export your data</a> from Settings, then reload.</p></div>;
}
export function TopicLink({ id, core }: { id: string; core: Core }) {
  const t = core.topics.find((x) => x.id === id);
  return <a href={topicUrl(id)}>{id}{t ? ` ${t.title}` : ''}</a>;
}
export function Empty({ children }: { children: ComponentChildren }) { return <div class="empty">{children}</div>; }
export const pct = (x: number | null | undefined) => (x === null || x === undefined ? 'n/a' : `${Math.round(x * 100)}%`);

export function RangeBar({ e, lo, hi, label }: { e: number | null; lo: number; hi: number; label: string }) {
  if (e === null) return <div class="rangebar" role="img" aria-label={`${label}: no evidence yet`} />;
  return (
    <div class="rangebar" role="img" aria-label={`${label}: estimate ${pct(e)}, plausible range ${pct(lo)} to ${pct(hi)}`}>
      <span class="range" style={`left:${lo * 100}%;width:${Math.max(1, (hi - lo) * 100)}%`} />
      <span class="pt" style={`left:calc(${e * 100}% - 2px)`} />
    </div>
  );
}
export function download(filename: string, text: string, type = 'application/json') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export function toast(msg: string) {
  const host = document.getElementById('toast-host');
  if (!host) return;
  const d = document.createElement('div');
  d.className = 'toast';
  d.textContent = msg;
  host.append(d);
  setTimeout(() => d.remove(), 4500);
}

/** Relative time, used instead of calendar dates in activity views (no dates outside revision, backup and last-verified stamps). */
export function ago(ts: string, now = new Date().toISOString()): string {
  const d = Math.floor((Date.parse(now) - Date.parse(ts)) / 86400000);
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
}
