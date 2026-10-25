import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from 'next/font/google';

// latin-ext carries the Turkish glyphs (ç ğ ı İ ö ş ü).
export const displayFont = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext'],
  axes: ['opsz'],
  variable: '--font-display',
  display: 'swap',
});

export const bodyFont = Instrument_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-body',
  display: 'swap',
});

export const monoFont = JetBrains_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const fontVariables = `${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`;
