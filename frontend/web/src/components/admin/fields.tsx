'use client';

import { useId, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api/client';
import { PASTELS, type LocalizedText, type Pastel } from '@/lib/api/types';
import { LOCALES, type Locale } from '@/lib/i18n';
import styles from './admin.module.css';

const PASTEL_NAMES: Record<Pastel, string> = { coral: 'Mercan', sky: 'Gök', butter: 'Tereyağı', lavender: 'Lavanta', sage: 'Adaçayı' };

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return err instanceof Error ? err.message : 'Bilinmeyen hata';
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  type?: string;
  placeholder?: string;
  mono?: boolean;
  required?: boolean;
}

export function TextField({ label, value, onChange, hint, type = 'text', placeholder, mono, required }: TextFieldProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        <span>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </label>
      <input
        id={id}
        type={type}
        className={`field ${mono ? 'font-mono' : ''}`}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

interface LocalizedFieldProps {
  label: string;
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  hint?: string;
  multiline?: boolean;
  rows?: number;
  mono?: boolean;
  placeholder?: string;
}

/** One input with TR / EN tabs; a red tab marks a language that is still empty. */
export function LocalizedField({ label, value, onChange, hint, multiline, rows = 4, mono, placeholder }: LocalizedFieldProps) {
  const [lang, setLang] = useState<Locale>('tr');
  const id = useId();
  const current = value?.[lang] ?? '';
  const set = (text: string) => onChange({ ...value, [lang]: text });
  const className = `field ${mono ? 'font-mono' : ''}`;

  return (
    <div className={styles.field}>
      <div className={styles.label}>
        <label htmlFor={id}>
          {label} {hint && <span className={styles.hint}>· {hint}</span>}
        </label>
        <span className={styles.langTabs} role="tablist" aria-label={`${label} dili`}>
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={l === lang}
              className={`${l === lang ? styles.langTabActive : styles.langTab} ${l !== lang && !value?.[l]?.trim() ? styles.langMissing : ''}`}
              onClick={() => setLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </span>
      </div>
      {multiline ? (
        <textarea id={id} className={className} rows={rows} value={current} placeholder={placeholder} onChange={(e) => set(e.target.value)} />
      ) : (
        <input id={id} className={className} value={current} placeholder={placeholder} onChange={(e) => set(e.target.value)} />
      )}
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={styles.toggle}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function ColorPicker({ label, value, onChange }: { label: string; value: Pastel; onChange: (v: Pastel) => void }) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.colors} role="radiogroup" aria-label={label}>
        {PASTELS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={c === value}
            title={PASTEL_NAMES[c]}
            aria-label={PASTEL_NAMES[c]}
            className={`pastel-${c} ${styles.swatch} ${c === value ? styles.swatchActive : ''}`}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
    </div>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

export function SelectField<T extends string>({ label, value, options, onChange }: SelectFieldProps<T>) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface UploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept: string;
  hint?: string;
  imagePreview?: boolean;
}

export function UploadField({ label, value, onChange, accept, hint, imagePreview }: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      onChange(await api.upload(file));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className={styles.field}>
      <TextField label={label} hint={hint} value={value} onChange={onChange} placeholder="https://… veya yükle" mono />
      <div className={styles.upload}>
        {imagePreview && value && (
          <img src={value} alt="" className={styles.uploadPreview} />
        )}
        <input ref={inputRef} type="file" accept={accept} onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
        <button type="button" className="btn-pill btn-secondary btn-xs" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? 'Yükleniyor…' : 'Dosya yükle'}
        </button>
        {value && (
          <a href={value} target="_blank" rel="noreferrer" className={styles.hint}>
            Aç ↗
          </a>
        )}
        {error && <span className={styles.err}>{error}</span>}
      </div>
    </div>
  );
}

export function OrderTools({ index, count, onMove, onRemove }: { index: number; count: number; onMove: (from: number, to: number) => void; onRemove?: () => void }) {
  return (
    <div className={styles.repeatTools}>
      <button type="button" className={styles.iconBtn} disabled={index === 0} onClick={() => onMove(index, index - 1)} aria-label="Yukarı taşı">
        ↑
      </button>
      <button type="button" className={styles.iconBtn} disabled={index === count - 1} onClick={() => onMove(index, index + 1)} aria-label="Aşağı taşı">
        ↓
      </button>
      {onRemove && (
        <button type="button" className={`${styles.iconBtn} ${styles.iconDanger}`} onClick={onRemove} aria-label="Sil">
          ✕
        </button>
      )}
    </div>
  );
}

export function move<T>(list: T[], from: number, to: number): T[] {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export type SaveStatus = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'error'; message: string };

export function SaveBar({ status, onSave, label = 'Kaydet', children }: { status: SaveStatus; onSave?: () => void; label?: string; children?: React.ReactNode }) {
  return (
    <div className={styles.saveBar}>
      <button type={onSave ? 'button' : 'submit'} className="btn-pill btn-primary btn-sm" disabled={status.kind === 'saving'} onClick={onSave}>
        {status.kind === 'saving' ? 'Kaydediliyor…' : label}
      </button>
      {children}
      <span role="status" className={status.kind === 'error' ? styles.err : styles.ok}>
        {status.kind === 'saved' && 'Kaydedildi ✓'}
        {status.kind === 'error' && status.message}
      </span>
    </div>
  );
}
