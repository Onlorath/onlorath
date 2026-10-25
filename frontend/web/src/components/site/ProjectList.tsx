'use client';

import { useState } from 'react';
import { ArrowRightIcon, PlusIcon } from '@/components/icons';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Project, ProjectCategory } from '@/lib/api/types';
import { pick, type Locale } from '@/lib/i18n';
import { ProjectMedia } from './ProjectMedia';
import styles from './ProjectList.module.css';

type Filter = 'all' | ProjectCategory;

interface Props {
  projects: Project[];
  locale: Locale;
  dict: Dictionary;
}

function linkProps(url: string) {
  return /^https?:\/\//.test(url) ? { target: '_blank', rel: 'noreferrer' } : {};
}

export function ProjectList({ projects, locale, dict }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<string | null>(projects[0]?.id ?? null);

  const visible = projects.filter((p) => filter === 'all' || p.category === filter);
  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: dict.projects.all },
    { key: 'game', label: dict.projects.games },
    { key: 'software', label: dict.projects.software },
  ];

  return (
    <section id="projects" className={styles.section}>
      <div className={styles.head}>
        <div className={styles.titleRow}>
          <h2 className={`font-display ${styles.title}`}>{dict.projects.title}</h2>
          <span className={`font-mono ${styles.count}`}>({String(projects.length).padStart(2, '0')})</span>
        </div>

        <div role="group" aria-label={dict.projects.filterLabel} className={styles.filters}>
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`filter-btn ${filter === f.key ? 'active' : ''}`}
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.list}>
        {visible.length === 0 && <p className={styles.empty}>{dict.projects.empty}</p>}

        {visible.map((p) => {
          const index = projects.indexOf(p) + 1;
          const isOpen = openId === p.id;
          const bodyId = `project-${p.id}`;
          const status = pick(p.status_label, locale);

          return (
            <div key={p.id} className={`pastel-${p.color} ${styles.row} ${isOpen ? styles.open : ''}`}>
              <button
                type="button"
                className={styles.header}
                aria-expanded={isOpen}
                aria-controls={bodyId}
                onClick={() => setOpenId(isOpen ? null : p.id)}
              >
                <span className={`font-mono ${styles.number}`}>{String(index).padStart(2, '0')}</span>
                <span aria-hidden="true" className={styles.square} />
                <span className={`font-display ${styles.name}`}>{pick(p.title, locale)}</span>
                <span className={styles.platform}>{pick(p.platform, locale)}</span>
                {status && (
                  <span className={`tag-chip ${styles.status}`}>
                    <span className="tag-dot" />
                    {status}
                  </span>
                )}
                <PlusIcon className={styles.plus} />
                <span className="sr-only">{isOpen ? dict.projects.collapse : dict.projects.expand}</span>
              </button>

              {isOpen && (
                <div id={bodyId} className={styles.body}>
                  <ProjectMedia media={p.media} locale={locale} dict={dict} />

                  <div className={styles.details}>
                    <div>
                      <p className={styles.description}>{pick(p.description, locale)}</p>
                      {p.meta.length > 0 && (
                        <dl className={styles.meta}>
                          {p.meta.map((m, i) => (
                            <div key={i} className={styles.metaRow}>
                              <dt className={styles.metaLabel}>{pick(m.label, locale)}</dt>
                              <dd className={m.mono ? `font-mono ${styles.metaMono}` : styles.metaValue}>{pick(m.value, locale)}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>

                    {p.actions.length > 0 && (
                      <div className={styles.actions}>
                        {p.actions.map((a, i) => (
                          <a key={i} href={a.url} className={`btn-pill btn-${a.variant}`} {...linkProps(a.url)}>
                            {pick(a.label, locale)}
                            {a.variant === 'primary' && i === 0 && p.actions.length > 1 && <ArrowRightIcon />}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
