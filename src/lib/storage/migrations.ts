// Schema migration framework (AC-F16-3). The IndexedDB schema and the export format share one version number.
export const CURRENT_SCHEMA_VERSION = 1;

export interface Migration {
  from: number;
  to: number;
  description: string;
  /** Transform the data bag of an export/snapshot from `from` to `to`. Must be pure. */
  migrate(data: Record<string, any>): Record<string, any>;
}

/**
 * Registry. 1->2 is a deliberate stub that proves the machinery (it only stamps the data bag); it is not applied
 * to real data until CURRENT_SCHEMA_VERSION is raised to 2.
 */
export const MIGRATIONS: Migration[] = [
  { from: 1, to: 2, description: 'v1 -> v2 stub: no structural change, records the migration', migrate: (d) => ({ ...d, _migratedFrom: [...(d._migratedFrom ?? []), 1] }) },
];

export function runMigrations(data: Record<string, any>, from: number, to: number, registry: Migration[] = MIGRATIONS): Record<string, any> {
  if (from > to) throw new Error(`Cannot migrate backwards from v${from} to v${to}`);
  let v = from;
  let cur = data;
  while (v < to) {
    const m = registry.find((x) => x.from === v);
    if (!m) throw new Error(`No migration registered from schema v${v}`);
    cur = m.migrate(cur);
    v = m.to;
  }
  return cur;
}
