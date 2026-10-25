import type { Dictionary } from '@/i18n/dictionaries';
import type { Experience, Profile, Skill } from '@/lib/api/types';
import { pick, type Locale } from '@/lib/i18n';
import { renderInline } from '@/lib/richText';
import styles from './About.module.css';

interface Props {
  profile: Profile;
  experiences: Experience[];
  skills: Skill[];
  locale: Locale;
  dict: Dictionary;
}

export function About({ profile, experiences, skills, locale, dict }: Props) {
  const paragraphs = profile.about_paragraphs.map((p) => pick(p, locale)).filter(Boolean);

  return (
    <section id="about" className={styles.section}>
      <div className={styles.intro}>
        <h2 className={`font-display ${styles.title}`}>{pick(profile.about_title, locale) || dict.nav.about}</h2>
        {paragraphs.map((text, i) => (
          <p key={i} className={i === 0 ? styles.first : styles.rest}>
            {renderInline(text)}
          </p>
        ))}

        {skills.length > 0 && (
          <ul className={styles.skills} aria-label={dict.about.skills}>
            {skills.map((s) => (
              <li key={s.id} className="tag-chip font-mono">
                {s.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {experiences.length > 0 && (
        <div className={styles.timelineCol}>
          <h3 className={`font-display ${styles.journey}`}>{dict.about.journey}</h3>
          <ol className={styles.timeline}>
            {experiences.map((e) => (
              <li key={e.id} className={`pastel-${e.color} ${styles.item}`}>
                <span className={`font-mono ${styles.period}`}>{pick(e.period, locale)}</span>
                <div>
                  <span className={`font-display ${styles.itemTitle}`}>{e.title}</span>
                  <span className={styles.itemSub}>{pick(e.subtitle, locale)}</span>
                </div>
                {pick(e.tag, locale) && <span className={styles.tag}>{pick(e.tag, locale)}</span>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
