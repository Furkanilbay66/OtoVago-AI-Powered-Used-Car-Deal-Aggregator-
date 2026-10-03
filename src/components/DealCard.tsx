import React, { useState } from 'react';
import type { NormalizedListing } from '../types/listing';
import { formatKm, formatPrice } from '../api/client';
import { DamageBadgeComp, PlatformBadge, PriceDiff } from './ListingCard';

interface DealCardProps {
  listing: NormalizedListing;
  role: 'cheapest' | 'champion' | 'clean';
  onSelectListing?: (listing: NormalizedListing) => void;
}

const ROLE_META = {
  cheapest: {
    label: '🏷️ En Ucuz',
    badgeCls: 'cheapest',
    cardCls: 'deal-card--cheapest',
    title: 'Mutlak En Ucuz',
    subtitle: 'Piyasanın en bütçe dostu seçeneği',
  },
  champion: {
    label: '🏆 F/P Şampiyonu',
    badgeCls: 'champion',
    cardCls: 'deal-card--champion',
    title: 'OtoVago F/P Şampiyonu',
    subtitle: 'Fiyat & kilometre & hasar dengesi en iyi',
  },
  clean: {
    label: '✨ En Temiz',
    badgeCls: 'clean',
    cardCls: 'deal-card--clean',
    title: 'En Temiz & En Uygun',
    subtitle: 'Hatasız boyasız tramersiz araçların en ucuzu',
  },
};

export function DealCard({ listing, role, onSelectListing }: DealCardProps) {
  const meta = ROLE_META[role];
  const scorePct = `${listing.vago_score}%`;
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`deal-card ${meta.cardCls} fade-in`}>
      {/* Car Image */}
      {listing.image_url && !imgError && (
        <div style={{
          width: '100%', height: '160px', overflow: 'hidden',
          borderBottom: '1px solid var(--clr-border)',
          flexShrink: 0,
        }}>
          <img
            src={listing.image_url}
            alt={`${listing.brand} ${listing.model}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        </div>
      )}
      {(!listing.image_url || imgError) && (
        <div style={{
          width: '100%', height: '120px',
          background: 'linear-gradient(135deg, var(--clr-surface-2), var(--clr-surface))',
          borderBottom: '1px solid var(--clr-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.5rem',
          flexShrink: 0,
        }}>
          🚗
        </div>
      )}

      <div className="deal-card__header">
        <div className={`deal-card__badge deal-card__badge--${meta.badgeCls}`}>
          {meta.label}
        </div>
        <div className="deal-card__title">{listing.title}</div>
        <div className="deal-card__subtitle">{listing.trim_level} • {listing.year} • {listing.fuel_type}</div>
      </div>

      <div className="deal-card__body">
        <div className="deal-card__price">{formatPrice(listing.price)}</div>
        <div>
          <PriceDiff pct={listing.price_vs_market} />
        </div>

        <div className="deal-card__meta" style={{ marginTop: '12px' }}>
          <span className="deal-card__meta-item">
            <span className="deal-card__meta-icon">🛣</span>
            {formatKm(listing.mileage_km)}
          </span>
          <span className="deal-card__meta-item">
            <span className="deal-card__meta-icon">📅</span>
            {listing.year}
          </span>
          <span className="deal-card__meta-item">
            <span className="deal-card__meta-icon">📍</span>
            {listing.location}
          </span>
          <span className="deal-card__meta-item">
            <span className="deal-card__meta-icon">⛽</span>
            {listing.fuel_type}
          </span>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <DamageBadgeComp badge={listing.damage_badge} detail={listing.damage_detail} />
        </div>

        <div className="deal-card__note">{listing.deal_note}</div>

        {role !== 'cheapest' && (
          <div className="deal-card__score">
            <span className="deal-card__score-label">OtoVago Skor</span>
            <div className="deal-card__score-bar">
              <div className="deal-card__score-fill" style={{ width: scorePct }} />
            </div>
            <span className="deal-card__score-value">{listing.vago_score}</span>
          </div>
        )}

        {/* AI Disclaimer */}
        <div style={{
          fontSize: '0.68rem', color: 'var(--clr-text-3)',
          display: 'flex', alignItems: 'center', gap: '4px',
          marginBottom: '12px', lineHeight: 1.4,
        }}>
          🤖 AI simüle ilan · Platforma yönlendiriliyor, benzer araçları göreceksiniz
        </div>

        <div className="deal-card__footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }} onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onSelectListing && onSelectListing(listing)}
            className="deal-card__link"
            style={{ width: '100%', justifyContent: 'center', fontWeight: 800, padding: '12px', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, var(--clr-primary), #2563EB)', color: '#FFFFFF', borderRadius: '10px' }}
          >
            📋 Detayları İncele & Ekspertiz →
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '4px' }}>
            <PlatformBadge platform={listing.source_platform} />
            <a
              href={`/api/listings/${listing.id}/redirect`}
              target="_blank"
              rel="noreferrer noopener"
              referrerPolicy="no-referrer"
              style={{
                fontSize: '0.75rem', color: 'var(--clr-text-2)', textAlign: 'right',
                textDecoration: 'underline', opacity: 0.9, fontWeight: 600,
              }}
              title={`${listing.source_platform} üzerindeki aktif ${listing.brand} ${listing.model} ${listing.year} ilanlarını bul`}
            >
              🔍 İlanı {listing.source_platform}'da Bul ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
