import React, { useEffect, useState } from 'react';
import { Story } from './components/Story.js';
import { DealHub } from './components/DealHub.js';
import { SellerApproval } from './components/SellerApproval.js';

export const App: React.FC = () => {
  const [deal, setDeal] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [mode, setMode] = useState<'story' | 'hub'>('story');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('d');
    const paramMode = params.get('mode');

    if (paramMode === 'hub') {
      setMode('hub');
    }

    if (token) {
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
    } else {
      // Default demo experience with test car Kia Sportage 2019 (70086701)
      setDeal({
        id: 'demo-deal-1',
        plate: '70086701',
        adPrice: 79000,
        stage: 'free_info',
        sellerToken: 'demo-seller-token',
      });
      setReport({
        vehicleMeta: {
          makeEn: 'KIA',
          modelLine: 'SPORTAGE',
          subModel: 'URBAN',
          fuelEn: 'PETROL',
          fuelHe: 'בנזין',
          year: 2019,
          vehicleTitle: 'KIA SPORTAGE URBAN 2019',
        },
        score: {
          total: 82,
          range: { floor: 68, ceil: 95, score: 82 },
          potential: 94,
          verdict: 'green',
          pillars: {
            accidents_insurance: { score: null, weight: 25, reason: 'ממתין לאישור מוכר לשליפת עבר ביטוח' },
            ownership_reliability: { score: 85, weight: 20, reason: 'יד 2 פרטית' },
            mechanical_condition: { score: null, weight: 20, reason: 'ממתין לבדיקת מכון' },
            vehicle_history_condition: { score: 95, weight: 15, reason: 'ללא שינויי מבנה, ריקולים בוצעו' },
            km_vs_year: { score: 85, weight: 10, reason: '72,000 ק״מ - תואם לציפייה שנתית' },
          },
        },
        priceAdjust: {
          base: 79000,
          final: 74500,
          steps: [
            { label: 'אמצע השוק לדגם ושנתון', pct: 0, delta: 0, after: 79000 },
            { label: 'עבר ליסינג/החכר (שקלול חלקי)', pct: -4.5, delta: -3500, after: 75500 },
            { label: 'התאמת ק״מ מול השנתון', pct: -1.3, delta: -1000, after: 74500 },
          ],
        },
        findings: [
          {
            id: 'F-DISABLED-TAG',
            title: 'תו נכה פעיל על הרכב',
            severity: 'warn',
            detail: 'רשום תו נכה פעיל במשרד התחבורה. יש לשחרר את התו לפני העברת בעלות.',
          },
          {
            id: 'F-RECALL-CLOSED',
            title: 'קריאת שירות בטיחותית בוצעה במלואה',
            severity: 'ok',
            detail: 'בוצע ריקול יצרן לכרית אוויר במוסך מורשה יבואן.',
          },
        ],
      });
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ font: '900 24px/1 Heebo, sans-serif' }}>טוען את הדוח…</div>
      </div>
    );
  }

  if (role === 'seller') {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('d') || '';
    return <SellerApproval deal={deal} sellerToken={token} />;
  }

  return mode === 'hub' ? (
    <DealHub deal={deal} report={report} />
  ) : (
    <Story
      deal={deal}
      report={report}
      onUnlock={() => {
        setMode('hub');
        window.history.pushState({}, '', '?mode=hub');
      }}
    />
  );
};
