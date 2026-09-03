import React, { useState, useRef } from 'react';
import { Logo } from './Logo.js';
import { Plate } from './Plate.js';
import { Gauge } from './Gauge.js';

interface DealHubProps {
  deal: any;
  report: any;
  onSearchClick?: () => void;
}

export const DealHub: React.FC<DealHubProps> = ({ deal, report, onSearchClick }) => {
  const [tab, setTab] = useState<'overview' | 'negotiation' | 'checklist' | 'machon' | 'mou'>('overview');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [checklistState, setChecklistState] = useState<Record<string, string>>({});
  const [machonUploaded, setMachonUploaded] = useState(false);
  const [mouSigned, setMouSigned] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

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
    verdict: 'green',
    pillars: {},
  };

  const priceAdjust = report?.priceAdjust || {
    base: 79000,
    final: 74500,
  };

  const copySellerWedge = () => {
    const link = `${window.location.origin}/?token=${deal?.sellerToken || 'demo-seller-token'}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const preScript = `היי, ראיתי את המודעה על הרכב ויש לי עניין. לפני שקובעים להגיע — כמה שאלות קצרות:
1. למה אתה מוכר את הרכב?
2. יש ספר טיפולים או חשבוניות מהמוסך המטפל?
3. הרכב משועבד או ממושכן?
4. מסכים לבדיקה במכון שאני בוחר? ואם תימצא בעיה מהותית במנוע, בגיר או בשלדה — הבדיקה והתיקון עליך?`;

  const copyScript = () => {
    navigator.clipboard.writeText(preScript).then(() => {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    });
  };

  // Canvas drawing handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawing.current = true;
    ctx.strokeStyle = '#0E0F11';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FFFFFF' }}>
      {/* Header */}
      <header className="ototo-header">
        <div className="ototo-logo">
          <Logo height={18} />
        </div>
        <Plate plate={deal?.plate || '70086701'} onClick={onSearchClick} />
      </header>

      {/* Top Banner to switch vehicle */}
      {onSearchClick && (
        <div
          onClick={onSearchClick}
          style={{
            background: 'rgba(14, 15, 17, 0.04)',
            borderBottom: '1px solid rgba(14, 15, 17, 0.08)',
            padding: '7px 14px',
            fontSize: '11.5px',
            fontWeight: 700,
            color: '#0E0F11',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <span>🔍 רוצה לבדוק רכב אחר במאגרי משרד התחבורה?</span>
          <span style={{ textDecoration: 'underline' }}>לחץ כאן ←</span>
        </div>
      )}

      {/* Tabs Bar */}
      <nav className="hub-nav">
        <button
          className={`hub-nav-btn ${tab === 'overview' ? 'active' : ''}`}
          onClick={() => setTab('overview')}
        >
          מבט על
        </button>
        <button
          className={`hub-nav-btn ${tab === 'negotiation' ? 'active' : ''}`}
          onClick={() => setTab('negotiation')}
        >
          מו״מ ועלויות
        </button>
        <button
          className={`hub-nav-btn ${tab === 'checklist' ? 'active' : ''}`}
          onClick={() => setTab('checklist')}
        >
          צ׳ק-ליסט
        </button>
        <button
          className={`hub-nav-btn ${tab === 'machon' ? 'active' : ''}`}
          onClick={() => setTab('machon')}
        >
          דוח מכון
        </button>
        <button
          className={`hub-nav-btn ${tab === 'mou' ? 'active' : ''}`}
          onClick={() => setTab('mou')}
        >
          זיכרון דברים
        </button>
      </nav>

      {/* Tab Contents */}
      <main style={{ flex: 1, padding: '16px' }}>
        {tab === 'overview' && (
          <div>
            {/* Hero Card with 75% Scale Gauge */}
            <div
              style={{
                background: 'linear-gradient(178deg, #FFFDFB 0%, #F3F0EB 56%, #E8E3DB 100%)',
                padding: '24px 16px',
                textAlign: 'center',
                marginBottom: '16px',
                border: '1px solid rgba(14,15,17,0.08)',
              }}
            >
              <div
                dir="ltr"
                style={{
                  font: '900 28px/1 Heebo, sans-serif',
                  color: '#0E0F11',
                  letterSpacing: '-1px',
                }}
              >
                {meta.modelLine || meta.model || 'SPORTAGE'}
              </div>
              <div
                dir="ltr"
                style={{
                  font: "600 9.5px/1 'IBM Plex Mono', monospace",
                  color: 'rgba(14, 15, 17, 0.6)',
                  letterSpacing: '1.5px',
                  marginTop: '4px',
                }}
              >
                {[meta.makeEn, meta.subModel, meta.fuelEn, meta.year].filter(Boolean).join(' · ')}
              </div>

              <Gauge
                score={score.total}
                floorScore={score.range.floor}
                ceilScore={score.range.ceil}
                scale={0.75}
              />

              <div style={{ marginTop: '8px', font: '800 13px/1 Heebo, sans-serif' }}>
                מצב כללי: טוב מאוד
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(14,15,17,0.6)', marginTop: '4px' }}>
                שווי מותאם-היסטוריה: <strong>₪{priceAdjust.final.toLocaleString()}</strong>
              </div>
            </div>

            {/* The Seller Approval Wedge (Amendment 13) */}
            <div className="hcard" style={{ borderInlineStart: '4px solid #0E0F11' }}>
              <div className="hkick">שליפת היסטוריית ביטוח (תיקון 13)</div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '4px 0' }}>
                אישור מוכר לשליפת תביעות
              </h3>
              <p className="hmut">
                כדי לחשוף תביעות ביטוח וירידות ערך מדוחות שמאים, שלחו למוכר קישור לאישור מהיר בקליק.
              </p>
              <div style={{ marginTop: '12px' }}>
                <button
                  className="btn-action-dark"
                  onClick={copySellerWedge}
                  style={{ fontSize: '13px', padding: '10px 14px' }}
                >
                  {copiedLink ? 'הקישור הועתק ללוח! ✓' : 'העתקת קישור למוכר בוואטסאפ 📋'}
                </button>
              </div>
            </div>

            {/* Pillar Breakdown */}
            <div className="hcard">
              <div className="hkick">עמודי הציון</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>עבר תאונות וביטוח (25%)</span>
                  <span className="hmut">ממתין לאישור מוכר 🔒</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>היסטוריית בעלות ואמינות (20%)</span>
                  <strong>85 / 100</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>מצב מכני מדוח מכון (20%)</span>
                  <span className="hmut">ממתין להעלאת בדיקה 🔒</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>עבר הרכב ורישוי (15%)</span>
                  <strong>95 / 100</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>ק״מ מול שנתון (10%)</span>
                  <strong>85 / 100</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'negotiation' && (
          <div className="hcard-dark" style={{ margin: 0 }}>
            <div className="hkick">מו״מ ועלויות מתועדות</div>
            <h2 style={{ font: '900 24px/1.2 Heebo, sans-serif', color: '#FFFFFF', margin: '8px 0 14px' }}>
              איך ניגשים למחיר
            </h2>

            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>
              טבלת עלויות מתועדות (חלפים, שעות עבודה ומע״מ) לשיחה עם המוכר:
            </div>

            <div style={{ marginTop: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderTop: '1px solid rgba(255,255,255,0.15)',
                  fontSize: '13px',
                }}
              >
                <span>החלפת רפידות וצלחות בלם</span>
                <strong style={{ color: '#D7FF3E' }}>₪1,000 להורדה</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderTop: '1px solid rgba(255,255,255,0.15)',
                  fontSize: '13px',
                }}
              >
                <span>החלפת 2 צמיגים קדמיים</span>
                <strong style={{ color: '#D7FF3E' }}>₪1,000 להורדה</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderTop: '1px solid rgba(255,255,255,0.15)',
                  fontSize: '13px',
                }}
              >
                <span>טיפול תקופתי + שמנים</span>
                <strong style={{ color: '#D7FF3E' }}>₪800 להורדה</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '14px 0',
                  borderTop: '1.5px solid rgba(255,255,255,0.4)',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                }}
              >
                <span>סך הכל מנופי מו״מ מוצדקים:</span>
                <span style={{ color: '#D7FF3E' }}>₪2,800</span>
              </div>
            </div>
          </div>
        )}

        {tab === 'checklist' && (
          <div>
            {/* Script for Seller */}
            <div className="hcard">
              <div className="hkick">לפני שנוסעים · לשלוח למוכר</div>
              <p className="hmut">ארבע שאלות שחוסכות נסיעה מיותרת — ותשובה כתובה נשארת ראיה:</p>
              <pre
                style={{
                  background: 'rgba(14,15,17,0.05)',
                  padding: '10px',
                  borderRadius: '3px',
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                  margin: '10px 0',
                }}
              >
                {preScript}
              </pre>
              <button className="chip" onClick={copyScript}>
                {copiedScript ? 'הטקסט הועתק! ✓' : 'העתקת ההודעה לוואטסאפ 📋'}
              </button>
            </div>

            {/* 8-Station Checklist Wizard */}
            <div className="hcard">
              <div className="hkick">צ׳ק-ליסט בדיקה פיזית מול המוכר</div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '6px 0 12px' }}>
                תחנות בדיקה ליד הרכב
              </h3>

              {[
                { id: 'vin', q: 'בדיקת מספר שלדה (VIN) מול שמשת הרכב' },
                { id: 'oil', q: 'מכסה שמן מנוע נקי (ללא משקע קרם לבן)' },
                { id: 'tires', q: 'תאריך ייצור צמיגים (4 ספרות: שבוע ושנה)' },
                { id: 'ac', q: 'מזגן מקרר ומחמם בעוצמה מירבית' },
                { id: 'keys', q: 'שני מפתחות מקוריים ביד' },
              ].map((item) => {
                const current = checklistState[item.id];
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '10px 0',
                      borderTop: '1px solid rgba(14,15,17,0.08)',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.q}</div>
                    <div style={{ marginTop: '6px' }}>
                      <button
                        className={`chip ${current === 'ok' ? 'selchip' : ''}`}
                        onClick={() =>
                          setChecklistState((s) => ({ ...s, [item.id]: 'ok' }))
                        }
                      >
                        <span className="sq sqf-ok" /> תקין
                      </button>
                      <button
                        className={`chip ${current === 'warn' ? 'selchip' : ''}`}
                        onClick={() =>
                          setChecklistState((s) => ({ ...s, [item.id]: 'warn' }))
                        }
                      >
                        <span className="sq sqf-warn" /> ליקוי קל
                      </button>
                      <button
                        className={`chip ${current === 'risk' ? 'selchip' : ''}`}
                        onClick={() =>
                          setChecklistState((s) => ({ ...s, [item.id]: 'risk' }))
                        }
                      >
                        <span className="sq sqf-risk" /> דגל אדום
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'machon' && (
          <div className="hcard">
            <div className="hkick">שלב 2 · בדיקת מכון רישוי</div>
            <h2 style={{ font: '900 20px/1.2 Heebo, sans-serif', margin: '6px 0 10px' }}>
              העלאת דוח בדיקת מכון
            </h2>
            <p className="hmut">
              העלו צילום של טופס הבדיקה ממכון הרישוי. מנוע ה-Vision יפענח את הליקויים ויתרגם אותם לציון מכני מלא ועלויות תיקון.
            </p>

            <div
              style={{
                border: '2px dashed rgba(14,15,17,0.2)',
                padding: '36px 16px',
                textAlign: 'center',
                marginTop: '16px',
                cursor: 'pointer',
                background: machonUploaded ? '#F0FFF4' : 'transparent',
              }}
              onClick={() => setMachonUploaded(true)}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                {machonUploaded ? '✓' : '📄'}
              </div>
              <strong>
                {machonUploaded ? 'הדוח נקלט בהצלחה!' : 'לחצו לבחירת קובץ או צילום מסמך'}
              </strong>
              <div className="hmut" style={{ fontSize: '11px', marginTop: '4px' }}>
                {machonUploaded
                  ? 'הנתונים מפוענחים ויעודכנו בדוח'
                  : 'תומך בתמונות JPG, PNG וקובצי PDF'}
              </div>
            </div>
          </div>
        )}

        {tab === 'mou' && (
          <div className="hcard">
            <div className="hkick">שלב 3 · סגירה משפטית</div>
            <h2 style={{ font: '900 20px/1.2 Heebo, sans-serif', margin: '6px 0 10px' }}>
              זיכרון דברים דיגיטלי
            </h2>
            <p className="hmut">
              הסכם רכישה מחייב עם הזרקה אוטומטית של חסמי הרכב (תו נכה, ריקולים פתוחים) כתנאים מתלים.
            </p>

            <div
              style={{
                background: 'rgba(14,15,17,0.04)',
                padding: '12px',
                fontSize: '12.5px',
                lineHeight: '1.6',
                margin: '14px 0',
              }}
            >
              <strong>עיקרי ההסכם:</strong>
              <div>רכב מסוג {meta.vehicleTitle}, מ״ר {deal?.plate || '70086701'}.</div>
              <div>העברת הבעלות מותנית בהסרת תו נכה ובבדיקת שעבודים נקייה.</div>
            </div>

            {mouSigned ? (
              <div
                style={{
                  background: '#F0FFF4',
                  border: '1px solid #3F7A2E',
                  padding: '16px',
                  textAlign: 'center',
                  color: '#356524',
                  fontWeight: 800,
                }}
              >
                ✓ נחתם בהצלחה דיגיטלית על ידי הקונה!
              </div>
            ) : (
              <div>
                <div className="hkick" style={{ marginBottom: '6px' }}>
                  חתימת הקונה על המסך:
                </div>
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={130}
                  style={{
                    border: '1px solid rgba(14,15,17,0.2)',
                    background: '#FAFAFA',
                    display: 'block',
                    width: '100%',
                    touchAction: 'none',
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button
                    className="chip"
                    onClick={clearCanvas}
                    style={{ padding: '8px 12px' }}
                  >
                    נקה חתימה
                  </button>
                  <button
                    className="btn-action-dark"
                    onClick={() => setMouSigned(true)}
                    style={{ flex: 1, padding: '8px 12px' }}
                  >
                    חתימה ואישור זיכרון דברים ✍️
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
