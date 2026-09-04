import React, { useState } from 'react';
import { Logo } from './Logo.js';
import { Plate, formatPlate } from './Plate.js';
import { Gauge } from './Gauge.js';

interface StoryProps {
  deal: any;
  report: any;
  onUnlock: () => void;
  onSearchClick?: () => void;
}

export const Story: React.FC<StoryProps> = ({ deal, report, onUnlock, onSearchClick }) => {
  const [slide, setSlide] = useState(0);
  const totalSlides = 4;

  const meta = report?.vehicleMeta || {
    makeEn: 'SUZUKI',
    modelLine: 'JIMNY',
    subModel: 'GLX',
    fuelEn: 'PETROL',
    fuelHe: 'בנזין',
    year: 2022,
    vehicleTitle: 'SUZUKI JIMNY GLX 2022',
  };

  const score = report?.score || {
    total: 68,
    range: { floor: 43, ceil: 93, score: 68 },
    potential: 93,
    verdict: 'yellow',
    pillars: {},
  };

  const priceAdjust = report?.priceAdjust || {
    base: 79000,
    final: 73552,
    steps: [
      { label: 'עבר ליסינג/החכר (4 חודשים)', pct: -6.4, delta: -5056, after: 73944 },
      { label: 'יד 3 (שקלול חלקי)', pct: -2.0, delta: -1479, after: 72465 },
      { label: 'ק״מ נמוך מהממוצע (35,908 ק״מ)', pct: 1.5, delta: 1087, after: 73552 },
    ],
  };

  const findings = report?.findings || [
    {
      id: 'F-RECALL-CLOSED',
      title: 'קריאות שירות יצרן בוצעו',
      severity: 'ok',
      detail: 'לא נמצאו ריקולים בטיחותיים פתוחים במאגר משרד התחבורה.',
    },
  ];

  const adPrice = deal?.adPrice || priceAdjust.base || 79000;
  const finalPrice = priceAdjust.final || adPrice;
  const gap = adPrice - finalPrice;

  // Real specs values from backend
  const handsCount = deal?.currentHands || report?.vehicleMeta?.hand || report?.currentHands || 3;
  const kmVal = report?.lastTestKm || deal?.declaredKm || 35908;
  const fuelVal = meta.fuelHe || 'בנזין';
  const colorVal = meta.color || report?.vehicleMeta?.color || 'שחור';

  const specsList = [
    { label: 'יד', value: `יד ${handsCount}` },
    { label: 'ק״מ', value: Number(kmVal).toLocaleString() },
    { label: 'דלק', value: fuelVal },
    { label: 'צבע', value: colorVal },
    { label: 'מבוקש', value: `₪ ${adPrice.toLocaleString()}` },
  ];

  const isDark = slide === 1 || slide === 3;

  const nextSlide = () => {
    if (slide < totalSlides - 1) {
      setSlide((s) => s + 1);
    }
  };

  const prevSlide = () => {
    if (slide > 0) {
      setSlide((s) => s - 1);
    }
  };

  const handleSlideTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    // In RTL: right 30% goes back, remaining 70% advances
    if (x > rect.width * 0.7) {
      prevSlide();
    } else {
      nextSlide();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: isDark
          ? '#121110'
          : 'linear-gradient(178deg, #FFFDFB 0%, #F3F0EB 56%, #E8E3DB 100%)',
        color: isDark ? '#FFFFFF' : '#0E0F11',
        userSelect: 'none',
      }}
    >
      {/* 1. Top Progress Segments (4 bars) */}
      <div
        style={{
          display: 'flex',
          gap: '5px',
          padding: '12px 16px 8px',
          background: 'transparent',
        }}
      >
        {Array.from({ length: totalSlides }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '2.5px',
              borderRadius: '2px',
              background:
                i === slide
                  ? '#0E0F11'
                  : i < slide
                  ? 'rgba(14, 15, 17, 0.4)'
                  : 'rgba(14, 15, 17, 0.15)',
              ...(isDark
                ? {
                    background:
                      i === slide
                        ? '#D7FF3E'
                        : i < slide
                        ? '#FFFFFF'
                        : 'rgba(255, 255, 255, 0.2)',
                  }
                : {}),
            }}
          />
        ))}
      </div>

      {/* 2. Top Header Bar (Matching Screenshot Exactly: Logo on Right, Plate in Center, Button on Left) */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 16px 10px',
          background: 'transparent',
        }}
      >
        {/* Right (in RTL): Official Ototo Logo */}
        <div style={{ color: isDark ? '#FFFFFF' : '#0E0F11' }}>
          <Logo height={16} />
        </div>

        {/* Center: Monospace License Plate Text */}
        <div
          dir="ltr"
          style={{
            font: "700 14.5px/1 'IBM Plex Mono', monospace",
            color: isDark ? '#FFFFFF' : '#0E0F11',
            letterSpacing: '0.5px',
          }}
        >
          {formatPlate(deal?.plate || '10976303')}
        </div>

        {/* Left (in RTL): + רכב חדש Button */}
        <button
          onClick={onSearchClick}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            font: '600 12px/1 Heebo, sans-serif',
            color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(14,15,17,0.65)',
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '15px',
              height: '15px',
              borderRadius: '50%',
              border: `1.2px solid ${isDark ? 'rgba(255,255,255,0.7)' : 'rgba(14,15,17,0.65)'}`,
              fontSize: '11px',
              lineHeight: 1,
            }}
          >
            +
          </span>
          <span>רכב חדש</span>
        </button>
      </header>

      {/* 3. Main Slide Body */}
      <main
        onClick={handleSlideTap}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          padding: '0 0 12px',
        }}
      >
        {slide === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              textAlign: 'center',
            }}
          >
            {/* Model Headline & Subtitle */}
            <div style={{ padding: '8px 16px 0' }}>
              <h1
                dir="ltr"
                style={{
                  font: '900 38px/.95 Heebo, sans-serif',
                  color: '#0E0F11',
                  letterSpacing: '-1.5px',
                  margin: 0,
                  textTransform: 'uppercase',
                }}
              >
                {meta.modelLine || meta.model || 'JIMNY'}
              </h1>
              <div
                dir="ltr"
                style={{
                  font: "600 9.5px/1 'IBM Plex Mono', monospace",
                  color: 'rgba(14, 15, 17, 0.55)',
                  letterSpacing: '2px',
                  marginTop: '7px',
                  textTransform: 'uppercase',
                }}
              >
                {[meta.makeEn || 'SUZUKI', meta.subModel || 'GLX', meta.fuelEn || 'PETROL', meta.year || 2022]
                  .filter(Boolean)
                  .join('  ·  ')}
              </div>
            </div>

            {/* 31-Segment Radial Gauge */}
            <div style={{ marginTop: '-4px' }}>
              <Gauge
                score={score.total}
                floorScore={score.range.floor}
                ceilScore={score.range.ceil}
                hasRange={true}
                scale={1.0}
              />

              {/* Status Row with Black Square (Matching Screenshot) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '8px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    background: '#0E0F11',
                    display: 'inline-block',
                  }}
                />
                <span
                  style={{
                    font: '800 13px/1 Heebo, sans-serif',
                    color: '#0E0F11',
                  }}
                >
                  עוד מוקדם להכריע
                </span>
              </div>

              {/* Subtitle Line */}
              <div
                style={{
                  font: '400 11px/1.4 Heebo, sans-serif',
                  color: 'rgba(14, 15, 17, 0.55)',
                  marginTop: '5px',
                }}
              >
                הציון בטווח{' '}
                <strong style={{ fontWeight: 800, color: '#0E0F11' }}>
                  {score.range.floor}–{score.range.ceil}
                </strong>{' '}
                · על סמך 50% מהנתונים
              </div>
            </div>

            {/* 3D Studio Car Graphic with License Plate on Bumper */}
            <div
              style={{
                position: 'relative',
                width: '88%',
                maxWidth: '330px',
                margin: '10px auto 0',
              }}
            >
              <img
                src="/assets/car-front.jpg"
                alt={meta.vehicleTitle}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  mixBlendMode: 'multiply',
                }}
              />
              {/* Israeli License Plate Mounted Right on Bumper */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '15.5%',
                  left: '50%',
                  transform: 'translateX(-50%) scale(0.85)',
                  pointerEvents: 'none',
                }}
              >
                <Plate plate={deal?.plate || '10976303'} />
              </div>
            </div>

            {/* 5-Column Specs Table (Matching Screenshot Exactly) */}
            <div
              style={{
                display: 'flex',
                borderTop: '1px solid rgba(14, 15, 17, 0.09)',
                borderBottom: '1px solid rgba(14, 15, 17, 0.09)',
                marginTop: '10px',
                background: 'transparent',
              }}
            >
              {specsList.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    padding: '11px 4px',
                    textAlign: 'center',
                    borderInlineStart:
                      idx > 0 ? '1px solid rgba(14, 15, 17, 0.08)' : 'none',
                  }}
                >
                  <div
                    style={{
                      font: '600 9.5px/1 Heebo, sans-serif',
                      color: 'rgba(14, 15, 17, 0.55)',
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      font: '700 11.5px/1.2 Heebo, sans-serif',
                      color: '#0E0F11',
                      marginTop: '7px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slide 1: Valuation Derivation */}
        {slide === 1 && (
          <div className="hcard-dark" style={{ flex: 1, margin: '12px 16px', borderRadius: '4px' }}>
            <div className="hkick">02 · שווי מותאם-היסטוריה</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
                marginTop: '20px',
              }}
            >
              <span
                style={{
                  font: '900 48px/1 Heebo, sans-serif',
                  color: '#D7FF3E',
                  letterSpacing: '-2px',
                }}
              >
                ₪{finalPrice.toLocaleString()}
              </span>
            </div>

            <div
              style={{
                font: '800 17px/1.3 Heebo, sans-serif',
                color: '#FFFFFF',
                marginTop: '10px',
              }}
            >
              {gap > 0
                ? `מבקשים כ־₪${gap.toLocaleString()} מעל השווי המותאם`
                : 'המחיר המבוקש תואם את שווי השוק'}
            </div>

            <div
              style={{
                font: '400 12.5px/1.6 Heebo, sans-serif',
                color: 'rgba(255,255,255,0.65)',
                marginTop: '6px',
              }}
            >
              מבוקש במודעה: ₪{adPrice.toLocaleString()} · על סמך מודעות דומות של הדגם
            </div>

            {/* Derivation Steps */}
            <div style={{ marginTop: '24px' }}>
              <div
                style={{
                  font: '700 11px/1 Heebo, sans-serif',
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}
              >
                איך הגענו למספר הזה:
              </div>
              {priceAdjust.steps.map((st: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '11px 0',
                    borderTop: '1px solid rgba(255,255,255,0.12)',
                    fontSize: '12.5px',
                    color: 'rgba(255,255,255,0.85)',
                  }}
                >
                  <span>{st.label}</span>
                  <strong>
                    {st.delta < 0 ? `−₪${Math.abs(st.delta).toLocaleString()}` : `₪${st.after.toLocaleString()}`}
                  </strong>
                </div>
              ))}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderTop: '1.5px solid rgba(255,255,255,0.35)',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                }}
              >
                <span>היעד למו״מ:</span>
                <strong style={{ color: '#D7FF3E' }}>
                  ₪{finalPrice.toLocaleString()}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Slide 2: Findings Summary */}
        {slide === 2 && (
          <div style={{ padding: '20px 16px', flex: 1 }}>
            <div className="hkick">03 · ממצאי הבדיקה</div>
            <h2 style={{ font: '900 24px/1.2 Heebo, sans-serif', margin: '8px 0 16px' }}>
              נקודות מרכזיות ברכב
            </h2>

            <div>
              {findings.map((f: any) => (
                <div
                  key={f.id}
                  className="hcard"
                  style={{
                    borderInlineStart: `4px solid ${
                      f.severity === 'risk' ? '#D91E18' : f.severity === 'warn' ? '#C24300' : '#3F7A2E'
                    }`,
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '14.5px' }}>{f.title}</strong>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: f.severity === 'risk' ? '#D91E18' : '#C24300',
                      }}
                    >
                      {f.severity === 'risk' ? 'חמור' : f.severity === 'warn' ? 'לבדיקה' : 'תקין'}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '12.5px',
                      color: 'rgba(14,15,17,0.65)',
                      marginTop: '6px',
                      lineHeight: 1.5,
                    }}
                  >
                    {f.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slide 3: Unlock Full Report CTA */}
        {slide === 3 && (
          <div className="hcard-dark" style={{ flex: 1, margin: '12px 16px', display: 'flex', flexDirection: 'column' }}>
            <div className="hkick">קבלת החלטה בטוחה</div>
            <h2
              style={{
                font: '900 28px/1.2 Heebo, sans-serif',
                color: '#FFFFFF',
                margin: '12px 0 16px',
              }}
            >
              התקדמות לדוח מלא ומנהל עסקה
            </h2>

            <div
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '18px',
                borderRadius: '4px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  font: '800 17px/1 Heebo, sans-serif',
                  color: '#D7FF3E',
                  marginBottom: '12px',
                }}
              >
                דוח בודד · 79 ₪
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: '1.9',
                }}
              >
                <li>✓ עבר ביטוחי ותביעות שמאים מלאות</li>
                <li>✓ טבלת עלויות תיקון חלפים למו״מ</li>
                <li>✓ צ׳קליסט מונחה 8 שלבים לפגישה</li>
                <li>✓ זיכרון דברים דיגיטלי בחתימה משותפת</li>
                <li>✓ ניטור אוטומטי של חסמי רישום והעברת בעלות</li>
              </ul>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <button
                className="btn-lime"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlock();
                }}
              >
                פתיחת דוח מלא (79 ₪) 🔓
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 4. Bottom Chrome Row (Matching Screenshot: "1 / 4" on right, "נגיעה להמשך" on left) */}
      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 18px 16px',
          background: 'transparent',
        }}
      >
        {/* Right (in RTL): Slide Counter */}
        <div
          dir="ltr"
          style={{
            font: "600 11px/1 'IBM Plex Mono', monospace",
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(14, 15, 17, 0.45)',
          }}
        >
          {slide + 1} / {totalSlides}
        </div>

        {/* Left (in RTL): Tap to Continue */}
        <div
          onClick={nextSlide}
          style={{
            font: '400 11.5px/1 Heebo, sans-serif',
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(14, 15, 17, 0.45)',
            cursor: 'pointer',
          }}
        >
          {slide < totalSlides - 1 ? 'נגיעה להמשך' : ''}
        </div>
      </footer>
    </div>
  );
};
