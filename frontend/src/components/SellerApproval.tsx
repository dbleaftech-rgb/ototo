import React, { useState } from 'react';
import { Logo } from './Logo.js';
import { Plate } from './Plate.js';

interface SellerApprovalProps {
  deal: any;
  sellerToken: string;
}

export const SellerApproval: React.FC<SellerApprovalProps> = ({ deal, sellerToken }) => {
  const [taz, setTaz] = useState('');
  const [date, setDate] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validateIsraeliId = (id: string): boolean => {
    if (!/^\d{9}$/.test(id)) return false;
    return (
      Array.from(id, Number).reduce((acc, digit, idx) => {
        const step = digit * ((idx % 2) + 1);
        return acc + (step > 9 ? step - 9 : step);
      }, 0) % 10 === 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateIsraeliId(taz)) {
      setError('מספר תעודת זהות אינו תקין (נדרשות 9 ספרות כולל ספרת ביקורת)');
      return;
    }
    setError('');

    try {
      const res = await fetch('/api/seller/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerToken,
          ownerTaz: taz,
          ownershipDate: date,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        alert('שגיאה בשמירת האישור.');
      }
    } catch {
      alert('שגיאת תקשורת.');
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <Logo height={24} />
        <div style={{ fontSize: '48px', margin: '24px 0 12px', color: '#3F7A2E' }}>✓</div>
        <h2 style={{ font: '900 24px/1.2 Heebo, sans-serif' }}>תודה רבה!</h2>
        <p className="hmut" style={{ marginTop: '8px' }}>
          אישורך לפי תיקון 13 נקלט בהצלחה. הקונה קיבל עדכון במערכת.
        </p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
      <header className="ototo-header">
        <div className="ototo-logo">
          <Logo height={18} />
        </div>
        <Plate plate={deal?.plate || '70086701'} />
      </header>

      <main style={{ padding: '24px 16px' }}>
        <div className="hcard">
          <div className="hkick">אישור בעל הרכב (תיקון 13)</div>
          <h2 style={{ font: '900 22px/1.2 Heebo, sans-serif', margin: '8px 0 12px' }}>
            הסכמה לשליפת היסטוריית תביעות וביטוח
          </h2>
          <p className="hmut" style={{ marginBottom: '20px' }}>
            הקונה ביקש לעיין בהיסטוריית הביטוח והתביעות של הרכב לצורך התקדמות בעסקה. על פי תיקון 13 לחוק הגנת הפרטיות, נדרשת הסכמתך המפורשת.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                תעודת זהות של בעל הרכב (9 ספרות):
              </label>
              <input
                type="text"
                maxLength={9}
                inputMode="numeric"
                required
                value={taz}
                onChange={(e) => setTaz(e.target.value.replace(/\D/g, ''))}
                placeholder="למשל 012345678"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid rgba(14,15,17,0.2)',
                  fontFamily: 'var(--mono-font)',
                  fontSize: '15px',
                  borderRadius: '2px',
                }}
              />
              {error && <div style={{ color: '#D91E18', fontSize: '12px', marginTop: '4px' }}>{error}</div>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                תאריך בעלות / עלייה לכביש (DD/MM/YYYY):
              </label>
              <input
                type="text"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="למשל 15/04/2019"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid rgba(14,15,17,0.2)',
                  fontFamily: 'var(--mono-font)',
                  fontSize: '15px',
                  borderRadius: '2px',
                }}
              />
            </div>

            <label
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                fontSize: '12.5px',
                color: '#0E0F11',
                margin: '10px 0',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                style={{ marginTop: '2px' }}
              />
              <span>
                אני מאשר/ת בזאת לאוטוטו לבצע שאילתת היסטוריית ביטוח ותביעות עבור רכב זה ולהציגה לקונה לצורך בדיקת העסקה.
              </span>
            </label>

            <button type="submit" className="btn-action-dark" style={{ marginTop: '8px' }}>
              אישור והסכמה בקליק ✓
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
