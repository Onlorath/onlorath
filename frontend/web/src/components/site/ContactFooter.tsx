import type { Dictionary } from '@/i18n/dictionaries';
import type { Profile, SocialLink } from '@/lib/api/types';
import { pick, type Locale } from '@/lib/i18n';
import { ContactForm } from './ContactForm';
import styles from './ContactFooter.module.css';

interface Props {
  profile: Profile;
  socials: SocialLink[];
  locale: Locale;
  dict: Dictionary;
}

export function ContactFooter({ profile, socials, locale, dict }: Props) {
  const lead = pick(profile.contact_lead, locale);
  const note = pick(profile.footer_note, locale);
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className={styles.footer}>
      {lead && <p className={styles.lead}>{lead}</p>}

      {profile.email && (
        <a href={`mailto:${profile.email}`} className={`font-display ${styles.email}`}>
          {profile.email}
        </a>
      )}

      <div className={styles.actions}>
        <ContactForm locale={locale} dict={dict.contact} />
        <a href="/api/v1/cv" target="_blank" rel="noreferrer" className="btn-pill btn-secondary btn-sm">
          {dict.contact.cv}
        </a>
      </div>

      <div className={styles.bottom}>
        <nav aria-label={dict.footer.social} className={styles.socials}>
          {socials.map((s) => (
            <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="nav-link">
              {s.label}
            </a>
          ))}
        </nav>

        <span className={styles.note}>
          &copy; {year} {profile.name}
          {note && <> &middot; {note}</>}
        </span>
      </div>
    </footer>
  );
}
