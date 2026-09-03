import React from 'react';

interface PlateProps {
  plate: string;
  onClick?: () => void;
}

export function formatPlate(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 8) {
    return digits.replace(/(\d{3})(\d{2})(\d{3})/, '$1-$2-$3');
  }
  if (digits.length === 7) {
    return digits.replace(/(\d{2})(\d{3})(\d{2})/, '$1-$2-$3');
  }
  return raw;
}

export const Plate: React.FC<PlateProps> = ({ plate, onClick }) => {
  const formatted = formatPlate(plate);
  return (
    <div
      className="il-plate"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.1s ease',
      }}
      title={onClick ? 'לחץ לבדיקת רכב אחר' : undefined}
    >
      <span className="il-plate-tab">IL</span>
      <span className="il-plate-num">
        {formatted}
        {onClick && <span style={{ marginRight: '4px', fontSize: '9px' }}>🔍</span>}
      </span>
    </div>
  );
};
