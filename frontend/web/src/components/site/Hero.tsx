import type { Profile } from '@/lib/api/types';
import { pick, type Locale } from '@/lib/i18n';
import { parseHeadline, renderInline } from '@/lib/richText';
import styles from './Hero.module.css';

export function Hero({ profile, locale }: { profile: Profile; locale: Locale }) {
  const lead = pick(profile.hero_lead, locale);
  const role = pick(profile.role_title, locale);
  const location = pick(profile.location_line, locale);

  return (
    <section className={styles.hero}>
      <h1 className={`font-display ${styles.headline}`}>
        {parseHeadline(pick(profile.hero_headline, locale)).map((seg, i) =>
          seg.kind === 'text' ? (
            seg.text
          ) : (
            <span key={i} className={`pastel-${seg.color} ${styles.highlight} ${seg.tilted ? styles.tilted : ''}`}>
              {seg.text}
            </span>
          ),
        )}
      </h1>

      {(lead || role || location) && (
        <div className={styles.meta}>
          <p className={styles.lead}>{renderInline(lead, styles.leadStrong)}</p>
          <div className={styles.role}>
            {role && <span className={`font-display ${styles.roleTitle}`}>{role}</span>}
            {location && <span className={styles.location}>{location}</span>}
          </div>
        </div>
      )}
    </section>
  );
}
