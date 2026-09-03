/**
 * StoryView.ts - 5-Slide Teaser Story Component for Ototo Stage 1
 */

export interface StoryProps {
  deal: any;
  report: any;
  onUnlock: () => void;
}

export function renderStoryView(props: StoryProps): HTMLElement {
  const container = document.createElement('div');
  container.className = 'story-container';

  let currentSlide = 0;
  const totalSlides = 5;

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
    range: { floor: 68, ceil: 95, score: 82 },
    potential: 95,
    verdict: 'green',
  };
  const priceAdjust = report.priceAdjust || {
    base: 79000,
    final: 74500,
    steps: [],
  };

  function updateSlide() {
    container.innerHTML = `
      <div class="story-progress-bar">
        ${Array.from({ length: totalSlides })
          .map(
            (_, i) =>
              `<div class="progress-segment ${i === currentSlide ? 'active' : i < currentSlide ? 'completed' : ''}"></div>`
          )
          .join('')}
      </div>

      <header class="app-header">
        <div class="app-logo"><span>✳</span> אוטוטו</div>
        <div class="license-plate">
          <span class="il-strip">IL<br>ישראל</span>
          <span>${formatPlate(deal.plate || '70086701')}</span>
        </div>
      </header>

      <div class="story-content">
        ${getSlideContent(currentSlide)}
      </div>

      <footer class="story-footer">
        <div class="story-nav-buttons">
          ${
            currentSlide > 0
              ? `<button class="btn-story-prev" id="btn-prev">הקודם</button>`
              : `<div></div>`
          }
          ${
            currentSlide < totalSlides - 1
              ? `<button class="btn-action" id="btn-next">הבא ←</button>`
              : `<button class="btn-action btn-unlock" id="btn-unlock">פתיחת דוח מלא (79 ₪) 🔓</button>`
          }
        </div>
      </footer>
    `;

    container.querySelector('#btn-next')?.addEventListener('click', () => {
      if (currentSlide < totalSlides - 1) {
        currentSlide++;
        updateSlide();
      }
    });

    container.querySelector('#btn-prev')?.addEventListener('click', () => {
      if (currentSlide > 0) {
        currentSlide--;
        updateSlide();
      }
    });

    container.querySelector('#btn-unlock')?.addEventListener('click', () => {
      props.onUnlock();
    });
  }

  function getSlideContent(slideIndex: number): string {
    switch (slideIndex) {
      case 0:
        return `
          <div class="slide-card animate-fade-in">
            <span class="slide-kicker">שלב 1 · סקירת הרכב</span>
            <h2 class="slide-title">${meta.vehicleTitle}</h2>
            <div class="gauge-hero">
              <div class="score-badge verdict-${score.verdict}">
                ${score.total}
              </div>
              <div class="gauge-details">
                <span class="gauge-status">${score.verdict === 'green' ? 'מצב כללי: טוב מאוד' : 'לתשומת לב'}</span>
                <span class="gauge-range">טווח הציון: ${score.range.floor} עד ${score.range.ceil}</span>
                <span class="gauge-potential">פוטנציאל אחרי בדיקת מכון: <strong>${score.potential}</strong></span>
              </div>
            </div>
            <p class="slide-note">הציון מחושב כאמצע הטווח המדויק על בסיס נתונים שנבדקו עד כה במרשם הממשלתי.</p>
          </div>
        `;
      case 1:
        const gap = (deal.adPrice || priceAdjust.base) - priceAdjust.final;
        return `
          <div class="slide-card animate-fade-in">
            <span class="slide-kicker">שלב 1 · שווי מותאם-היסטוריה</span>
            <h2 class="slide-title">מול מחירי השוק והסגירה</h2>
            <div class="price-hero">
              <div class="price-box">
                <span class="price-label">מחיר מבוקש / בסיס</span>
                <span class="price-num">₪${(deal.adPrice || priceAdjust.base).toLocaleString()}</span>
              </div>
              <div class="price-divider">←</div>
              <div class="price-box highlight">
                <span class="price-label">שווי מותאם להיסטוריה</span>
                <span class="price-num">₪${priceAdjust.final.toLocaleString()}</span>
              </div>
            </div>
            ${
              gap > 0
                ? `<div class="gap-pill">פער מו״מ מוצדק: כ־<strong>₪${gap.toLocaleString()}</strong> להורדה</div>`
                : `<div class="gap-pill inband">המחיר בטווח הסביר של השוק</div>`
            }
            <p class="slide-note">שווי משוקלל המביא בחשבון את עבר הרכב, מספר הבעלויות והק״מ בפועל.</p>
          </div>
        `;
      case 2:
        const findings = report.findings || [];
        return `
          <div class="slide-card animate-fade-in">
            <span class="slide-kicker">שלב 1 · ממצאי בדיקה</span>
            <h2 class="slide-title">נקודות מרכזיות ברכב</h2>
            <div class="findings-list">
              ${
                findings.length > 0
                  ? findings
                      .map(
                        (f: any) => `
                    <div class="finding-item sev-${f.severity}">
                      <div class="finding-dot"></div>
                      <div class="finding-content">
                        <strong>${f.title}</strong>
                        <p>${f.detail}</p>
                      </div>
                    </div>
                  `
                      )
                      .join('')
                  : `
                  <div class="finding-item sev-ok">
                    <div class="finding-dot"></div>
                    <div class="finding-content">
                      <strong>לא נמצאו חסמי רישום מיידיים</strong>
                      <p>המרשם הממשלתי נקי משעבודים מדווחים, תו נכה או ביטול רישום.</p>
                    </div>
                  </div>
                `
              }
            </div>
          </div>
        `;
      case 3:
        return `
          <div class="slide-card animate-fade-in">
            <span class="slide-kicker">שלב 1 · שקיפות וכיסוי</span>
            <h2 class="slide-title">מה נבדק ומה חסר?</h2>
            <div class="coverage-grid">
              <div class="cov-item checked">
                <span class="cov-icon">✓</span>
                <span>מרשם משרד התחבורה</span>
              </div>
              <div class="cov-item checked">
                <span class="cov-icon">✓</span>
                <span>בדיקת גניבה במשטרה</span>
              </div>
              <div class="cov-item checked">
                <span class="cov-icon">✓</span>
                <span>היסטוריית בעלויות וידיים</span>
              </div>
              <div class="cov-item waiting">
                <span class="cov-icon">🔒</span>
                <span>עבר ביטוחי ותביעות תאונה (בדוח המלא)</span>
              </div>
              <div class="cov-item waiting">
                <span class="cov-icon">🔒</span>
                <span>פירוק עלויות תיקון וחלפים (בדוח המלא)</span>
              </div>
            </div>
          </div>
        `;
      case 4:
        return `
          <div class="slide-card animate-fade-in unlock-slide">
            <span class="slide-kicker">קבלת החלטה בטוחה</span>
            <h2 class="slide-title">התקדמות לדוח מלא ומנהל עסקה</h2>
            <div class="unlock-offer">
              <div class="offer-badge">דוח בודד · 79 ₪</div>
              <ul class="offer-list">
                <li>✓ חשיפת עבר ביטוחי ותביעות שמאים מלאות</li>
                <li>✓ טבלת עלויות תיקון חלפים למו״מ</li>
                <li>✓ צ׳קליסט מונחה לפגישה ובדיקת הרכב</li>
                <li>✓ זיכרון דברים דיגיטלי בחתימה משותפת</li>
                <li>✓ ניטור אוטומטי של חסמי העברת בעלות</li>
              </ul>
            </div>
          </div>
        `;
      default:
        return '';
    }
  }

  updateSlide();
  return container;
}

function formatPlate(p: string): string {
  const digits = p.replace(/\D/g, '');
  if (digits.length === 7) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  if (digits.length === 8) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }
  return p;
}
