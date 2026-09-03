import React, { useEffect, useState } from 'react';
import { Logo } from './Logo.js';

interface LoadingScreenProps {
  plate?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ plate }) => {
  const messages = [
    'מאתר את הרכב במאגרי משרד התחבורה…',
    'סופר בעלויות ובודק עבר ליסינג והחכר…',
    'מחלץ נתוני ק״מ וקריאות טסט אחרונות…',
    'בודק ריקולים בטיחותיים ותווי נכה…',
    'מחשב את ציון אוטוטו וטווח הסגירה למו״מ…',
  ];

  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#121110',
        color: '#FFFFFF',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <Logo height={22} className="text-white" />

      {/* Breathing Lime Halo & Spinner */}
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          margin: '40px auto 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '80px',
            height: '80px',
            background: '#D7FF3E',
            filter: 'blur(32px)',
            opacity: 0.45,
            borderRadius: '50%',
            animation: 'pulse 2s infinite ease-in-out',
          }}
        />
        <svg
          width="74"
          height="74"
          viewBox="0 0 74 74"
          fill="none"
          style={{ animation: 'spin 1.4s linear infinite' }}
        >
          <circle
            cx="37"
            cy="37"
            r="32"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="3.5"
          />
          <circle
            cx="37"
            cy="37"
            r="32"
            stroke="#D7FF3E"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="50 150"
          />
        </svg>
      </div>

      {plate && (
        <div
          style={{
            font: "700 13px/1 'IBM Plex Mono', monospace",
            color: '#D7FF3E',
            letterSpacing: '1px',
            marginBottom: '10px',
          }}
        >
          רכב {plate}
        </div>
      )}

      <div
        style={{
          font: '800 16px/1.4 Heebo, sans-serif',
          color: '#FFFFFF',
          minHeight: '44px',
          transition: 'all 0.3s ease',
        }}
      >
        {messages[msgIndex]}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(0.9); opacity: 0.35; }
          50% { transform: scale(1.15); opacity: 0.65; }
        }
      `}</style>
    </div>
  );
};
