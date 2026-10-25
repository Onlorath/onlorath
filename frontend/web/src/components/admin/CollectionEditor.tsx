'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api/client';
import { errorMessage, move, type SaveStatus } from './fields';
import styles from './admin.module.css';

interface Row<I> {
  id?: string; // undefined until the row is created on the server
  data: I;
  dirty: boolean;
  status: SaveStatus;
}

interface Props<T extends { id: string }, I> {
  title: string;
  lead: string;
  /** e.g. "/admin/skills"; supports GET, POST, PUT /{id}, DELETE /{id}, PUT /reorder */
  endpoint: string;
  emptyItem: () => I;
  toInput: (item: T) => I;
  renderFields: (value: I, onChange: (value: I) => void) => ReactNode;
  addLabel: string;
  rowClassName?: (value: I) => string;
}

export function CollectionEditor<T extends { id: string }, I>({ title, lead, endpoint, emptyItem, toInput, renderFields, addLabel, rowClassName }: Props<T, I>) {
  const [rows, setRows] = useState<Row<I>[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<T[]>(endpoint).then(
      (items) => setRows(items.map((it) => ({ id: it.id, data: toInput(it), dirty: false, status: { kind: 'idle' } }))),
      (e) => setError(errorMessage(e)),
    );
  }, [endpoint]);

  const update = (i: number, patch: Partial<Row<I>>) => setRows((rs) => rs?.map((r, j) => (j === i ? { ...r, ...patch } : r)) ?? null);

  async function save(i: number) {
    const row = rows![i];
    update(i, { status: { kind: 'saving' } });
    try {
      const saved = row.id ? await api.put<T>(`${endpoint}/${row.id}`, row.data) : await api.post<T>(endpoint, row.data);
      update(i, { id: saved.id, data: toInput(saved), dirty: false, status: { kind: 'saved' } });
    } catch (e) {
      update(i, { status: { kind: 'error', message: errorMessage(e) } });
    }
  }

  async function remove(i: number) {
    const row = rows![i];
    if (row.id && !confirm('Bu öğe silinsin mi?')) return;
    try {
      if (row.id) await api.del(`${endpoint}/${row.id}`);
      setRows((rs) => rs?.filter((_, j) => j !== i) ?? null);
    } catch (e) {
      update(i, { status: { kind: 'error', message: errorMessage(e) } });
    }
  }

  async function reorder(from: number, to: number) {
    if (!rows) return;
    const next = move(rows, from, to);
    setRows(next);
    const ids = next.flatMap((r) => (r.id ? [r.id] : []));
    if (ids.length === 0) return;
    try {
      await api.put(`${endpoint}/reorder`, { ids });
    } catch (e) {
      setError(errorMessage(e));
      setRows(rows);
    }
  }

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>{title}</h1>
          <p className={styles.pageLead}>{lead}</p>
        </div>
        <button
          type="button"
          className="btn-pill btn-primary btn-sm"
          disabled={!rows}
          onClick={() => setRows((rs) => [...(rs ?? []), { data: emptyItem(), dirty: true, status: { kind: 'idle' } }])}
        >
          + {addLabel}
        </button>
      </div>

      {error && <p className={styles.err}>{error}</p>}
      {!rows && !error && <p className={styles.hint}>Yükleniyor…</p>}
      {rows?.length === 0 && <div className={styles.empty}>Henüz öğe yok.</div>}

      <div className={styles.repeater}>
        {rows?.map((row, i) => (
          <div key={row.id ?? `new-${i}`} className={`${styles.repeatItem} ${rowClassName?.(row.data) ?? ''}`} style={{ background: 'var(--surface)' }}>
            <div className={styles.repeatBody}>
              {renderFields(row.data, (data) => update(i, { data, dirty: true, status: { kind: 'idle' } }))}
              <div className={styles.headActions}>
                <button type="button" className="btn-pill btn-primary btn-xs" disabled={!row.dirty || row.status.kind === 'saving'} onClick={() => void save(i)}>
                  {row.status.kind === 'saving' ? 'Kaydediliyor…' : row.id ? 'Kaydet' : 'Oluştur'}
                </button>
                {!row.id && <span className={styles.badge}>Kaydedilmedi</span>}
                <span role="status" className={row.status.kind === 'error' ? styles.err : styles.ok}>
                  {row.status.kind === 'saved' && 'Kaydedildi ✓'}
                  {row.status.kind === 'error' && row.status.message}
                </span>
              </div>
            </div>
            <div className={styles.repeatTools}>
              <button type="button" className={styles.iconBtn} disabled={i === 0} onClick={() => void reorder(i, i - 1)} aria-label="Yukarı taşı">
                ↑
              </button>
              <button type="button" className={styles.iconBtn} disabled={i === rows.length - 1} onClick={() => void reorder(i, i + 1)} aria-label="Aşağı taşı">
                ↓
              </button>
              <button type="button" className={`${styles.iconBtn} ${styles.iconDanger}`} onClick={() => void remove(i)} aria-label="Sil">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
