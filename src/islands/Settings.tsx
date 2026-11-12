import { useRef, useState } from 'preact/hooks';
import { useApp } from '../lib/app/hooks';
import type { ImportResult } from '../lib/backup';
import { ErrorBox, Loading, download, toast } from './ui';

export default function Settings() {
  const { app, error } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [imp, setImp] = useState<ImportResult | null>(null);
  const [preBackup, setPreBackup] = useState(true);
  const [msg, setMsg] = useState('');
  const [confirmText, setConfirmText] = useState('');
  if (error) return <ErrorBox error={error} />;
  if (!app) return <Loading what="Loading settings" />;
  const s = app.settings;
  const counts = app.storedCounts();
  const bk = app.backupStatus();
  const onFile = async (e: Event) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    setMsg('');
    if (!f) return;
    if (f.size > app.core.engine.import_max_bytes) { setImp({ ok: false, code: 'too_large', message: `The file is ${(f.size / 1048576).toFixed(1)} MB; the limit is ${(app.core.engine.import_max_bytes / 1048576).toFixed(0)} MB. Nothing was changed.` }); return; }
    setImp(await app.previewImport(await f.text()));
  };
  const doImport = async (mode: 'replace' | 'merge') => {
    if (!imp || !imp.ok) return;
    try {
      if (preBackup) { const cur = await app.exportData(); download(cur.filename.replace('.json', '-before-import.json'), cur.text); }
      await app.applyImport(imp, mode);
      setMsg(`Import complete (${mode}). ${imp.preview.attempts} attempts in the file.`);
      setImp(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e: any) { setMsg(`Import failed and your previous data was restored: ${e.message}`); }
  };
  const num = (k: keyof typeof s) => (e: Event) => app.updateSettings({ [k]: Number((e.target as HTMLInputElement).value) } as any);
  return (
    <div class="stack">
      <h1>Settings</h1>
      {app.mode === 'session' ? <div class="banner warn" role="alert"><p><strong>Session-only mode.</strong> Storage is unavailable ({app.storageError ?? 'blocked'}). Your progress is in memory only. Export it before leaving.</p></div> : <p class="muted small">Storage: IndexedDB database "architect-lab" (schema v{app.meta.schemaVersion}) on this device.</p>}

      <section class="card stack" aria-labelledby="pref"><h2 id="pref">Preferences</h2>
        <div class="field"><label for="theme">Theme</label><select id="theme" value={s.theme} onChange={(e) => app.updateSettings({ theme: (e.target as HTMLSelectElement).value as any })}><option value="system">Follow my system</option><option value="light">Light</option><option value="dark">Dark</option></select></div>
        <div class="field"><label for="motion">Reduced motion</label><select id="motion" value={s.reducedMotion} onChange={(e) => app.updateSettings({ reducedMotion: (e.target as HTMLSelectElement).value as any })}><option value="system">Follow my system</option><option value="on">Always reduce</option><option value="off">Allow animation</option></select></div>
        <div class="field"><label for="density">Density</label><select id="density" value={s.density} onChange={(e) => app.updateSettings({ density: (e.target as HTMLSelectElement).value as any })}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></div>
        <div class="field"><label for="depth">Default lesson depth</label><select id="depth" value={s.defaultDepth} onChange={(e) => app.updateSettings({ defaultDepth: (e.target as HTMLSelectElement).value as any })}><option value="auto">Assigned by my evidence</option><option value="compress">Always compress</option><option value="standard">Always standard</option><option value="deep">Always deep</option></select></div>
        <div class="field"><label for="mins">Session length hint (minutes, advisory)</label><input id="mins" type="number" min={15} max={480} step={15} value={s.sessionMinutes} onChange={num('sessionMinutes')} /></div>
        <label class="choice"><input type="checkbox" checked={s.showStreak} onChange={(e) => app.updateSettings({ showStreak: (e.target as HTMLInputElement).checked })} /><span>Show my active-day streak (never blocks or scolds; missed days have no penalty)</span></label>
      </section>

      <section class="card stack" aria-labelledby="bk"><h2 id="bk">Backup and restore</h2>
        <p><strong>Your data lives only in this browser profile on this device.</strong> Clearing site data or switching device loses it unless you restore from a backup. There is no automatic sync and no server.</p>
        <p class="small muted">{bk.reason}{app.meta.lastExportAt ? ` Last export: ${app.meta.lastExportAt.slice(0, 10)}.` : ''}</p>
        <div><button class="btn primary" type="button" onClick={async () => { const { filename, text } = await app.exportData(); download(filename, text); toast('Backup downloaded'); }}>Export progress (JSON)</button></div>
        <hr style="width:100%;border:0;border-top:1px solid var(--border)" />
        <div class="field"><label for="imp">Import a backup file</label><input id="imp" type="file" accept="application/json,.json" ref={fileRef} onChange={onFile} /></div>
        {imp && !imp.ok ? <div class="banner warn" role="alert"><p><strong>Import rejected.</strong> {imp.message}</p></div> : null}
        {imp && imp.ok ? (
          <div class="callout info" role="status" style="color:var(--accent)">
            <p style="color:var(--text)"><strong>This file is valid.</strong> It contains {imp.preview.attempts} attempts, {imp.preview.assessmentRuns} assessment run(s), {imp.preview.revisionCards} revision card(s), {imp.preview.caseRecords} case record(s) and {imp.preview.notesAndExercises} note(s)/exercise(s). Content version {imp.export.contentVersion}.</p>
            {imp.warnings.map((w) => <p key={w} style="color:var(--text)">{w}</p>)}
            <label class="choice" style="color:var(--text)"><input type="checkbox" checked={preBackup} onChange={(e) => setPreBackup((e.target as HTMLInputElement).checked)} /><span>Download a backup of my current data first (recommended)</span></label>
            <div class="row" style="margin-top:8px"><button class="btn" type="button" onClick={() => doImport('merge')}>Merge into current data</button><button class="btn danger" type="button" onClick={() => doImport('replace')}>Replace current data</button></div>
            <p class="small" style="color:var(--text)">Merge keeps the union of attempts (no duplicates) and the most recently updated copy of everything else. Replace discards current data after the optional backup.</p>
          </div>
        ) : null}
        {msg ? <p role="status">{msg}</p> : null}
      </section>

      <section class="card stack" aria-labelledby="raw"><h2 id="raw">What is stored</h2>
        <dl class="kv">{Object.entries(counts).map(([k, v]) => <><dt key={k + 't'}>{k}</dt><dd key={k + 'd'}>{v}</dd></>)}</dl>
        <details class="acc"><summary>Limits you should know about</summary><div>
          <ul><li>Mastery is estimated from assessment and exercise evidence only. Lesson views, video views and "mark as read" never raise it.</li><li>Scenario free text is not machine-graded; self-scores are shown but not counted.</li><li>Thresholds are tunable heuristics, not certifications. Ranges widen when evidence is thin.</li><li>SAP product availability and pricing change quickly; check the freshness page and cited sources.</li><li>Regulatory content is educational, not legal advice.</li></ul></div></details>
      </section>

      <section class="card stack" aria-labelledby="rs"><h2 id="rs">Reset everything</h2>
        <p>This erases all progress, notes and settings from this browser. Export a backup first. Type <code>RESET</code> to enable the button.</p>
        <div class="field"><label for="rst">Confirmation</label><input id="rst" type="text" value={confirmText} onInput={(e) => setConfirmText((e.target as HTMLInputElement).value)} autocomplete="off" /></div>
        <div><button class="btn danger" type="button" disabled={confirmText !== 'RESET'} onClick={async () => { await app.resetAll(); setConfirmText(''); toast('All data erased'); }}>Erase all data</button></div>
      </section>
    </div>
  );
}
