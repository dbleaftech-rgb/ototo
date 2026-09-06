import React, { useEffect, useState } from 'react';
import { Story } from './components/Story.js';
import { DealHub } from './components/DealHub.js';
import { SellerApproval } from './components/SellerApproval.js';
import { LoadingScreen } from './components/LoadingScreen.js';
import { NewVehicleModal } from './components/NewVehicleModal.js';
import { fetchOrCreateDeal } from './services/vehicleSearchService.js';

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

  const handleVehicleSubmit = async (params: { plate: string; adPrice?: number; screenshotUrl?: string }) => {
    setSearchPlate(params.plate);
    setSearching(true);
    setSearchOpen(false);
    try {
      const data = await fetchOrCreateDeal({
        plate: params.plate,
        adPrice: params.adPrice,
        screenshotUrl: params.screenshotUrl,
        buyerPhone: '0501234567',
      });
      if (data?.deal && data?.report) {
        setDeal(data.deal);
        setReport(data.report);
        setMode('story');
        try {
          const url = new URL(window.location.href);
          url.searchParams.set('plate', params.plate);
          if (params.adPrice) url.searchParams.set('price', String(params.adPrice));
          window.history.pushState({}, '', url.toString());
        } catch {
          // ignore
        }
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
    const paramPlate = params.get('plate') || params.get('p');
    const paramPrice = params.get('price');
    const paramMode = params.get('mode');

    if (paramMode === 'hub') {
      setMode('hub');
    }

    if (paramPlate) {
      setLoading(true);
      fetchOrCreateDeal({
        plate: paramPlate,
        adPrice: paramPrice ? Number(paramPrice) : undefined,
      })
        .then((data) => {
          if (data?.deal && data?.report) {
            setDeal(data.deal);
            setReport(data.report);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
      return;
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
      {/* Search & Screenshot Upload Modal */}
      <NewVehicleModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSubmit={handleVehicleSubmit}
      />

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
