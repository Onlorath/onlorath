'use client';

import { useEffect, useRef, useState } from 'react';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Pastel } from '@/lib/api/types';
import styles from './BalloonGame.module.css';

const BALLOONS: { left: string; top: number; delay: string; color: Pastel; w: number; h: number }[] = [
  { left: '8%', top: 90, delay: '0s', color: 'coral', w: 60, h: 76 },
  { left: '24%', top: 135, delay: '0.8s', color: 'sky', w: 62, h: 78 },
  { left: '40%', top: 75, delay: '1.4s', color: 'butter', w: 58, h: 74 },
  { left: '56%', top: 130, delay: '0.4s', color: 'lavender', w: 64, h: 80 },
  { left: '72%', top: 80, delay: '1.1s', color: 'sage', w: 58, h: 74 },
  { left: '86%', top: 140, delay: '1.7s', color: 'coral', w: 60, h: 76 },
];

function usePopSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  useEffect(() => () => void ctxRef.current?.close(), []);

  return () => {
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = (ctxRef.current ??= new Ctor());
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // audio blocked or unsupported
    }
  };
}

interface Props {
  caption: string;
  dict: Dictionary['balloons'];
}

export function BalloonGame({ caption, dict }: Props) {
  const [popped, setPopped] = useState<boolean[]>(() => BALLOONS.map(() => false));
  const [done, setDone] = useState(false);
  const playPop = usePopSound();
  const score = popped.filter(Boolean).length;

  useEffect(() => {
    if (score < BALLOONS.length) return;
    const t = setTimeout(() => setDone(true), 400);
    return () => clearTimeout(t);
  }, [score]);

  const pop = (i: number) => {
    if (popped[i]) return;
    playPop();
    setPopped((prev) => prev.map((p, j) => p || j === i));
  };

  const reset = () => {
    setPopped(BALLOONS.map(() => false));
    setDone(false);
  };

  return (
    <div className={styles.game}>
      <div className={styles.bar}>
        <span className={styles.caption}>{caption}</span>
        <div className={styles.score} aria-live="polite">
          <span className={styles.scoreLabel}>{dict.score}</span>
          <span className={`font-display ${styles.scoreValue}`}>{score}</span>
          <span className={`font-mono ${styles.scoreTotal}`}>/ {BALLOONS.length}</span>
        </div>
      </div>

      <div className={styles.area}>
        {BALLOONS.map((b, i) =>
          popped[i] ? (
            <span key={i} className={`font-display ${styles.pof}`} style={{ left: b.left, top: b.top }} aria-hidden="true">
              {dict.pop}
            </span>
          ) : (
            <div
              key={i}
              className={styles.wrapper}
              style={{ left: `min(${b.left}, calc(100% - ${b.w + 12}px))`, top: b.top, animationDelay: b.delay }}
            >
              <button
                type="button"
                className={`pastel-${b.color} ${styles.balloon}`}
                style={{ width: b.w, height: b.h }}
                onClick={() => pop(i)}
                aria-label={`${dict.balloon} ${i + 1}`}
              >
                <span className={styles.shine} />
              </button>
              <div className={styles.string} />
            </div>
          ),
        )}
      </div>

      {done && (
        <div className={styles.complete} role="status">
          <span className={`font-display ${styles.completeTitle}`}>{dict.doneTitle}</span>
          <button type="button" className="btn-pill btn-secondary btn-xs" onClick={reset} style={{ marginTop: 10 }}>
            {dict.restart}
          </button>
        </div>
      )}
    </div>
  );
}
