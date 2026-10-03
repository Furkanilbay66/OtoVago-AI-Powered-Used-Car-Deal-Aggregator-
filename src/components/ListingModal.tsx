import React, { useState } from 'react';
import type { NormalizedListing } from '../types/listing';
import { formatKm, formatPrice } from '../api/client';
import { DamageBadgeComp, PlatformBadge, PriceDiff } from './ListingCard';

interface ListingModalProps {
  listing: NormalizedListing | null;
  onClose: () => void;
}

export function ListingModal({ listing, onClose }: ListingModalProps) {
  if (!listing) return null;

  const [downPayment, setDownPayment] = useState(Math.round(listing.price * 0.2));
  const [months, setMonths] = useState(48);

  const loanAmount = Math.max(0, listing.price - downPayment);
  const monthlyRate = 0.035; // ~3.5% monthly interest rate
  const monthlyPayment = loanAmount > 0
    ? Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1))
    : 0;

  const scoreLevel = listing.vago_score >= 75 ? 'ÇOK YÜKSEK' : listing.vago_score >= 60 ? 'YÜKSEK' : 'MAKUL';
  const scoreColor = listing.vago_score >= 75 ? '#10B981' : listing.vago_score >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(6, 8, 17, 0.88)',
        backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(20, 26, 46, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          width: '100%', maxWidth: '820px',
          maxHeight: '92vh', overflowY: 'auto',
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
          color: '#F3F4F6',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#9CA3AF' }}>
            ARAÇ DETAYI - {listing.brand} {listing.model}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#F3F4F6', width: '32px', height: '32px',
              borderRadius: '50%', cursor: 'pointer', fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Hero Spec Banner */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'center',
            background: 'rgba(10, 14, 28, 0.6)', padding: '16px', borderRadius: '18px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            {/* Left Photo */}
            <div style={{ height: '160px', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <img
                src={listing.image_url}
                alt={listing.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Right Price & Score Gauge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.5px' }}>
                  {formatPrice(listing.price)}
                </div>
                <div style={{ display: 'inline-block', marginTop: '4px' }}>
                  <PriceDiff pct={listing.price_vs_market} />
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.03)', padding: '10px 18px', borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.08)', width: '100%',
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: scoreColor }}>
                  {listing.vago_score} <span style={{ fontSize: '0.9rem', color: '#9CA3AF', fontWeight: 600 }}>/ 100</span>
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', letterSpacing: '1px', marginTop: '2px' }}>
                  OTOVAGO SKORU: <span style={{ color: scoreColor }}>{scoreLevel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Section Body Grid */}
        <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* Section 1: TEKNİK ÖZELLİKLER */}
          <div style={{ gridColumn: 'span 2', background: 'rgba(10, 14, 28, 0.5)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#9CA3AF', letterSpacing: '1px', marginBottom: '12px', textTransform: 'uppercase' }}>
              1) TEKNİK ÖZELLİKLER
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
              {[
                { icon: '🛣', label: 'Km', val: formatKm(listing.mileage_km) },
                { icon: '📅', label: 'Model', val: listing.year },
                { icon: '⛽', label: 'Yakıt', val: listing.fuel_type },
                { icon: '⚙️', label: 'Şanzıman', val: listing.transmission },
                { icon: '📍', label: 'Konum', val: listing.location || 'İstanbul' },
              ].map((item, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span>{item.icon}</span> {item.label}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '4px', color: '#FFFFFF' }}>
                    {item.val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: KAPORTA VE EKSPERTİZ */}
          <div style={{ background: 'rgba(10, 14, 28, 0.5)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#9CA3AF', letterSpacing: '1px', marginBottom: '12px', textTransform: 'uppercase' }}>
              2) KAPORTA VE EKSPERTİZ
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.08)', flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              fontSize: '0.9rem', fontWeight: 700, color: '#E5E7EB', lineHeight: 1.5,
            }}>
              {listing.damage_detail}
            </div>
          </div>

          {/* Section 3: FİNANSMAN HESAPLAYICI */}
          <div style={{ background: 'rgba(10, 14, 28, 0.5)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#9CA3AF', letterSpacing: '1px', marginBottom: '12px', textTransform: 'uppercase' }}>
              3) FİNANSMAN HESAPLAYICI
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600 }}>
                    <span>Peşinat</span>
                    <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{formatPrice(downPayment)}</span>
                  </div>
                  <input
                    type="range"
                    min={Math.round(listing.price * 0.1)}
                    max={Math.round(listing.price * 0.7)}
                    step={10000}
                    value={downPayment}
                    onChange={e => setDownPayment(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#3B7BFF', cursor: 'pointer', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600 }}>
                    <span>Vade</span>
                    <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{months} ay</span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={48}
                    step={12}
                    value={months}
                    onChange={e => setMonths(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#3B7BFF', cursor: 'pointer', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.65rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>AYLIK ÖDEME:</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>
                  {formatPrice(monthlyPayment)} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#9CA3AF' }}>/ ay</span>
                </div>
                <div style={{ fontSize: '0.62rem', color: '#6B7280', marginTop: '4px' }}>
                  Toplam Maliyet: {formatPrice(downPayment + monthlyPayment * months)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: İŞLEMLER */}
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '14px', marginTop: '6px' }}>
            <a
              href={`/api/listings/${listing.id}/redirect`}
              target="_blank"
              rel="noreferrer noopener"
              referrerPolicy="no-referrer"
              style={{
                flex: 2, background: 'linear-gradient(135deg, #FF6B00 0%, #FF8800 100%)',
                color: '#FFFFFF', fontWeight: 800, fontSize: '0.95rem',
                padding: '14px', borderRadius: '14px', textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 8px 20px -4px rgba(255, 107, 0, 0.4)', transition: 'transform 0.2s',
              }}
            >
              🚀 İlanı {listing.source_platform}'da Aç →
            </a>
            <a
              href={listing.listing_url}
              target="_blank"
              rel="noreferrer noopener"
              referrerPolicy="no-referrer"
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#E5E7EB', fontWeight: 700, fontSize: '0.85rem',
                padding: '14px', borderRadius: '14px', textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              📂 Kategoriye Git ↗
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
