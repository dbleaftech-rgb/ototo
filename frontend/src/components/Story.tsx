import React, { useState } from 'react';
import { Logo } from './Logo.js';
import { Plate } from './Plate.js';
import { Gauge } from './Gauge.js';

interface StoryProps {
  deal: any;
  report: any;
  onUnlock: () => void;
}

export const Story: React.FC<StoryProps> = ({ deal, report, onUnlock }) => {
  const [slide, setSlide] = useState(0);
  const totalSlides = 5;

  const meta = report?.vehicleMeta || {
    makeEn: 'KIA',
    modelLine: 'SPORTAGE',
    subModel: 'URBAN',
    fuelEn: 'PETROL',
    fuelHe: 'בנזין',
    year: 2019,
    vehicleTitle: 'KIA SPORTAGE URBAN 2019',
  };

  const score = report?.score || {
    total: 82,
    range: { floor: 68, ceil: 95, score: 82 },
    potential: 94,
    verdict: 'green',
    pillars: {},
  };

  const priceAdjust = report?.priceAdjust || {
    base: 79000,
    final: 74500,
    steps: [
      { label: 'אמצע השוק לדגם ושנתון', pct: 0, delta: 0, after: 79000 },
      { label: 'עבר ליסינג/החכר (שקלול חלקי)', pct: -4.5, delta: -3500, after: 75500 },
      { label: 'התאמת ק״מ מול השנתון', pct: -1.3, delta: -1000, after: 74500 },
    ],
  };

  const findings = report?.findings || [
    {
      id: 'F-DISABLED-TAG',
      title: 'תו נכה פעיל על הרכב',
      severity: 'warn',
      detail: 'על הרכב רשום תו חניה לנכה. לא ניתן להעביר בעלות עד שהמוכר ישחרר את התו.',
    },
    {
      id: 'F-RECALL-CLOSED',
      title: 'קריאת שירות בטיחותית בוצעה במלואה',
      severity: 'ok',
      detail: 'בוצע ריקול יצרן למחשב כריות אוויר במוסך מורשה.',
    },
  ];

  const adPrice = deal?.adPrice || 79000;
  const gap = adPrice - priceAdjust.final;

  const isDark = slide === 1 || slide === 4;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: isDark ? '#121110' : '#FFFFFF',
        color: isDark ? '#FFFFFF' : '#0E0F11',
      }}
    >
      {/* Top Progress Segments */}
      <div className={`story-bar ${isDark ? 'dark' : ''}`}>
        {Array.from({ length: totalSlides }).map((_, i) => (
          <div
            key={i}
            className={`story-bar-seg ${
              i === slide ? 'active' : i < slide ? 'completed' : ''
            }`}
          />
        ))}
      </div>

      {/* Header */}
      <header
        className="ototo-header"
        style={{
          background: isDark ? '#121110' : '#FFFFFF',
          borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(14,15,17,0.08)',
        }}
      >
        <div className="ototo-logo">
          <Logo height={18} />
        </div>
        <Plate plate={deal?.plate || '70086701'} />
      </header>

      {/* Slide Body */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {slide === 0 && (
          <div
            style={{
              background: 'linear-gradient(178deg, #FFFDFB 0%, #F3F0EB 56%, #E8E3DB 100%)',
              padding: '24px 16px 30px',
              textAlign: 'center',
              flex: 1,
            }}
          >
            <div
              dir="ltr"
              style={{
                font: '900 32px/1 Heebo, sans-serif',
                color: '#0E0F11',
                letterSpacing: '-1px',
              }}
            >
              {meta.modelLine || meta.model || 'SPORTAGE'}
            </div>
            <div
              dir="ltr"
              style={{
                font: "600 10px/1 'IBM Plex Mono', monospace",
                color: 'rgba(14, 15, 17, 0.6)',
                letterSpacing: '1.5px',
                marginTop: '6px',
              }}
            >
              {[meta.makeEn || 'KIA', meta.subModel, meta.fuelEn, meta.year]
                .filter(Boolean)
                .join(' · ')}
            </div>

            {/* 31-Segment Radial Gauge */}
            <Gauge
              score={score.total}
              floorScore={score.range.floor}
              ceilScore={score.range.ceil}
              hasRange={true}
              scale={1.0}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '12px',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  background: '#3F7A2E',
                  borderRadius: '50%',
                }}
              />
              <span style={{ font: '800 13px/1 Heebo, sans-serif' }}>
                מצב כללי: טוב מאוד
              </span>
            </div>

            <div
              style={{
                font: '400 11.5px/1.5 Heebo, sans-serif',
                color: 'rgba(14, 15, 17, 0.62)',
                marginTop: '6px',
              }}
            >
              הציון בטווח{' '}
              <strong style={{ color: '#0E0F11' }}>
                {score.range.floor}–{score.range.ceil}
              </strong>{' '}
              · על סמך 55% מהנתונים
            </div>

            {/* Specs Pills */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '22px',
              }}
            >
              <div className="chip">
                <span className="sq sqf-ok" />
                יד 2 פרטית
              </div>
              <div className="chip">
                <span className="sq sqf-ok" />
                72,000 ק״מ
              </div>
              <div className="chip">
                <span className="sq sqf-ok" />
                {meta.fuelHe || 'בנזין'}
              </div>
              <div className="chip">
                <span className="sq sqf-warn" />
                מבוקש ₪{adPrice.toLocaleString()}
              </div>
            </div>

            {/* Heat Strip (D-094) */}
            <div
              style={{
                marginTop: '24px',
                padding: '12px 14px',
                background: '#FFFFFF',
                border: '1px solid rgba(14, 15, 17, 0.08)',
                textAlign: 'right',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  font: '700 12px/1.3 Heebo, sans-serif',
                }}
              >
                <span>כמה מהר נמכר הדגם הזה?</span>
                <strong>בדרך כלל: 16 ימים</strong>
              </div>
              <div
                style={{
                  font: '400 11px/1.5 Heebo, sans-serif',
                  color: 'rgba(14, 15, 17, 0.65)',
                  marginTop: '4px',
                }}
              >
                המודעה הזו 5 ימים באוויר — עדיין טרייה בשוק.
              </div>
            </div>
          </div>
        )}

        {slide === 1 && (
          <div className="hcard-dark" style={{ flex: 1 }}>
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
                ₪{priceAdjust.final.toLocaleString()}
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
                  ₪{priceAdjust.final.toLocaleString()}
                </strong>
              </div>
            </div>
          </div>
        )}

        {slide === 2 && (
          <div style={{ padding: '24px 16px', flex: 1 }}>
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

        {slide === 3 && (
          <div style={{ padding: '24px 16px', flex: 1 }}>
            <div className="hkick">04 · שקיפות וכיסוי</div>
            <h2 style={{ font: '900 24px/1.2 Heebo, sans-serif', margin: '8px 0 16px' }}>
              מה נבדק ומה ממתין?
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="hcard" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>מרשם משרד התחבורה</strong>
                  <div className="hmut">שנתון, יד, ביטול רישום, קריאות טסט</div>
                </div>
                <span className="sq sqf-ok" style={{ alignSelf: 'center' }} />
              </div>

              <div className="hcard" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>בדיקת משטרת ישראל</strong>
                  <div className="hmut">בדיקת רכב גנוב פעיל</div>
                </div>
                <span className="sq sqf-ok" style={{ alignSelf: 'center' }} />
              </div>

              <div
                className="hcard"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: '#FBFBFB',
                }}
              >
                <div>
                  <strong>עבר תאונות וביטוח (בדוח המלא)</strong>
                  <div className="hmut">ירידות ערך ותביעות שמאים ממאגר חברות הביטוח</div>
                </div>
                <span style={{ fontSize: '14px' }}>🔒</span>
              </div>

              <div
                className="hcard"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: '#FBFBFB',
                }}
              >
                <div>
                  <strong>מצב מכני מדוח מכון (בשלב 2)</strong>
                  <div className="hmut">פיענוח ליקויים ומנופי מו״מ מתועדים</div>
                </div>
                <span style={{ fontSize: '14px' }}>🔒</span>
              </div>
            </div>
          </div>
        )}

        {slide === 4 && (
          <div className="hcard-dark" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
              <button className="btn-lime" onClick={onUnlock}>
                פתיחת דוח מלא (79 ₪) 🔓
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Story Footer Controls */}
      <footer
        style={{
          padding: '12px 16px',
          background: isDark ? '#121110' : '#FFFFFF',
          borderTop: isDark
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(14,15,17,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {slide > 0 ? (
          <button
            onClick={() => setSlide((s) => s - 1)}
            style={{
              background: 'transparent',
              border: 'none',
              color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(14,15,17,0.6)',
              fontFamily: 'Heebo, sans-serif',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
            }}
          >
            ← הקודם
          </button>
        ) : (
          <div />
        )}

        {slide < totalSlides - 1 ? (
          <button
            onClick={() => setSlide((s) => s + 1)}
            className="btn-action-dark"
            style={{ width: 'auto', padding: '10px 24px' }}
          >
            הבא ←
          </button>
        ) : (
          <div />
        )}
      </footer>
    </div>
  );
};
