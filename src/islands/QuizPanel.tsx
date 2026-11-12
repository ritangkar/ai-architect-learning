import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Question } from '../lib/content/schemas';
import { caseUrl, topicUrl } from '../lib/url';
import { seededShuffle } from '../lib/engine/seed';
import { scoreResponse } from '../lib/engine/scoring';
import { pct } from './ui';

export interface QuizResult { response: any; score: number; confidence?: number; timeMs: number; optionOrder: string[] }
interface Props {
  q: Question;
  seed: string;
  heading?: string;
  /** called once on submit; the parent records the attempt */
  onSubmit: (r: QuizResult) => void | Promise<void>;
  onNext?: () => void;
  nextLabel?: string;
  extraFeedback?: any;
  askConfidence?: boolean;
}

export function QuizPanel({ q, seed, heading, onSubmit, onNext, nextLabel = 'Next', askConfidence = true }: Props) {
  const started = useRef(Date.now());
  const headRef = useRef<HTMLHeadingElement>(null);
  const fbRef = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [rats, setRats] = useState<string[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Record<string, number>>>({});
  const [marked, setMarked] = useState<string[]>([]);
  const [grade, setGrade] = useState<'known' | 'almost' | 'missed' | null>(null);
  const [conf, setConf] = useState<number | undefined>();
  const [free, setFree] = useState('');
  const [result, setResult] = useState<{ score: number } | null>(null);
  const [rubricChecked, setRubricChecked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { started.current = Date.now(); setPicked([]); setRats([]); setMatrix({}); setMarked([]); setGrade(null); setConf(undefined); setFree(''); setResult(null); setRubricChecked([]); headRef.current?.focus(); }, [q.id]);
  useEffect(() => { if (result) fbRef.current?.focus(); }, [result]);

  const order = useMemo(() => seededShuffle((q.options ?? []).map((o) => o.id), `${seed}|${q.id}`), [q.id, seed]);
  const options = order.map((id) => q.options!.find((o) => o.id === id)!).filter(Boolean);
  const multi = q.type === 'mcq' && Array.isArray(q.correct);
  const toggle = (arr: string[], set: (a: string[]) => void, id: string) => set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  const response = (): any => {
    switch (q.type) {
      case 'mcq': return { picked };
      case 'scenario': return { choice: picked[0], rationales: rats, justification: free || undefined, rubricChecked: rubricChecked.length ? rubricChecked : undefined };
      case 'decision_comparison': return { matrix };
      case 'architecture_review': return { marked, notes: free || undefined };
      case 'card': return { grade };
    }
  };
  const ready = q.type === 'mcq' ? picked.length > 0 : q.type === 'scenario' ? picked.length > 0 : q.type === 'card' ? grade !== null : true;
  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    const r = response();
    const score = scoreResponse(q as any, r);
    setResult({ score });
    await onSubmit({ response: r, score, confidence: conf, timeMs: Date.now() - started.current, optionOrder: order });
    setBusy(false);
  };
  const done = !!result;
  const choiceClass = (id: string, correct: boolean, isPicked: boolean) => `choice ${isPicked ? 'picked' : ''} ${done && correct ? 'correct' : ''} ${done && isPicked && !correct ? 'wrong' : ''}`;
  const correctSet = new Set(Array.isArray(q.correct) ? q.correct : [q.correct]);

  return (
    <section aria-labelledby={`qh-${q.id}`} class="stack">
      <h2 id={`qh-${q.id}`} tabIndex={-1} ref={headRef}>{heading ?? 'Question'}</h2>
      <p class="reading" style="max-width:none">{q.stem}</p>
      {q.to_verify ? <p class="callout warn" role="note"><span class="prov U">verify</span> This item depends on product availability or pricing that may have changed; check the SAP source before relying on it.</p> : null}
      {q.type === 'scenario' && q.constraints?.length ? (
        <div class="card"><strong>Constraints</strong><ul>{q.constraints.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
      ) : null}

      {(q.type === 'mcq' || q.type === 'scenario') && (
        <fieldset disabled={done} style="border:0;padding:0;margin:0">
          <legend class="visually-hidden">{multi ? 'Choose all that apply' : 'Choose one answer'}</legend>
          <p class="muted small" aria-hidden="true">{multi ? 'Choose all that apply.' : q.type === 'scenario' ? 'Choose the best option.' : 'Choose one answer.'}</p>
          <div class="stack" style="display:grid;gap:8px">
            {options.map((o) => {
              const isPicked = picked.includes(o.id);
              const good = q.type === 'scenario' ? o.id === q.correct : correctSet.has(o.id);
              return (
                <label key={o.id} class={choiceClass(o.id, good, isPicked)}>
                  <input type={multi ? 'checkbox' : 'radio'} name={`opt-${q.id}`} checked={isPicked} onChange={() => (multi ? toggle(picked, setPicked, o.id) : setPicked([o.id]))} />
                  <span>{o.text}{done && good ? <strong> (best answer)</strong> : null}{done && isPicked && !good ? <strong> (not the best answer)</strong> : null}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {q.type === 'scenario' && q.rationales?.length ? (
        <fieldset disabled={done} style="border:0;padding:0;margin:0">
          <legend><strong>Which reasons support your choice?</strong> <span class="muted small">Select all that apply.</span></legend>
          <div style="display:grid;gap:8px;margin-top:8px">
            {seededShuffle(q.rationales.map((r) => r.id), `${seed}|r|${q.id}`).map((id) => q.rationales!.find((r) => r.id === id)!).map((r) => {
              const isPicked = rats.includes(r.id);
              return (
                <label key={r.id} class={`choice ${isPicked ? 'picked' : ''} ${done && r.valid ? 'correct' : ''} ${done && isPicked && !r.valid ? 'wrong' : ''}`}>
                  <input type="checkbox" checked={isPicked} onChange={() => toggle(rats, setRats, r.id)} />
                  <span>{r.text}{done ? (r.valid ? <strong> (sound reason)</strong> : <strong> (weak or wrong reason)</strong>) : null}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {q.type === 'scenario' && (
        <div class="field">
          <label for={`free-${q.id}`}>Optional: write your justification</label>
          <textarea id={`free-${q.id}`} value={free} onInput={(e) => setFree((e.target as HTMLTextAreaElement).value)} disabled={done} aria-describedby={`freehelp-${q.id}`} />
          <p id={`freehelp-${q.id}`} class="muted small">Free text is <strong>not machine-graded</strong>. It stays on this device. After you submit you can compare it with the model answer and self-score it against the rubric; that self-score is shown to you but does not change your mastery estimate.</p>
        </div>
      )}

      {q.type === 'decision_comparison' && (
        <div class="table-wrap">
          <p class="muted small">Rate each option against each criterion from 1 (poor) to 5 (excellent). Criteria weights are shown.</p>
          <table>
            <thead><tr><th scope="col">Option</th>{q.criteria!.map((c) => <th scope="col" key={c.id}>{c.name} (weight {c.weight})</th>)}</tr></thead>
            <tbody>
              {q.options!.map((o) => (
                <tr key={o.id}>
                  <th scope="row">{o.text}</th>
                  {q.criteria!.map((c) => (
                    <td key={c.id}>
                      <label class="visually-hidden" for={`m-${q.id}-${o.id}-${c.id}`}>{o.text} on {c.name}</label>
                      <select id={`m-${q.id}-${o.id}-${c.id}`} disabled={done} value={matrix[o.id]?.[c.id] ?? ''} onChange={(e) => setMatrix({ ...matrix, [o.id]: { ...(matrix[o.id] ?? {}), [c.id]: Number((e.target as HTMLSelectElement).value) } })}>
                        <option value="">–</option>{[1, 2, 3, 4, 5].map((n) => <option value={n} key={n}>{n}</option>)}
                      </select>
                      {done ? <span class="small muted"> model: {q.model_scores?.[o.id]?.[c.id]}</span> : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {q.type === 'architecture_review' && (
        <div class="stack">
          <div class="card"><pre style="white-space:pre-wrap;font-family:var(--font-ui)">{q.design}</pre></div>
          <fieldset disabled={done} style="border:0;padding:0;margin:0">
            <legend><strong>Mark every statement that describes a real flaw or risk in this design.</strong></legend>
            <div style="display:grid;gap:8px;margin-top:8px">
              {q.checklist!.map((c) => {
                const isPicked = marked.includes(c.id);
                return (
                  <label key={c.id} class={`choice ${isPicked ? 'picked' : ''} ${done && c.flaw ? 'correct' : ''} ${done && isPicked && !c.flaw ? 'wrong' : ''}`}>
                    <input type="checkbox" checked={isPicked} onChange={() => toggle(marked, setMarked, c.id)} />
                    <span>{c.text}{done ? <strong>{c.flaw ? ' (real flaw)' : ' (not a flaw)'}</strong> : null}{done && c.explanation ? <span class="muted small"> {c.explanation}</span> : null}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>
      )}

      {q.type === 'card' && (
        <div class="stack">
          <p class="muted">Recall the answer, then rate yourself honestly.</p>
          {done ? <div class="card"><strong>Answer</strong><p>{q.model_answer ?? q.explanation}</p></div> : null}
          <fieldset style="border:0;padding:0;margin:0" disabled={done}>
            <legend class="visually-hidden">How well did you recall it?</legend>
            <div class="row">{(['known', 'almost', 'missed'] as const).map((g) => <label key={g} class={`choice ${grade === g ? 'picked' : ''}`}><input type="radio" name={`g-${q.id}`} checked={grade === g} onChange={() => setGrade(g)} />{g === 'known' ? 'I knew it' : g === 'almost' ? 'Almost' : 'I did not know it'}</label>)}</div>
          </fieldset>
        </div>
      )}

      {askConfidence && !done && (
        <fieldset style="border:0;padding:0;margin:0">
          <legend><strong>How confident are you?</strong> <span class="muted small">1 = guessing, 5 = certain. Used for calibration only.</span></legend>
          <div class="row" style="margin-top:8px">{[1, 2, 3, 4, 5].map((n) => <label key={n} class={`choice ${conf === n ? 'picked' : ''}`} style="min-width:56px;justify-content:center"><input type="radio" name={`c-${q.id}`} checked={conf === n} onChange={() => setConf(n)} />{n}</label>)}</div>
        </fieldset>
      )}

      {!done && <div><button type="button" class="btn primary" onClick={submit} disabled={!ready || busy}>Submit answer</button>{!ready ? <span class="muted small" style="margin-left:8px">Choose an answer to continue.</span> : null}</div>}

      {done && (
        <div ref={fbRef} tabIndex={-1} class="callout info" role="status" aria-live="polite" style="color:var(--accent)">
          <p><strong>Score for this item: {pct(result!.score)}.</strong> {result!.score >= 0.7 ? 'Solid.' : result!.score >= 0.4 ? 'Partly right.' : 'Not quite.'}</p>
          <p style="color:var(--text)">{q.explanation}</p>
          {q.model_answer && q.type !== 'card' ? <details open class="acc"><summary>Model answer</summary><div style="color:var(--text)"><p>{q.model_answer}</p></div></details> : null}
          {q.type === 'scenario' && q.rubric?.length && free.trim() ? (
            <fieldset style="border:0;padding:0;margin:8px 0 0"><legend style="color:var(--text)"><strong>Self-score your justification</strong> against the rubric (not machine-graded; not counted in mastery):</legend>
              {q.rubric.map((r) => <label class="choice" key={r.criterion} style="color:var(--text)"><input type="checkbox" checked={rubricChecked.includes(r.criterion)} onChange={() => toggle(rubricChecked, setRubricChecked, r.criterion)} />{r.criterion} ({r.points} pt)</label>)}
              <p style="color:var(--text)" class="small">Self-score: {rubricChecked.reduce((s, c) => s + (q.rubric!.find((r) => r.criterion === c)?.points ?? 0), 0)} of {q.rubric.reduce((s, r) => s + r.points, 0)} points.</p>
            </fieldset>
          ) : null}
          <p class="small" style="color:var(--text)">Related: {q.topics.map((t) => <a key={t} href={topicUrl(t)} style="margin-right:8px">topic {t}</a>)}{q.sourceCaseId ? <a href={caseUrl(q.sourceCaseId)}>case {q.sourceCaseId}</a> : null}</p>
          {onNext ? <button type="button" class="btn primary" onClick={onNext}>{nextLabel}</button> : null}
        </div>
      )}
    </section>
  );
}
