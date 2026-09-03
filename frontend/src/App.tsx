import React, { useEffect, useState } from 'react';
import { Story } from './components/Story.js';
import { DealHub } from './components/DealHub.js';
import { SellerApproval } from './components/SellerApproval.js';
import { LoadingScreen } from './components/LoadingScreen.js';

export const App: React.FC = () => {
  const [deal, setDeal] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [mode, setMode] = useState<'story' | 'hub'>('story');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchPlate, setSearchPlate] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const loadDealByToken = (token: string) => {
    setLoading(true);
    fetch(`/api/deal?token=${encodeURIComponent(token)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setDeal(data.deal);
          setReport(data.report);
          setRole(data.role || 'buyer');
          if (data.deal?.isPaid || data.deal?.stage !== 'free_info') {
            setMode('hub');
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const handleSearchVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchPlate.replace(/\D/g, '');
    if (clean.length < 7 || clean.length > 8) {
      alert('מספר רישוי בישראל כולל 7 או 8 ספרות');
      return;
    }

    setSearching(true);
    try {
      const res = await fetch('/api/deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate: clean,
          buyerPhone: '0501234567',
        }),
      });

      if (!res.ok) {
        throw new Error('שגיאה ביצירת הדוח');
      }

      const data = await res.json();
      if (data.dealToken) {
        window.history.pushState({}, '', `?token=${data.dealToken}`);
        loadDealByToken(data.dealToken);
        setSearchOpen(false);
      }
    } catch {
      alert('לא הצלחנו לאתר את הרכב במשרד התחבורה. וודאו שהמספר תקין.');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('d');
    const paramMode = params.get('mode');

    if (paramMode === 'hub') {
      setMode('hub');
    }

    if (token) {
      loadDealByToken(token);
    } else {
      // Load real deal 70086701 as default showcase
      loadDealByToken('28c60ed62edbe499703249d0b62fec17');
    }
  }, []);

  if (searching) {
    return <LoadingScreen plate={searchPlate} />;
  }

  if (loading) {
    return <LoadingScreen plate={deal?.plate} />;
  }

  if (role === 'seller') {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('d') || '';
    return <SellerApproval deal={deal} sellerToken={token} />;
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Search Modal */}
      {searchOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 150,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="hcard"
            style={{
              width: '100%',
              maxWidth: '360px',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hkick">בדיקה חיה במאגרים הממשלתיים</div>
            <h3 style={{ font: '900 20px/1.2 Heebo, sans-serif', margin: '6px 0 14px' }}>
              הזנת מספר רכב לבדיקה
            </h3>
            <form onSubmit={handleSearchVehicle}>
              <input
                type="text"
                autoFocus
                value={searchPlate}
                onChange={(e) => setSearchPlate(e.target.value.replace(/\D/g, ''))}
                placeholder="למשל: 70086701"
                maxLength={8}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '22px',
                  textAlign: 'center',
                  fontFamily: 'var(--mono-font)',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  border: '2px solid #0E0F11',
                  borderRadius: '4px',
                  marginBottom: '14px',
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="chip"
                  onClick={() => setSearchOpen(false)}
                  style={{ flex: 1, padding: '12px', textAlign: 'center' }}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="btn-action-dark"
                  style={{ flex: 2, padding: '12px' }}
                >
                  הפקת דוח חי ⚡
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mode === 'hub' ? (
        <DealHub
          deal={deal}
          report={report}
          onSearchClick={() => setSearchOpen(true)}
        />
      ) : (
        <Story
          deal={deal}
          report={report}
          onSearchClick={() => setSearchOpen(true)}
          onUnlock={() => {
            setMode('hub');
            window.history.pushState({}, '', '?mode=hub');
          }}
        />
      )}
    </div>
  );
};
