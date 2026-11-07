'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CloseIcon, MenuIcon } from '@/components/icons';
import styles from './SiteHeader.module.css';

interface Props {
  label: string;
  openLabel: string;
  closeLabel: string;
  children: ReactNode;
}

// On wide screens the nav is always visible and the toggle is hidden (CSS).
// On phones the links collapse behind a menu button so the header takes one row.
export function NavMenu({ label, openLabel, closeLabel, children }: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls="site-nav"
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
      </button>

      <nav
        id="site-nav"
        aria-label={label}
        className={`${styles.nav} ${open ? styles.navOpen : ''}`}
        // Close after following an in-page anchor so the target isn't hidden behind the menu.
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('a')) setOpen(false);
        }}
      >
        {children}
      </nav>
    </>
  );
}
