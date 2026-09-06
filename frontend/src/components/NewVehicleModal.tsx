import React, { useState, useRef } from 'react';
import { extractDataFromScreenshot } from '../services/screenshotOcrService';

interface NewVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: { plate: string; adPrice?: number; declaredKm?: number; screenshotUrl?: string }) => void;
}

export const NewVehicleModal: React.FC<NewVehicleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [tab, setTab] = useState<'screenshot' | 'manual'>('screenshot');
  const [plate, setPlate] = useState('');
  const [adPrice, setAdPrice] = useState('');
  const [declaredKm, setDeclaredKm] = useState('');
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedSuccess, setExtractedSuccess] = useState(false);
  const [isEditingExtracted, setIsEditingExtracted] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetScreenshotState = () => {
    setScreenshotData(null);
    setIsScanning(false);
    setExtractedSuccess(false);
    setIsEditingExtracted(false);
    setExtractionError(null);
    setPlate('');
    setAdPrice('');
    setDeclaredKm('');
  };

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('נא לבחור קובץ תמונה (PNG, JPG, WebP)');
      return;
    }

    // Reset previous extraction
    setExtractedSuccess(false);
    setExtractionError(null);
    setIsScanning(true);

    // Read image preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setScreenshotData(dataUrl);

      try {
        // Run OCR extraction
        const result = await extractDataFromScreenshot(dataUrl);

        let detectedPlate = result.plate;
        let detectedPrice = result.adPrice;

        // Fallback: check filename if OCR was inconclusive
        if (!detectedPlate) {
          const fnMatch = file.name.match(/\b\d{7,8}\b/);
          if (fnMatch) detectedPlate = fnMatch[0];
        }

        if (detectedPrice) {
          setAdPrice(detectedPrice.toLocaleString());
        }

        if (result.declaredKm) {
          setDeclaredKm(result.declaredKm.toLocaleString());
        }

        if (detectedPlate) {
          setPlate(detectedPlate);
          setExtractedSuccess(true);
        } else {
          // Plate is on car bumper only
          setIsEditingExtracted(true);
          if (detectedPrice) {
            setExtractionError('מחיר המודעה זוהה בהצלחה (₪' + detectedPrice.toLocaleString() + '). מספר הרישוי מופיע על גבי הפגוש — אנא הזינו אותו:');
          } else {
            setExtractionError('לא הצלחנו לזהות את לוחית הרישוי בצילום. אנא הזינו אותה ידנית.');
          }
        }
      } catch (err) {
        console.error('Extraction error:', err);
        setExtractionError('חלה שגיאה בסריקה. אנא הזינו את מספר הרישוי ידנית.');
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = async (samplePlate: string, samplePrice: number, label: string, sampleKm?: number) => {
    resetScreenshotState();
    setIsScanning(true);
    setScreenshotData('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" fill="%230e0f11"/><text x="150" y="80" fill="%23d7ff3e" font-family="sans-serif" font-weight="bold" font-size="18" text-anchor="middle">צילום מסך יד2: ' + encodeURIComponent(label) + '</text><text x="150" y="115" fill="%23ffffff" font-family="monospace" font-size="16" text-anchor="middle">' + samplePlate + ' · ₪' + samplePrice.toLocaleString() + '</text></svg>');

    // Simulate realistic OCR extraction time
    setTimeout(() => {
      setPlate(samplePlate);
      setAdPrice(samplePrice.toLocaleString());
      if (sampleKm) setDeclaredKm(sampleKm.toLocaleString());
      setIsScanning(false);
      setExtractedSuccess(true);
    }, 650);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPlate = plate.replace(/\D/g, '');
    if (cleanPlate.length < 7 || cleanPlate.length > 8) {
      alert('מספר רישוי בישראל כולל 7 או 8 ספרות. אנא הזינו מספר תקין.');
      return;
    }

    const parsedPrice = adPrice ? Number(adPrice.replace(/\D/g, '')) : undefined;
    const parsedKm = declaredKm ? Number(declaredKm.replace(/\D/g, '')) : undefined;
    onSubmit({
      plate: cleanPlate,
      adPrice: parsedPrice && parsedPrice > 1000 ? parsedPrice : undefined,
      declaredKm: parsedKm && parsedKm > 0 ? parsedKm : undefined,
      screenshotUrl: screenshotData || undefined,
    });
  };

  const formatPlate = (numStr: string) => {
    const s = numStr.replace(/\D/g, '');
    if (s.length === 8) return `${s.slice(0, 3)}-${s.slice(3, 5)}-${s.slice(5)}`;
    if (s.length === 7) return `${s.slice(0, 2)}-${s.slice(2, 5)}-${s.slice(5)}`;
    return s;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(14, 15, 17, 0.78)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={onClose}
    >
      <div
        className="hcard"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '24px 20px',
          borderRadius: '12px',
          boxShadow: '0 20px 48px rgba(0,0,0,0.35)',
          background: '#FFFFFF',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            background: 'rgba(14, 15, 17, 0.05)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            lineHeight: 1,
            cursor: 'pointer',
            color: 'rgba(14, 15, 17, 0.6)',
          }}
        >
          ✕
        </button>

        <div className="hkick" style={{ margin: 0 }}>בדיקה חכמה מול משרד התחבורה</div>
        <h3 style={{ font: '900 22px/1.2 Heebo, sans-serif', margin: '4px 0 16px' }}>
          בדיקת רכב חדש
        </h3>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(14, 15, 17, 0.06)',
            borderRadius: '8px',
            padding: '3px',
            marginBottom: '18px',
          }}
        >
          <button
            type="button"
            onClick={() => setTab('screenshot')}
            style={{
              flex: 1,
              padding: '9px 12px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'Heebo, sans-serif',
              cursor: 'pointer',
              background: tab === 'screenshot' ? '#FFFFFF' : 'transparent',
              color: tab === 'screenshot' ? '#0E0F11' : 'rgba(14, 15, 17, 0.6)',
              boxShadow: tab === 'screenshot' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            📸 חילוץ מצילום מסך
          </button>
          <button
            type="button"
            onClick={() => setTab('manual')}
            style={{
              flex: 1,
              padding: '9px 12px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'Heebo, sans-serif',
              cursor: 'pointer',
              background: tab === 'manual' ? '#FFFFFF' : 'transparent',
              color: tab === 'manual' ? '#0E0F11' : 'rgba(14, 15, 17, 0.6)',
              boxShadow: tab === 'manual' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            🔢 הזנה ידנית
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* TAB 1: SCREENSHOT UPLOAD & AUTO-EXTRACTION */}
          {tab === 'screenshot' && (
            <div>
              {/* Initial Upload Button / Card (Mobile friendly tap target) */}
              {!screenshotData && (
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: '100%',
                      padding: '24px 16px',
                      background: '#F6F6F4',
                      border: '1.5px solid rgba(14, 15, 17, 0.12)',
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease, transform 0.1s ease',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        background: '#0E0F11',
                        color: '#D7FF3E',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        marginBottom: '10px',
                      }}
                    >
                      📸
                    </div>
                    <div style={{ font: '800 15px/1.3 Heebo, sans-serif', color: '#0E0F11' }}>
                      בחירת צילום מסך מגלריית התמונות
                    </div>
                    <div
                      style={{
                        font: '400 12px/1.4 Heebo, sans-serif',
                        color: 'rgba(14, 15, 17, 0.58)',
                        marginTop: '4px',
                        maxWidth: '280px',
                      }}
                    >
                      אוטוטו יחלץ אוטומטית את מספר הרישוי והמחיר המבוקש ממודעת יד2 או פייסבוק
                    </div>
                  </button>

                  {/* Mobile Quick Samples */}
                  <div style={{ marginTop: '16px', borderTop: '1px solid rgba(14,15,17,0.08)', paddingTop: '12px' }}>
                    <div style={{ font: '600 11px Heebo, sans-serif', color: 'rgba(14,15,17,0.5)', marginBottom: '8px' }}>
                      או נסו חילוץ מודעה לדוגמה:
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handlePresetSelect('14030003', 75000, "אופל מוקה")}
                        className="chip"
                        style={{ fontSize: '11px', padding: '5px 10px', cursor: 'pointer' }}
                      >
                        ⚡ מוקה 2022
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetSelect('10976303', 135000, "סוזוקי ג'ימני")}
                        className="chip"
                        style={{ fontSize: '11px', padding: '5px 10px', cursor: 'pointer' }}
                      >
                        🚙 ג'ימני 2021
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetSelect('70086701', 79000, "קיה ספורטאז'")}
                        className="chip"
                        style={{ fontSize: '11px', padding: '5px 10px', cursor: 'pointer' }}
                      >
                        🚘 ספורטאז' 2018
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetSelect('48912345', 88000, "יונדאי טוסון")}
                        className="chip"
                        style={{ fontSize: '11px', padding: '5px 10px', cursor: 'pointer' }}
                      >
                        🚗 טוסון 2019
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Scanning in progress state */}
              {screenshotData && isScanning && (
                <div
                  style={{
                    padding: '24px 16px',
                    background: '#FAFAF8',
                    borderRadius: '10px',
                    border: '1.5px solid rgba(14, 15, 17, 0.1)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 14px' }}>
                    <img
                      src={screenshotData}
                      alt="סריקה"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '2px solid #0E0F11',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '8px',
                        background: 'linear-gradient(to bottom, transparent 40%, rgba(215,255,62,0.4) 50%, transparent 60%)',
                        animation: 'pulse 1.2s infinite',
                      }}
                    />
                  </div>
                  <div style={{ font: '800 15px Heebo, sans-serif', color: '#0E0F11' }}>
                    סורק ומחלץ פרטים מהמודעה... ⚡
                  </div>
                  <div style={{ font: '400 12px Heebo, sans-serif', color: 'rgba(14,15,17,0.6)', marginTop: '4px' }}>
                    זיהוי מספר רישוי ומחיר מבוקש
                  </div>
                </div>
              )}

              {/* Extraction Complete Card */}
              {screenshotData && !isScanning && (
                <div>
                  <div
                    style={{
                      background: extractedSuccess ? '#F3F9F1' : '#FFF9F4',
                      border: `1.5px solid ${extractedSuccess ? '#3F7A2E' : '#C24300'}`,
                      borderRadius: '10px',
                      padding: '14px',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span
                        style={{
                          font: '700 12px Heebo, sans-serif',
                          color: extractedSuccess ? '#2E7D32' : '#C24300',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        {extractedSuccess ? '✓ פרטי הרכב זוהו בהצלחה מתוך המודעה' : '⚠️ נדרשת השלמת פרטים'}
                      </span>
                      <button
                        type="button"
                        onClick={resetScreenshotState}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'rgba(14, 15, 17, 0.5)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        החלפת צילום
                      </button>
                    </div>

                    {/* Extracted Details Display */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {/* Thumbnail */}
                      <img
                        src={screenshotData}
                        alt="צילום מסך"
                        style={{
                          width: '54px',
                          height: '54px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          border: '1px solid rgba(0,0,0,0.1)',
                          flexShrink: 0,
                        }}
                      />

                      {/* Info values */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'rgba(14,15,17,0.6)', fontWeight: 600 }}>רישוי:</span>
                          <span
                            style={{
                              fontFamily: 'var(--mono-font)',
                              fontWeight: 900,
                              fontSize: '15px',
                              background: '#FEE500',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid #0E0F11',
                              color: '#0E0F11',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {plate ? formatPlate(plate) : 'לא זוהה'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', color: 'rgba(14,15,17,0.6)', fontWeight: 600 }}>מחיר מודעה:</span>
                          <span style={{ fontWeight: 800, fontSize: '14px', color: '#0E0F11' }}>
                            {adPrice ? `₪${adPrice}` : 'ללא מחיר במודעה'}
                          </span>
                        </div>
                      </div>

                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => setIsEditingExtracted(!isEditingExtracted)}
                        style={{
                          background: 'rgba(14,15,17,0.06)',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: '#0E0F11',
                        }}
                      >
                        {isEditingExtracted ? 'סגירה' : '✏️ עריכה'}
                      </button>
                    </div>

                    {/* Expandable manual edit fields if user wants to override */}
                    {isEditingExtracted && (
                      <div style={{ marginTop: '12px', borderTop: '1px solid rgba(14,15,17,0.08)', paddingTop: '10px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>
                          מספר רישוי:
                        </label>
                        <input
                          type="text"
                          value={plate}
                          onChange={(e) => setPlate(e.target.value.replace(/\D/g, ''))}
                          maxLength={8}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            fontSize: '14px',
                            fontFamily: 'var(--mono-font)',
                            fontWeight: 700,
                            borderRadius: '4px',
                            border: '1px solid #0E0F11',
                            marginBottom: '8px',
                            boxSizing: 'border-box',
                          }}
                        />

                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>
                          מחיר מבוקש:
                        </label>
                        <input
                          type="text"
                          value={adPrice}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setAdPrice(val ? Number(val).toLocaleString() : '');
                          }}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            fontSize: '14px',
                            fontWeight: 600,
                            borderRadius: '4px',
                            border: '1px solid rgba(14,15,17,0.2)',
                            marginBottom: '8px',
                            boxSizing: 'border-box',
                          }}
                        />

                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>
                          ק״מ מוצהר במודעה (אופציונלי):
                        </label>
                        <input
                          type="text"
                          value={declaredKm}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setDeclaredKm(val ? Number(val).toLocaleString() : '');
                          }}
                          placeholder="למשל: 35,000"
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            fontSize: '14px',
                            fontWeight: 600,
                            borderRadius: '4px',
                            border: '1px solid rgba(14,15,17,0.2)',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {extractionError && (
                    <div style={{ fontSize: '12px', color: '#C24300', marginBottom: '12px', fontWeight: 600 }}>
                      {extractionError}
                    </div>
                  )}

                  {/* Primary Submit Button */}
                  <button
                    type="submit"
                    className="btn-action-dark"
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      borderRadius: '8px',
                    }}
                  >
                    הפקת דוח חכם ⚡
                  </button>
                </div>
              )}

              {/* Hidden native mobile file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageFile(e.target.files[0]);
                  }
                }}
              />
            </div>
          )}

          {/* TAB 2: DIRECT MANUAL PLATE ENTRY */}
          {tab === 'manual' && (
            <div>
              <div style={{ marginBottom: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    font: '700 12px Heebo, sans-serif',
                    color: 'rgba(14, 15, 17, 0.75)',
                    marginBottom: '6px',
                  }}
                >
                  מספר רישוי הרכב (7 או 8 ספרות):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.replace(/\D/g, ''))}
                  placeholder="למשל: 70086701"
                  maxLength={8}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '22px',
                    textAlign: 'center',
                    fontFamily: 'var(--mono-font)',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    border: '2px solid #0E0F11',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'block',
                    font: '700 12px Heebo, sans-serif',
                    color: 'rgba(14, 15, 17, 0.75)',
                    marginBottom: '6px',
                  }}
                >
                  מחיר מבוקש במודעה (אופציונלי):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={adPrice}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setAdPrice(val ? Number(val).toLocaleString() : '');
                  }}
                  placeholder="למשל: 79,000 ₪"
                  style={{
                    width: '100%',
                    padding: '11px',
                    fontSize: '15px',
                    textAlign: 'center',
                    fontFamily: 'Heebo, sans-serif',
                    fontWeight: 600,
                    border: '1px solid rgba(14, 15, 17, 0.2)',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'block',
                    font: '700 12px Heebo, sans-serif',
                    color: 'rgba(14, 15, 17, 0.75)',
                    marginBottom: '6px',
                  }}
                >
                  ק״מ מוצהר במודעה (אופציונלי):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={declaredKm}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setDeclaredKm(val ? Number(val).toLocaleString() : '');
                  }}
                  placeholder="למשל: 45,000 ק״מ"
                  style={{
                    width: '100%',
                    padding: '11px',
                    fontSize: '15px',
                    textAlign: 'center',
                    fontFamily: 'Heebo, sans-serif',
                    fontWeight: 600,
                    border: '1px solid rgba(14, 15, 17, 0.2)',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="chip"
                  onClick={onClose}
                  style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '6px' }}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="btn-action-dark"
                  style={{
                    flex: 2,
                    padding: '12px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    borderRadius: '6px',
                  }}
                >
                  הפקת דוח חי ⚡
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
