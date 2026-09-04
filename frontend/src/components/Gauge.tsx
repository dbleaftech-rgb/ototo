import React, { useEffect, useRef } from 'react';

interface GaugeProps {
  score: number;
  floorScore?: number;
  ceilScore?: number;
  hasRange?: boolean;
  scale?: number;
  animate?: boolean;
}

export const Gauge: React.FC<GaugeProps> = ({
  score,
  floorScore = 68,
  ceilScore = 95,
  hasRange = true,
  scale = 1.0,
  animate = true,
}) => {
  const SEGS = 31;
  const fTick = Math.round(((SEGS - 1) * floorScore) / 100);
  const cTick = Math.round(((SEGS - 1) * ceilScore) / 100);

  const INK = '#0E0F11';
  const TKIN = 'rgba(14, 15, 17, 0.35)';
  const TKOUT = 'rgba(14, 15, 17, 0.1)';

  const scoreRef = useRef<HTMLDivElement>(null);
  const tickRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const scoreEl = scoreRef.current;
    const ticks = tickRefs.current;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const fill = (pct: number) => {
      const f = (pct / 100) * (SEGS - 1);
      ticks.forEach((t, i) => {
        if (!t) return;
        const isB = hasRange && (i === fTick || i === cTick);
        const inR = hasRange ? i >= fTick && i <= cTick : true;
        const k = isB ? 'bound' : inR ? 'in' : 'out';

        const bg = k === 'bound' ? INK : i <= f ? INK : k === 'in' ? TKIN : TKOUT;
        t.style.background = bg;
      });
    };

    if (!animate || prefersReduced || score === undefined || score === null) {
      fill(score || 0);
      if (scoreEl) {
        scoreEl.textContent = String(score || 0);
        scoreEl.style.opacity = '1';
      }
      return;
    }

    // Two-phase dashboard self-test animation (authentic Ototo ring animation):
    // Phase 1: 0 -> 100 (580ms, ease-out quad)
    // Phase 2: 100 -> score (720ms, ease-out cubic)
    let animId: number;
    const dur1 = 580;
    const dur2 = 720;
    let phase = 1;
    let t0 = performance.now();

    if (scoreEl) {
      scoreEl.style.opacity = '0.35';
      scoreEl.textContent = '0';
    }
    fill(0);

    const frame = (now: number) => {
      const elapsed = now - t0;

      if (phase === 1) {
        const p = Math.min(1, elapsed / dur1);
        const e = 1 - Math.pow(1 - p, 2);
        const current = 100 * e;
        fill(current);
        if (scoreEl) scoreEl.textContent = String(Math.round(current));

        if (p < 1) {
          animId = requestAnimationFrame(frame);
        } else {
          phase = 2;
          t0 = performance.now();
          if (scoreEl) {
            scoreEl.style.transition = 'opacity .35s ease';
            scoreEl.style.opacity = '1';
          }
          animId = requestAnimationFrame(frame);
        }
      } else {
        const p = Math.min(1, elapsed / dur2);
        const e = 1 - Math.pow(1 - p, 3);
        const current = 100 + (score - 100) * e;
        fill(current);
        if (scoreEl) scoreEl.textContent = String(Math.round(current));

        if (p < 1) {
          animId = requestAnimationFrame(frame);
        } else {
          fill(score);
          if (scoreEl) scoreEl.textContent = String(score);
        }
      }
    };

    animId = requestAnimationFrame(frame);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [score, floorScore, ceilScore, hasRange, animate]);

  const ticks: React.ReactNode[] = [];
  const finalF = (score / 100) * (SEGS - 1);
  for (let i = 0; i < SEGS; i++) {
    const ang = -80 + i * (160 / (SEGS - 1));
    const isB = hasRange && (i === fTick || i === cTick);
    const inR = hasRange ? i >= fTick && i <= cTick : true;
    const major = i % 5 === 0;
    const h = (isB ? 23 : major ? 16 : 10) * scale;
    const w = (isB ? 2.5 : major ? 2.6 : 1.8) * scale;
    const off = (isB ? -97 : major ? -100 : -104) * scale;
    const initialBg = isB ? INK : i <= finalF ? INK : inR ? TKIN : TKOUT;

    ticks.push(
      <div
        key={i}
        ref={(el) => {
          tickRefs.current[i] = el;
        }}
        data-tick={i}
        data-tk={isB ? 'bound' : inR ? 'in' : 'out'}
        style={{
          position: 'absolute',
          left: '50%',
          bottom: `${8 * scale}px`,
          width: `${w}px`,
          height: `${h}px`,
          transformOrigin: '50% 100%',
          transform: `translateX(-50%) rotate(${ang}deg) translateY(${off}px)`,
          background: initialBg,
          transition: 'background .25s cubic-bezier(.22,.9,.24,1)',
        }}
      />
    );
  }

  const boundLabels: React.ReactNode[] = [];
  if (hasRange) {
    [floorScore, ceilScore].forEach((v, idx) => {
      const r = ((-80 + (v / 100) * 160) * Math.PI) / 180;
      const x = (130 * scale * Math.sin(r)).toFixed(1);
      const y = (-130 * scale * Math.cos(r)).toFixed(1);
      boundLabels.push(
        <div
          key={idx}
          style={{
            position: 'absolute',
            left: '50%',
            bottom: `${8 * scale}px`,
            transform: `translate(calc(-50% + ${x}px), ${y}px)`,
            font: `700 ${10.5 * scale}px/1 Heebo, sans-serif`,
            color: 'rgba(14, 15, 17, 0.62)',
            whiteSpace: 'nowrap',
          }}
        >
          {v}
        </div>
      );
    });
  }

  const containerHeight = 144 * scale;

  return (
    <div
      role="img"
      aria-label={`ציון אוטוטו ${score} מתוך 100${
        hasRange ? `, בטווח ${floorScore} עד ${ceilScore}` : ''
      }`}
      style={{
        position: 'relative',
        height: `${containerHeight}px`,
        margin: '10px auto 0',
        width: '100%',
        maxWidth: `${320 * scale}px`,
        overflow: 'visible',
      }}
    >
      {ticks}
      {boundLabels}
      <div
        style={{
          position: 'absolute',
          insetInline: 0,
          bottom: `${4 * scale}px`,
          textAlign: 'center',
        }}
      >
        <div
          ref={scoreRef}
          style={{
            font: `900 ${58 * scale}px/1 Heebo, sans-serif`,
            color: '#0E0F11',
            letterSpacing: '-2.5px',
          }}
        >
          {score}
        </div>
      </div>
    </div>
  );
};
