import { emptySnapshot, type KV, type Snapshot } from './types';

export async function readSnapshot(kv: KV): Promise<Snapshot> {
  const [profile, attempts, cardState, caseProgress, notes, events, settings] = await Promise.all([
    kv.get('profile', 'profile'), kv.getAll('attempts'), kv.getAll('cardState'), kv.getAll('caseProgress'), kv.getAll('notes'), kv.getAll('events'), kv.get('settings', 'settings'),
  ]);
  return { ...emptySnapshot(), profile: profile ?? null, attempts, cardState, caseProgress, notes, events, settings: settings ?? null };
}
/** Replace all user data in the store with the snapshot (derived topicState is cleared and rebuilt by the app). */
export async function writeSnapshot(kv: KV, s: Snapshot): Promise<void> {
  for (const st of ['profile', 'attempts', 'topicState', 'cardState', 'caseProgress', 'notes', 'events', 'settings'] as const) await kv.clear(st);
  if (s.profile) await kv.put('profile', s.profile);
  if (s.settings) await kv.put('settings', s.settings);
  await kv.putMany('attempts', s.attempts);
  await kv.putMany('cardState', s.cardState);
  await kv.putMany('caseProgress', s.caseProgress);
  await kv.putMany('notes', s.notes);
  await kv.putMany('events', s.events);
}

/** Replace with rollback: if writing the new data fails, the previous data is written back. */
export async function replaceSafely(kv: KV, next: Snapshot): Promise<void> {
  const prev = await readSnapshot(kv);
  try {
    await writeSnapshot(kv, next);
  } catch (e) {
    await writeSnapshot(kv, prev);
    throw e;
  }
}
