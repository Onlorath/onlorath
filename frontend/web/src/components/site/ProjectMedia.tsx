import { PlaceholderGlyph } from '@/components/icons';
import type { Dictionary } from '@/i18n/dictionaries';
import type { ProjectMedia as Media } from '@/lib/api/types';
import { pick, type Locale } from '@/lib/i18n';
import { BalloonGame } from './BalloonGame';
import styles from './ProjectMedia.module.css';

interface Props {
  media: Media;
  locale: Locale;
  dict: Dictionary;
}

export function ProjectMedia({ media, locale, dict }: Props) {
  const caption = pick(media.caption, locale);
  const height = media.height || (media.type === 'builtin' ? 350 : 320);
  const style = { height } as const;

  switch (media.type) {
    case 'builtin':
      if (media.key === 'balloons') {
        return (
          <div className={styles.frame} style={style}>
            <BalloonGame caption={caption} dict={dict.balloons} />
          </div>
        );
      }
      break;

    case 'iframe':
      return (
        <div className={styles.frame} style={style}>
          <iframe
            src={media.url}
            title={caption || 'Demo'}
            className={styles.fill}
            loading="lazy"
            allow="fullscreen; autoplay; gamepad; pointer-lock"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups allow-forms"
          />
        </div>
      );

    case 'image':
      return (
        <figure className={styles.frame} style={style}>
          <img src={media.url} alt={caption} className={`${styles.fill} ${styles.cover}`} loading="lazy" />
        </figure>
      );

    case 'video':
      return (
        <div className={styles.frame} style={style}>
          <video src={media.url} className={`${styles.fill} ${styles.cover}`} controls playsInline preload="metadata" aria-label={caption} />
        </div>
      );
  }

  return (
    <div className={`${styles.frame} ${styles.placeholder}`} style={style}>
      <PlaceholderGlyph icon={media.icon} className={styles.glyph} />
      {caption && <span className={styles.caption}>{caption}</span>}
    </div>
  );
}
