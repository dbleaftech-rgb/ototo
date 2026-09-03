import React from 'react';

interface GaugeProps {
  score: number;
  floorScore?: number;
  ceilScore?: number;
  hasRange?: boolean;
  scale?: number;
}

export const Gauge: React.FC<GaugeProps> = ({
  score,
  floorScore = 68,
  ceilScore = 95,
  hasRange = true,
  scale = 1.0,
}) => {
  const SEGS = 31;
  const fTick = Math.round(((SEGS - 1) * floorScore) / 100);
  const cTick = Math.round(((SEGS - 1) * ceilScore) / 100);

  const ticks: React.ReactNode[] = [];
  for (let i = 0; i < SEGS; i++) {
    const ang = -80 + i * (160 / (SEGS - 1));
    const isB = hasRange && (i === fTick || i === cTick);
    const inR = hasRange ? i >= fTick && i <= cTick : true;
    const major = i % 5 === 0;
    const h = (isB ? 23 : major ? 16 : 10) * scale;
    const w = (isB ? 2.5 : major ? 2.6 : 1.8) * scale;
    const off = (isB ? -97 : major ? -100 : -104) * scale;
    const bg = isB ? '#0E0F11' : inR ? 'rgba(14, 15, 17, 0.45)' : 'rgba(14, 15, 17, 0.1)';

    ticks.push(
      <div
        key={i}
        data-tick={i}
        style={{
          position: 'absolute',
          left: '50%',
          bottom: `${8 * scale}px`,
          width: `${w}px`,
          height: `${h}px`,
          transformOrigin: '50% 100%',
          transform: `translateX(-50%) rotate(${ang}deg) translateY(${off}px)`,
          background: bg,
          transition: 'background .5s cubic-bezier(.22,.9,.24,1)',
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
          style={{
            font: `900 ${56 * scale}px/1 Heebo, sans-serif`,
            color: '#0E0F11',
            letterSpacing: '-2px',
          }}
        >
          {score}
        </div>
      </div>
    </div>
  );
};
