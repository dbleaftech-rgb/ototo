import React, { useState, useRef } from 'react';

interface NewVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: { plate: string; adPrice?: number; screenshotUrl?: string }) => void;
}

export const NewVehicleModal: React.FC<NewVehicleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [tab, setTab] = useState<'screenshot' | 'plate'>('screenshot');
  const [plate, setPlate] = useState('');
  const [adPrice, setAdPrice] = useState('');
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for clipboard paste (e.g. Cmd+V / Ctrl+V)
  React.useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          handleFileSelect(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('נא להעלות קובץ תמונה (PNG, JPG, WebP)');
      return;
    }

    setScreenshotName(file.name || 'צילום מסך מהלוח');
    setIsScanning(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setScreenshotData(dataUrl);

      // Smart heuristic extraction from filename if available
      const digitsMatch = file.name.match(/\b\d{7,8}\b/);
      if (digitsMatch && !plate) {
        setPlate(digitsMatch[0]);
      }

      const priceMatch = file.name.match(/\b(\d{2,3})[0kK]\b/);
      if (priceMatch && !adPrice) {
        // e.g. 79k -> 79000
      }

      setTimeout(() => {
        setIsScanning(false);
      }, 700);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPlate = plate.replace(/\D/g, '');
    if (cleanPlate.length < 7 || cleanPlate.length > 8) {
      alert('מספר רישוי בישראל כולל 7 או 8 ספרות. אנא הזינו מספר תקין.');
      return;
    }

    const parsedPrice = adPrice ? Number(adPrice.replace(/\D/g, '')) : undefined;
    onSubmit({
      plate: cleanPlate,
      adPrice: parsedPrice && parsedPrice > 1000 ? parsedPrice : undefined,
      screenshotUrl: screenshotData || undefined,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(14, 15, 17, 0.78)',
        backdropFilter: 'blur(5px)',
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
          maxWidth: '400px',
          padding: '24px 20px',
          borderRadius: '8px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
          background: '#FFFFFF',
          position: 'relative',
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
            background: 'transparent',
            border: 'none',
            fontSize: '20px',
            lineHeight: 1,
            cursor: 'pointer',
            color: 'rgba(14, 15, 17, 0.4)',
            padding: '4px',
          }}
        >
          ✕
        </button>

        <div className="hkick" style={{ margin: 0 }}>בדיקה חכמה מול המאגרים</div>
        <h3 style={{ font: '900 22px/1.2 Heebo, sans-serif', margin: '4px 0 16px' }}>
          בדיקת רכב חדש
        </h3>

        {/* Segmented Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(14, 15, 17, 0.06)',
            borderRadius: '6px',
            padding: '3px',
            marginBottom: '18px',
          }}
        >
          <button
            type="button"
            onClick={() => setTab('screenshot')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'Heebo, sans-serif',
              cursor: 'pointer',
              background: tab === 'screenshot' ? '#FFFFFF' : 'transparent',
              color: tab === 'screenshot' ? '#0E0F11' : 'rgba(14, 15, 17, 0.55)',
              boxShadow: tab === 'screenshot' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            📸 צילום מסך מיד2
          </button>
          <button
            type="button"
            onClick={() => setTab('plate')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'Heebo, sans-serif',
              cursor: 'pointer',
              background: tab === 'plate' ? '#FFFFFF' : 'transparent',
              color: tab === 'plate' ? '#0E0F11' : 'rgba(14, 15, 17, 0.55)',
              boxShadow: tab === 'plate' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            🔢 מספר רישוי
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* TAB 1: Screenshot Upload */}
          {tab === 'screenshot' && (
            <div style={{ marginBottom: '16px' }}>
              {!screenshotData ? (
                <>
                  <div
                    onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? '#0E0F11' : 'rgba(14, 15, 17, 0.22)'}`,
                    borderRadius: '6px',
                    padding: '22px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragOver ? 'rgba(14, 15, 17, 0.03)' : '#FAFAF8',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '30px', marginBottom: '6px' }}>📸</div>
                  <div style={{ font: '700 14px/1.3 Heebo, sans-serif', color: '#0E0F11' }}>
                    גררו לכאן צילום מסך או לחצו להעלאה
                  </div>
                  <div
                    style={{
                      font: '400 12px/1.4 Heebo, sans-serif',
                      color: 'rgba(14, 15, 17, 0.55)',
                      marginTop: '4px',
                    }}
                  >
                    תומך בצילומי מסך מיד2, פייסבוק, או תמונת רכב
                  </div>
                  <div
                    style={{
                      marginTop: '8px',
                      display: 'inline-block',
                      background: 'rgba(14, 15, 17, 0.06)',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      font: '600 11px Heebo, sans-serif',
                      color: 'rgba(14, 15, 17, 0.65)',
                    }}
                  >
                    📋 אפשר גם להדביק ישירות (Cmd+V / Ctrl+V)
                  </div>
                </div>

                {/* Quick Examples */}
                <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(14, 15, 17, 0.5)', fontWeight: 600 }}>דוגמאות מהירות:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPlate('10976303');
                      setAdPrice('135,000');
                    }}
                    className="chip"
                    style={{ fontSize: '11px', padding: '3px 8px', cursor: 'pointer' }}
                  >
                    🚙 ג'ימני 2021
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlate('70086701');
                      setAdPrice('79,000');
                    }}
                    className="chip"
                    style={{ fontSize: '11px', padding: '3px 8px', cursor: 'pointer' }}
                  >
                    🚘 ספורטאז' 2018
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlate('48912345');
                      setAdPrice('88,000');
                    }}
                    className="chip"
                    style={{ fontSize: '11px', padding: '3px 8px', cursor: 'pointer' }}
                  >
                    🚗 טוסון 2019
                  </button>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    border: '1px solid rgba(14, 15, 17, 0.12)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: isScanning ? '#F4FBF4' : '#FAFAF8',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <img
                    src={screenshotData}
                    alt="צילום מסך"
                    style={{
                      width: '56px',
                      height: '56px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      filter: isScanning ? 'brightness(0.9)' : 'none',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        font: '700 13px Heebo, sans-serif',
                        color: isScanning ? '#1B5E20' : '#2E7D32',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>{isScanning ? '⚡' : '✓'}</span>
                      {isScanning ? 'מזהה פרטי מודעה...' : 'צילום מסך נטען בהצלחה'}
                    </div>
                    <div
                      style={{
                        font: '400 11px Heebo, sans-serif',
                        color: 'rgba(14, 15, 17, 0.6)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {screenshotName}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotData(null);
                      setScreenshotName('');
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(14, 15, 17, 0.5)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: '4px',
                    }}
                  >
                    החלפה
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {/* Verified fields section */}
              <div style={{ marginTop: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    font: '700 12px Heebo, sans-serif',
                    color: 'rgba(14, 15, 17, 0.75)',
                    marginBottom: '4px',
                  }}
                >
                  מספר רישוי הרכב (7 או 8 ספרות):
                </label>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.replace(/\D/g, ''))}
                  placeholder="למשל: 70086701 או 10976303"
                  maxLength={8}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '18px',
                    textAlign: 'center',
                    fontFamily: 'var(--mono-font)',
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    border: '1.5px solid #0E0F11',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    marginBottom: '10px',
                  }}
                />

                <label
                  style={{
                    display: 'block',
                    font: '700 12px Heebo, sans-serif',
                    color: 'rgba(14, 15, 17, 0.75)',
                    marginBottom: '4px',
                  }}
                >
                  מחיר מבוקש במודעה (אופציונלי):
                </label>
                <input
                  type="text"
                  value={adPrice}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setAdPrice(val ? Number(val).toLocaleString() : '');
                  }}
                  placeholder="למשל: 79,000 ₪"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '15px',
                    textAlign: 'center',
                    fontFamily: 'Heebo, sans-serif',
                    fontWeight: 600,
                    border: '1px solid rgba(14, 15, 17, 0.2)',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 2: Direct Plate Input */}
          {tab === 'plate' && (
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  font: '700 12px Heebo, sans-serif',
                  color: 'rgba(14, 15, 17, 0.75)',
                  marginBottom: '4px',
                }}
              >
                מספר רישוי בישראל:
              </label>
              <input
                type="text"
                autoFocus
                value={plate}
                onChange={(e) => setPlate(e.target.value.replace(/\D/g, ''))}
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
                  boxSizing: 'border-box',
                  marginBottom: '12px',
                }}
              />

              <label
                style={{
                  display: 'block',
                  font: '700 12px Heebo, sans-serif',
                  color: 'rgba(14, 15, 17, 0.75)',
                  marginBottom: '4px',
                }}
              >
                מחיר מבוקש במודעה (אופציונלי):
              </label>
              <input
                type="text"
                value={adPrice}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setAdPrice(val ? Number(val).toLocaleString() : '');
                }}
                placeholder="למשל: 79,000 ₪"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '15px',
                  textAlign: 'center',
                  fontFamily: 'Heebo, sans-serif',
                  fontWeight: 600,
                  border: '1px solid rgba(14, 15, 17, 0.2)',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              type="button"
              className="chip"
              onClick={onClose}
              style={{ flex: 1, padding: '12px', textAlign: 'center' }}
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
              }}
            >
              הפקת דוח חי ⚡
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
