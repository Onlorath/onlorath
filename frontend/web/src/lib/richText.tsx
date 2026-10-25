import { Fragment, type ReactNode } from 'react';
import { PASTELS, type Pastel } from './api/types';

// Inline markup used in editable texts:
//   [[sky:word]]    pastel highlight chip in the hero headline
//   [[coral~:word]] the same, tilted
//   **bold**        strong text in leads and paragraphs

export type HeadlineSegment =
  | { kind: 'text'; text: string }
  | { kind: 'highlight'; text: string; color: Pastel; tilted: boolean };

const HIGHLIGHT = /\[\[([a-z]+)(~?):([^\]]+)\]\]/g;

export function parseHeadline(input: string): HeadlineSegment[] {
  const out: HeadlineSegment[] = [];
  let last = 0;
  for (const m of input.matchAll(HIGHLIGHT)) {
    const [whole, color, tilt, text] = m;
    const index = m.index ?? 0;
    if (index > last) out.push({ kind: 'text', text: input.slice(last, index) });
    if ((PASTELS as readonly string[]).includes(color)) {
      out.push({ kind: 'highlight', text, color: color as Pastel, tilted: tilt === '~' });
    } else {
      out.push({ kind: 'text', text }); // unknown color: keep the word, drop the markup
    }
    last = index + whole.length;
  }
  if (last < input.length) out.push({ kind: 'text', text: input.slice(last) });
  return out;
}

export function renderInline(input: string, boldClassName?: string): ReactNode {
  const parts = input.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className={boldClassName}>
        {part}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
