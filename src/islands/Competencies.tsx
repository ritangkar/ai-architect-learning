import { useApp } from '../lib/app/hooks';
import { calibration, calibrationLabel } from '../lib/engine/mastery';
import { topicUrl } from '../lib/url';
import { ErrorBox, Loading, RangeBar, StateBadge, pct } from './ui';

export default function Competencies() {
  const { app, error } = useApp();
  if (error) return <ErrorBox error={error} />;
  if (!app) return <Loading what="Loading competencies" />;
  const { core, learner: L } = app;
  return (
    <div class="stack">
      {Object.entries(core.competencies).map(([id, name]) => {
        const e = L.derived.competencies[id];
        const mine = app.snap.attempts.filter((a) => a.competencies.includes(id)).sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
        const half = Math.floor(mine.length / 2);
        const avg = (xs: typeof mine) => (xs.length ? xs.reduce((s, a) => s + a.score, 0) / xs.length : null);
        const early = avg(mine.slice(0, half));
        const late = avg(mine.slice(half));
        const trend = mine.length >= 6 && early !== null && late !== null ? (late - early > 0.05 ? 'rising' : late - early < -0.05 ? 'falling' : 'steady') : 'not enough data';
        const cal = calibration(mine, core.engine);
        const topics = core.topics.filter((t) => t.comps.includes(id));
        return (
          <section class="card" key={id} id={id}>
            <h2>{id} {name}</h2>
            <div class="row"><StateBadge state={e.state} /> <span>Estimate {pct(e.E)} {e.E !== null ? `(range ${pct(e.lo)}–${pct(e.hi)})` : ''}</span> {e.lowEvidence ? <span class="badge warn">low evidence</span> : null}</div>
            <RangeBar e={e.E} lo={e.lo} hi={e.hi} label={name} />
            <p class="small muted">Trend: {trend}. Calibration: {calibrationLabel(cal.index, core.engine)}. Coverage: {e.coverage.touched} of {e.coverage.total} developing topics touched.</p>
            <details class="acc"><summary>Topics that develop this competency ({topics.length})</summary><div><ul>{topics.map((t) => <li key={t.id}><a href={topicUrl(t.id)}>{t.id} {t.title}</a> <StateBadge state={L.derived.topics[t.id].state} /></li>)}</ul></div></details>
          </section>
        );
      })}
    </div>
  );
}
