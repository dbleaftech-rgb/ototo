/**
 * SellerApprovalView.ts - The Seller Approval Wedge (Amendment 13 Consent)
 */

export interface SellerApprovalProps {
  deal: any;
  sellerToken: string;
  onSuccess: () => void;
}

export function renderSellerApprovalView(props: SellerApprovalProps): HTMLElement {
  const container = document.createElement('div');
  container.className = 'seller-approval-container';

  const deal = props.deal || {};

  container.innerHTML = `
    <header class="app-header">
      <div class="app-logo"><span>✳</span> אוטוטו</div>
      <div class="license-plate">
        <span class="il-strip">IL<br>ישראל</span>
        <span>${formatPlate(deal.plate || '70086701')}</span>
      </div>
    </header>

    <div class="seller-card animate-fade-in card" style="margin: 20px 16px;">
      <span class="slide-kicker">אישור בעל הרכב</span>
      <h2 style="margin: 8px 0 16px;">הסכמה לשליפת היסטוריית ביטוח</h2>
      <p style="color: var(--muted); line-height: 1.5; margin-bottom: 20px;">
        הקונה מבקש לעיין בהיסטוריית התביעות של הרכב לצורך סגירת העסקה. על פי תיקון 13 לחוק הגנת הפרטיות, נדרשת הסכמתך המפורשת.
      </p>

      <form id="seller-consent-form" style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label style="display: block; font-weight: 700; margin-bottom: 6px;">תעודת זהות של בעל הרכב:</label>
          <input type="text" id="input-taz" placeholder="9 ספרות" maxlength="9" required
            style="width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 16px;">
          <small id="taz-error" style="color: var(--risk); display: none; margin-top: 4px;">מספר תעודת זהות לא תקין</small>
        </div>

        <div>
          <label style="display: block; font-weight: 700; margin-bottom: 6px;">תאריך בעלות / עלייה לכביש (DD/MM/YYYY):</label>
          <input type="text" id="input-date" placeholder="למשל 15/04/2019" required
            style="width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 16px;">
        </div>

        <label style="display: flex; gap: 8px; align-items: flex-start; font-size: 13px; color: var(--ink); margin-top: 8px;">
          <input type="checkbox" id="check-consent" required style="margin-top: 3px;">
          <span>אני מאשר/ת בזאת לאוטוטו לבצע שאילתת היסטוריית ביטוח ותביעות עבור רכב זה ולהציגה לקונה לצורך בדיקת העסקה.</span>
        </label>

        <button type="submit" class="btn-action" style="margin-top: 12px;">אישור והסכמה בקליק ✓</button>
      </form>
    </div>
  `;

  const form = container.querySelector('#seller-consent-form') as HTMLFormElement;
  const tazInput = container.querySelector('#input-taz') as HTMLInputElement;
  const dateInput = container.querySelector('#input-date') as HTMLInputElement;
  const tazError = container.querySelector('#taz-error') as HTMLElement;

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taz = tazInput.value.trim();
    if (!validateIsraeliId(taz)) {
      tazError.style.display = 'block';
      return;
    }
    tazError.style.display = 'none';

    try {
      const res = await fetch('/api/seller/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerToken: props.sellerToken,
          ownerTaz: taz,
          ownershipDate: dateInput.value.trim(),
        }),
      });

      if (res.ok) {
        container.innerHTML = `
          <div class="card" style="margin: 40px 16px; text-align: center; padding: 30px;">
            <div style="font-size: 48px; margin-bottom: 16px;">✓</div>
            <h2>תודה רבה!</h2>
            <p style="color: var(--muted); margin-top: 10px;">הסכמתך נקלטה בהצלחה. הקונה עודכן על כך.</p>
          </div>
        `;
        props.onSuccess();
      } else {
        alert('שגיאה בשמירת ההסכמה. אנא נסה שוב.');
      }
    } catch {
      alert('שגיאת תקשורת.');
    }
  });

  return container;
}

function validateIsraeliId(id: string): boolean {
  if (!/^\d{9}$/.test(id)) return false;
  return Array.from(id, Number).reduce((acc, digit, idx) => {
    const step = digit * ((idx % 2) + 1);
    return acc + (step > 9 ? step - 9 : step);
  }, 0) % 10 === 0;
}

function formatPlate(p: string): string {
  const digits = p.replace(/\D/g, '');
  if (digits.length === 7) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  if (digits.length === 8) return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  return p;
}
