/**
 * main.ts - Main application router for Ototo Smart Report web client
 */

import { renderStoryView } from './components/StoryView.js';
import { renderDealHubView } from './components/DealHubView.js';
import { renderSellerApprovalView } from './components/SellerApprovalView.js';

async function initApp() {
  const app = document.getElementById('app');
  if (!app) return;

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token') || urlParams.get('d');

  // If token is provided, fetch deal from API
  if (token) {
    try {
      const res = await fetch(`/api/deal?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        const { deal, report, role } = data;

        if (role === 'seller') {
          app.innerHTML = '';
          app.appendChild(
            renderSellerApprovalView({
              deal,
              sellerToken: token,
              onSuccess: () => console.log('Seller consent granted'),
            })
          );
          return;
        }

        // Buyer role
        if (deal.stage === 'free_info' && !deal.isPaid) {
          app.innerHTML = '';
          app.appendChild(
            renderStoryView({
              deal,
              report,
              onUnlock: () => unlockDeal(deal.id, deal.buyerPhone),
            })
          );
        } else {
          app.innerHTML = '';
          app.appendChild(renderDealHubView({ deal, report }));
        }
        return;
      }
    } catch (err) {
      console.warn('Could not fetch from API, loading local demo experience:', err);
    }
  }

  // Local demo mode for preview and testing (Kia Sportage 2019 - 70086701)
  const demoDeal = {
    id: 'demo-deal-1',
    plate: '70086701',
    stage: 'free_info',
    adPrice: 79000,
    sellerToken: 'demo-seller-token',
  };

  const demoReport = {
    vehicleMeta: {
      make: 'קיה',
      model: 'SPORTAGE',
      year: 2019,
      vehicleTitle: 'KIA SPORTAGE URBAN 2019',
    },
    score: {
      total: 82,
      potential: 94,
      verdict: 'green',
      range: { floor: 68, ceil: 95, score: 82 },
      pillars: {
        accidents_insurance: {
          name: 'עבר תאונות וביטוח',
          score: null,
          reason: 'ממתין לאישור מוכר לשליפת היסטוריית תביעות ממאגר הביטוח',
        },
        ownership_reliability: {
          name: 'היסטוריית בעלות ואמינות',
          score: 85,
          reason: 'יד 2 פרטית, ללא עבר ציי רכב',
        },
        mechanical_condition: {
          name: 'מצב מכני ובדיקת מכון',
          score: null,
          reason: 'ממתין להעלאת דוח בדיקת מכון',
        },
        vehicle_history_condition: {
          name: 'עבר הרכב ורישוי',
          score: 95,
          reason: 'ללא שינויי מבנה או צבע, ריקולים פתוחים בוצעו',
        },
        km_vs_year: {
          name: 'ק״מ מול שנתון',
          score: 85,
          reason: '72,000 ק״מ - תואם לציפייה שנתית',
        },
      },
    },
    priceAdjust: {
      base: 79000,
      final: 74500,
    },
    findings: [
      {
        id: 'F-DISABLED-TAG',
        code: 'F-DISABLED-TAG',
        title: 'תו נכה פעיל על הרכב',
        severity: 'warn',
        detail: 'רשום תו נכה פעיל. העברת הבעלות תתאפשר לאחר שחרור התו במשרד הרישוי.',
      },
      {
        id: 'F-RECALL-CLOSED',
        code: 'F-RECALL-CLOSED',
        title: 'קריאת שירות יצרן בוצעה במלואה',
        severity: 'ok',
        detail: 'בוצע ריקול בטיחותי למחשב כריות אוויר במוסך מורשה יבואן.',
      },
    ],
  };

  // Check if viewing in story or hub mode via query parameter
  const mode = urlParams.get('mode');
  app.innerHTML = '';
  if (mode === 'hub') {
    app.appendChild(renderDealHubView({ deal: demoDeal, report: demoReport }));
  } else {
    app.appendChild(
      renderStoryView({
        deal: demoDeal,
        report: demoReport,
        onUnlock: () => {
          // Switch to Hub on unlock
          window.location.search = '?mode=hub';
        },
      })
    );
  }
}

async function unlockDeal(dealId: string, buyerPhone: string) {
  try {
    const res = await fetch('/api/deal/consume-credit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealId, buyerPhone }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      alert('נדרשת רכישת דוח (79 ₪) או חבילה לפתיחת הדוח המלא.');
    }
  } catch {
    alert('שגיאת תקשורת.');
  }
}

initApp();
