import styles from './Logo.module.css';

export function Logo({ text }: { text: string }) {
  return (
    <span className={styles.logo}>
      <span aria-hidden="true" className={styles.mark}>
        <span style={{ background: 'var(--coral-strong)' }} />
        <span style={{ background: 'var(--butter-strong)' }} />
        <span style={{ background: 'var(--sage-strong)' }} />
        <span style={{ background: 'var(--sky-strong)' }} />
        <span style={{ background: 'var(--lavender-strong)' }} />
        <span style={{ background: 'var(--text-main)' }} />
      </span>
      <span className={`font-display ${styles.word}`}>{text}</span>
    </span>
  );
}
