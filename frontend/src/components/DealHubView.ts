/**
 * DealHubView.ts - Tabbed Deal Hub Dashboard for Ototo Stages 2-4
 */

export interface DealHubProps {
  deal: any;
  report: any;
  onRefresh?: () => void;
}

export function renderDealHubView(props: DealHubProps): HTMLElement {
  const container = document.createElement('div');
  container.className = 'deal-hub-container';

  let activeTab: 'overview' | 'negotiation' | 'checklist' | 'machon' | 'mou' = 'overview';

  const deal = props.deal || {};
  const report = props.report || {};
  const meta = report.vehicleMeta || {
    make: 'קיה',
    model: 'SPORTAGE',
    year: 2019,
    vehicleTitle: 'KIA SPORTAGE 2019',
  };
  const score = report.score || {
    total: 82,
    verdict: 'green',
    pillars: {},
  };
  const priceAdjust = report.priceAdjust || {
    base: 79000,
    final: 74500,
    steps: [],
  };

  function updateView() {
    container.innerHTML = `
      <header class="app-header">
        <div class="app-logo"><span>✳</span> אוטוטו דוח חכם</div>
        <div class="license-plate">
          <span class="il-strip">IL<br>ישראל</span>
          <span>${formatPlate(deal.plate || '70086701')}</span>
        </div>
      </header>

      <nav class="tabs-nav">
        <button class="tab-btn ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview">מבט על</button>
        <button class="tab-btn ${activeTab === 'negotiation' ? 'active' : ''}" data-tab="negotiation">מו״מ ועלויות</button>
        <button class="tab-btn ${activeTab === 'checklist' ? 'active' : ''}" data-tab="checklist">צ׳קליסט בדיקה</button>
        <button class="tab-btn ${activeTab === 'machon' ? 'active' : ''}" data-tab="machon">דוח מכון</button>
        <button class="tab-btn ${activeTab === 'mou' ? 'active' : ''}" data-tab="mou">זיכרון דברים</button>
      </nav>

      <main class="hub-tab-content">
        ${renderTabContent(activeTab)}
      </main>
    `;

    container.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = (e.currentTarget as HTMLElement).dataset.tab as any;
        if (target) {
          activeTab = target;
          updateView();
        }
      });
    });

    attachTabEvents();
  }

  function renderTabContent(tab: string): string {
    switch (tab) {
      case 'overview':
        return `
          <div class="hub-overview animate-fade-in">
            <div class="card hero-card">
              <div class="hero-top">
                <div>
                  <span class="kicker">דוח מלא פעיל</span>
                  <h2 class="hero-car-title">${meta.vehicleTitle}</h2>
                  <div style="font-size: 14px; color: var(--muted); margin-top: 4px;">
                    שווי מותאם-היסטוריה: <strong>₪${priceAdjust.final.toLocaleString()}</strong>
                  </div>
                </div>
                <div class="score-badge verdict-${score.verdict}">
                  ${score.total}
                </div>
              </div>
              <div class="hero-bottom-line">
                <strong>השורה התחתונה:</strong> רכב במצב כללי טוב מאוד עם נסועה מתונה ומספר בעלויות תקין.
              </div>
            </div>

            <div class="card seller-wedge-card">
              <div class="wedge-header">
                <span class="wedge-icon">🛡️</span>
                <div>
                  <h4>אישור מוכר (הסכמת ביטוח)</h4>
                  <p>שליחת קישור קצר למוכר לאימות ת״ז ותאריך בעלות בקליק</p>
                </div>
              </div>
              <div class="wedge-actions">
                <button class="btn-action" id="btn-copy-seller-link">העתקת קישור למוכר 📋</button>
              </div>
            </div>

            <div class="card findings-card">
              <h3>פירוט עמודי הציון</h3>
              <div class="pillars-list">
                ${renderPillarsList(score.pillars)}
              </div>
            </div>
          </div>
        `;

      case 'negotiation':
        return `
          <div class="hub-negotiation animate-fade-in">
            <div class="card">
              <h3>מנופי מו״מ ועלויות תיקון מתועדות</h3>
              <p class="section-desc">טבלת עלויות מדויקות (חלפים מקוריים מול תואמים, שעות עבודה ומע״מ) לשלב המשא ומתן.</p>
              
              <div class="nego-table">
                <div class="nego-row header">
                  <span>סעיף תיקון</span>
                  <span>מקורי</span>
                  <span>תואם</span>
                  <span>הורדה במו״מ</span>
                </div>
                <div class="nego-row">
                  <span>רפידות וצלחות בלם</span>
                  <span>₪1,450</span>
                  <span>₪850</span>
                  <span class="nego-highlight">₪1,000</span>
                </div>
                <div class="nego-row">
                  <span>החלפת 2 צמיגים קדמיים</span>
                  <span>₪1,200</span>
                  <span>₪900</span>
                  <span class="nego-highlight">₪1,000</span>
                </div>
                <div class="nego-row">
                  <span>טיפול תקופתי + שמנים</span>
                  <span>₪950</span>
                  <span>₪650</span>
                  <span class="nego-highlight">₪800</span>
                </div>
              </div>

              <div class="nego-summary-box">
                <span>סך הכל מנופי מו״מ מוצדקים:</span>
                <strong>₪2,800 להורדה</strong>
              </div>
            </div>
          </div>
        `;

      case 'checklist':
        return `
          <div class="hub-checklist animate-fade-in">
            <div class="card">
              <h3>צ׳קליסט לבדיקת הרכב מול המוכר</h3>
              <p class="section-desc">סמנו כל פריט במהלך המפגש עם המוכר לפני היציאה לבדיקת מכון:</p>
              
              <div class="checklist-items">
                <label class="check-item"><input type="checkbox"> בדיקת התאמת מספר שלדה (VIN) בין הרישיון לשמשת הרכב</label>
                <label class="check-item"><input type="checkbox"> בדיקת התאמת תעודת זהות של המוכר מול הרשום ברישיון</label>
                <label class="check-item"><input type="checkbox"> בדיקת תאריכי ייצור הצמיגים (4 ספרות: שבוע ושנה)</label>
                <label class="check-item"><input type="checkbox"> בדיקת היסטוריית טיפולים וקבלות ממוסכים</label>
                <label class="check-item"><input type="checkbox"> הפעלת מזגן ובדיקת קירור / חימום מירבי</label>
                <label class="check-item"><input type="checkbox"> בדיקת פעולת חלונות חשמליים ונעילה מרכזית</label>
                <label class="check-item"><input type="checkbox"> בדיקת הימצאות 2 מפתחות מקוריים של הרכב</label>
              </div>
            </div>
          </div>
        `;

      case 'machon':
        return `
          <div class="hub-machon animate-fade-in">
            <div class="card">
              <h3>העלאת דוח בדיקת מכון</h3>
              <p class="section-desc">העלו את צילומי דוח הבדיקה ממכון הרישוי. מערכת ה-Vision תפענח את הליקויים ותעדכן את הציון לציון מלא.</p>
              
              <div class="upload-dropzone" id="machon-dropzone">
                <div class="upload-icon">📄</div>
                <strong>גררו לכאן תמונות או PDF של הבדיקה</strong>
                <span>או לחצו לבחירת קבצים מהמכשיר</span>
                <input type="file" id="file-machon-input" multiple accept="image/*,application/pdf" style="display:none;">
              </div>

              <div id="machon-upload-status" class="upload-status" style="display:none;">
                <div class="spinner"></div>
                <span>הקבצים מעובדים ומפוענחים...</span>
              </div>
            </div>
          </div>
        `;

      case 'mou':
        return `
          <div class="hub-mou animate-fade-in">
            <div class="card">
              <h3>זיכרון דברים דיגיטלי</h3>
              <p class="section-desc">הסכם דיגיטלי מחייב עם הזרקת חוסמי הרכב הפתוחים כתנאים מתלים.</p>
              
              <div class="mou-preview-box">
                <h4>עיקרי ההסכם:</h4>
                <p>רכב מסוג <strong>${meta.vehicleTitle}</strong>, מ״ר <strong>${deal.plate || '70086701'}</strong>.</p>
                <p>העברת הבעלות מותנית בהסרת תו נכה פעיל / ריקול פתוח ובקבלת רישום נקי משעבודים.</p>
              </div>

              <div class="signature-section">
                <h4>חתימת הקונה:</h4>
                <canvas id="sig-canvas" width="380" height="150" class="signature-canvas"></canvas>
                <button class="btn-clear" id="btn-clear-sig">נקה חתימה</button>
              </div>

              <button class="btn-action" id="btn-sign-mou">חתימה ואישור זיכרון דברים ✍️</button>
            </div>
          </div>
        `;

      default:
        return '';
    }
  }

  function renderPillarsList(pillars: any): string {
    if (!pillars) return '';
    return Object.values(pillars)
      .map(
        (p: any) => `
        <div class="pillar-row">
          <div class="pillar-info">
            <strong>${p.name}</strong>
            <span class="pillar-reason">${p.reason || ''}</span>
          </div>
          <div class="pillar-score">
            ${p.score !== null ? `<strong>${p.score}</strong> / 100` : '<span class="waiting-tag">ממתין</span>'}
          </div>
        </div>
      `
      )
      .join('');
  }

  function attachTabEvents() {
    // Copy seller link
    container.querySelector('#btn-copy-seller-link')?.addEventListener('click', () => {
      const sellerLink = `${window.location.origin}/?token=${deal.sellerToken || ''}`;
      navigator.clipboard.writeText(sellerLink);
      alert('קישור אישור מוכר הועתק ללוח!');
    });

    // Machon dropzone click
    const dropzone = container.querySelector('#machon-dropzone');
    const fileInput = container.querySelector('#file-machon-input') as HTMLInputElement;
    dropzone?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', () => {
      const status = container.querySelector('#machon-upload-status') as HTMLElement;
      if (status) status.style.display = 'flex';
      setTimeout(() => {
        if (status) status.innerHTML = '<strong>✓ הדוח נקלט בהצלחה וממתין לעיבוד</strong>';
      }, 1500);
    });

    // Signature Canvas
    const canvas = container.querySelector('#sig-canvas') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0E0F11';
        ctx.lineWidth = 2.5;
        let drawing = false;

        canvas.addEventListener('mousedown', (e) => {
          drawing = true;
          ctx.beginPath();
          ctx.moveTo(e.offsetX, e.offsetY);
        });
        canvas.addEventListener('mousemove', (e) => {
          if (drawing) {
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
          }
        });
        window.addEventListener('mouseup', () => (drawing = false));

        // Touch support
        canvas.addEventListener('touchstart', (e) => {
          const rect = canvas.getBoundingClientRect();
          drawing = true;
          ctx.beginPath();
          ctx.moveTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
          e.preventDefault();
        });
        canvas.addEventListener('touchmove', (e) => {
          if (drawing) {
            const rect = canvas.getBoundingClientRect();
            ctx.lineTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
            ctx.stroke();
          }
          e.preventDefault();
        });
        canvas.addEventListener('touchend', () => (drawing = false));

        container.querySelector('#btn-clear-sig')?.addEventListener('click', () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        container.querySelector('#btn-sign-mou')?.addEventListener('click', () => {
          alert('זיכרון הדברים נחתם דיגיטלית ונשלח לצד השני!');
        });
      }
    }
  }

  updateView();
  return container;
}

function formatPlate(p: string): string {
  const digits = p.replace(/\D/g, '');
  if (digits.length === 7) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  if (digits.length === 8) return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  return p;
}
