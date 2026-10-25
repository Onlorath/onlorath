'use client';

import { useId, useState, type FormEvent } from 'react';
import { api, ApiError } from '@/lib/api/client';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Locale } from '@/lib/i18n';
import styles from './ContactForm.module.css';

type Status = 'idle' | 'sending' | 'sent' | 'error' | 'rate';

export function ContactForm({ locale, dict }: { locale: Locale; dict: Dictionary['contact'] }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const id = useId();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus('sending');
    try {
      await api.post('/contact', {
        name: String(data.get('name') ?? ''),
        email: String(data.get('email') ?? ''),
        message: String(data.get('message') ?? ''),
        honeypot: String(data.get('website') ?? ''),
        locale,
      });
      form.reset();
      setStatus('sent');
    } catch (err) {
      setStatus(err instanceof ApiError && err.status === 429 ? 'rate' : 'error');
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn-pill btn-primary btn-sm"
        aria-expanded={open}
        aria-controls={`${id}-form`}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? dict.closeForm : dict.openForm}
      </button>

      {open && (
        <form id={`${id}-form`} className={styles.form} onSubmit={onSubmit}>
          <div className={styles.row}>
            <label className={styles.label}>
              <span>{dict.name}</span>
              <input name="name" className="field" required maxLength={100} autoComplete="name" />
            </label>
            <label className={styles.label}>
              <span>{dict.email}</span>
              <input name="email" type="email" className="field" required maxLength={255} autoComplete="email" />
            </label>
          </div>
          <label className={styles.label}>
            <span>{dict.message}</span>
            <textarea name="message" className="field" required maxLength={2000} rows={5} />
          </label>
          {/* Honeypot: hidden from people, filled by naive bots */}
          <input name="website" tabIndex={-1} autoComplete="off" className={styles.honeypot} aria-hidden="true" />

          <div className={styles.footer}>
            <button type="submit" className="btn-pill btn-primary" disabled={status === 'sending'}>
              {status === 'sending' ? dict.sending : dict.send}
            </button>
            <p role="status" className={status === 'sent' ? styles.ok : styles.err}>
              {status === 'sent' && dict.sent}
              {status === 'error' && dict.error}
              {status === 'rate' && dict.rateLimited}
            </p>
          </div>
        </form>
      )}
    </>
  );
}
