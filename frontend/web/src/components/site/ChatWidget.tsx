'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatIcon, CloseIcon, SendIcon } from '@/components/icons';
import { apiRequest, ApiError } from '@/lib/api/client';
import type { ChatMessage, ChatResponse } from '@/lib/api/types';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Locale } from '@/lib/i18n';
import styles from './ChatWidget.module.css';

const SESSION_KEY = 'onlorath.chat.session';
const CONVERSATION_KEY = 'onlorath.chat.conversation';

// Storage can be unavailable (private mode, blocked cookies); the chat still works for the tab.
function readStore(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStore(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
  }
}

function sessionId(): string {
  let id = readStore(SESSION_KEY);
  if (!id) {
    // randomUUID only exists in secure contexts (HTTPS or localhost)
    id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    writeStore(SESSION_KEY, id);
  }
  return id;
}

type ErrorCode = keyof Dictionary['chat']['errors'];

export function ChatWidget({ locale, dict }: { locale: Locale; dict: Dictionary['chat'] }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [quotaReached, setQuotaReached] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const headers = useCallback(() => ({ 'X-Session-ID': sessionId() }), []);

  useEffect(() => {
    if (!open || loaded) return;
    setLoaded(true);
    const saved = readStore(CONVERSATION_KEY);
    if (!saved) return;
    apiRequest<ChatMessage[]>(`/chat/conversations/${saved}`, { headers: headers() })
      .then(({ data, headers: h }) => {
        setConversationId(saved);
        setMessages(data.map((m) => ({ role: m.role, content: m.content })));
        setQuotaReached(h.get('X-Chat-Quota-Exceeded') === 'true');
      })
      .catch(() => writeStore(CONVERSATION_KEY, null));
  }, [open, loaded, headers]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = inputRef.current?.value.trim();
    if (!text || pending || quotaReached) return;

    inputRef.current!.value = '';
    setError(null);
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setPending(true);
    try {
      const { data, headers: h } = await apiRequest<ChatResponse>('/chat/send', {
        method: 'POST',
        headers: headers(),
        body: { message: text, conversation_id: conversationId ?? '', locale },
      });
      setConversationId(data.conversation_id);
      writeStore(CONVERSATION_KEY, data.conversation_id);
      setMessages((m) => [...m, { role: 'model', content: data.reply }]);
      setQuotaReached(h.get('X-Chat-Quota-Exceeded') === 'true');
    } catch (err) {
      const code = err instanceof ApiError ? err.message : '';
      setError(code in dict.errors ? (code as ErrorCode) : 'generic');
      if (code === 'chat_quota_exceeded') setQuotaReached(true);
    } finally {
      setPending(false);
    }
  }

  function reset() {
    writeStore(CONVERSATION_KEY, null);
    setConversationId(null);
    setMessages([]);
    setError(null);
  }

  return (
    <div className={styles.root}>
      {open && (
        <section className={styles.panel} aria-label={dict.title}>
          <header className={styles.head}>
            <h2 className={`font-display ${styles.title}`}>{dict.title}</h2>
            <div className={styles.headActions}>
              {messages.length > 0 && (
                <button type="button" className={styles.textBtn} onClick={reset}>
                  {dict.reset}
                </button>
              )}
              <button type="button" className={styles.iconBtn} onClick={() => setOpen(false)} aria-label={dict.close}>
                <CloseIcon size={18} />
              </button>
            </div>
          </header>

          <div ref={listRef} className={styles.messages} aria-live="polite">
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className={styles.user}>
                  {m.content}
                </div>
              ) : (
                <div key={i} className={`prose ${styles.model}`}>
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ),
            )}
            {pending && <div className={`${styles.model} ${styles.typing}`}>{dict.thinking}</div>}
            {error && <div className={styles.error}>{dict.errors[error]}</div>}
          </div>

          <form className={styles.form} onSubmit={send}>
            <textarea
              ref={inputRef}
              className={`field ${styles.input}`}
              placeholder={dict.placeholder}
              rows={1}
              maxLength={1000}
              disabled={quotaReached}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button type="submit" className={styles.sendBtn} disabled={pending || quotaReached} aria-label={dict.send}>
              <SendIcon size={18} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className={`btn-pill ${open ? 'btn-secondary' : 'btn-primary'} ${styles.launcher}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <CloseIcon size={18} /> : <ChatIcon size={18} />}
        <span>{open ? dict.close : dict.open}</span>
      </button>
    </div>
  );
}
