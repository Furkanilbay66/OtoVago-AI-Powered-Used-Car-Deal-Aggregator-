import React, { useState } from 'react';
import type { DamageBadge, SourcePlatform } from '../types/listing';
import { formatKm, formatPrice } from '../api/client';
import type { NormalizedListing } from '../types/listing';

export function DamageBadgeComp({ badge, detail }: { badge: DamageBadge; detail?: string }) {
  const labels: Record<DamageBadge, string> = {
    NO_DAMAGE: '✓ Hatasız',
    MINOR_DAMAGE: '⚠ Lokal Boyalı',
    MAJOR_DAMAGE: '⚡ Değişen Parça',
    HEAVY_DAMAGE: '✕ Ağır Hasarlı',
  };
  return (
    <span className={`damage-badge damage-badge--${badge}`} title={detail}>
      {labels[badge]}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: SourcePlatform }) {
  const cls = platform.toLowerCase().replace(/[^a-z]/g, '');
  return <span className={`platform-badge platform-badge--${cls}`}>{platform}</span>;
}

export function ScorePill({ score }: { score: number }) {
  const cls = score >= 70 ? 'high' : score >= 45 ? 'mid' : 'low';
  return <span className={`score-pill score-pill--${cls}`}>{score}</span>;
}

export function PriceDiff({ pct }: { pct: number }) {
  if (pct === 0) return null;
  const isCheap = pct < 0;
  return (
    <span className={`listing-card__price-diff listing-card__price-diff--${isCheap ? 'below' : 'above'}`}>
      {isCheap ? `▼ %${Math.abs(pct)} ucuz` : `▲ %${Math.abs(pct)} pahalı`}
    </span>
  );
}

// Car image placeholder with brand-colored gradient
function CarImagePlaceholder({ brand, model }: { brand: string; model: string }) {
  const brandColors: Record<string, string> = {
    'kia': '#C8102E', 'fiat': '#8B0000', 'renault': '#EFDF00',
    'volkswagen': '#001E50', 'toyota': '#EB0A1E', 'honda': '#CC0000',
    'hyundai': '#002C5F', 'dacia': '#FFCD11', 'ford': '#003476',
    'bmw': '#0066B2', 'mercedes-benz': '#222222', 'audi': '#BB0A30',
    'peugeot': '#003189', 'opel': '#FFCC00', 'skoda': '#4BA82E',
    'seat': '#D0021B', 'citroen': '#C6122B',
  };
  const color = brandColors[brand.toLowerCase()] || '#3B7BFF';
  return (
    <div style={{
      width: '100%', height: '100%',
      background: `linear-gradient(135deg, ${color}22 0%, ${color}44 100%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '8px',
    }}>
      <span style={{ fontSize: '2.5rem' }}>🚗</span>
      <span style={{ fontSize: '0.7rem', color: 'var(--clr-text-3)', fontWeight: 600, textAlign: 'center', padding: '0 8px' }}>
      </span>
    </div>
  );
}

interface ListingCardProps {
  listing: NormalizedListing;
  rank?: number;
  onSelectListing?: (listing: NormalizedListing) => void;
}

export function ListingCard({ listing, rank, onSelectListing }: ListingCardProps) {
  const [imgError, setImgError] = React.useState(false);

  return (
    <div
      className="listing-card fade-in"
      style={{ cursor: onSelectListing ? 'pointer' : 'default' }}
      onClick={() => onSelectListing && onSelectListing(listing)}
    >
      {/* Car Image */}
      <div className="listing-card__img">
        {listing.image_url && !imgError ? (
          <img
            src={listing.image_url}
            alt={`${listing.brand} ${listing.model}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <CarImagePlaceholder brand={listing.brand} model={listing.model} />
        )}
      </div>

      {/* Body */}
      <div className="listing-card__body">
        <div className="listing-card__top">
          <div>
            <div className="listing-card__title">{listing.title}</div>
            <div className="listing-card__meta">
              <span className="listing-card__meta-item">📅 {listing.year}</span>
              <span className="listing-card__meta-item">🛣 {formatKm(listing.mileage_km)}</span>
              <span className="listing-card__meta-item">⛽ {listing.fuel_type}</span>
              <span className="listing-card__meta-item">⚙️ {listing.transmission}</span>
              {listing.location && <span className="listing-card__meta-item">📍 {listing.location}</span>}
            </div>
          </div>
        </div>
        <div className="listing-card__tags">
          <DamageBadgeComp badge={listing.damage_badge} detail={listing.damage_detail} />
          <PlatformBadge platform={listing.source_platform} />
          {listing.trim_level && <span className="listing-card__tag">{listing.trim_level}</span>}
          {listing.color && <span className="listing-card__tag">{listing.color}</span>}
          {listing.engine_cc && <span className="listing-card__tag">{listing.engine_cc}cc</span>}
          {listing.horsepower && <span className="listing-card__tag">{listing.horsepower}bg</span>}
        </div>
        {/* AI Simulated disclaimer */}
        <div style={{ marginTop: '8px', fontSize: '0.68rem', color: 'var(--clr-text-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>🤖</span> Gemini AI analizi · Tıklayarak detaylı ekspertiz ve finans raporunu görün
        </div>
      </div>

      {/* Right panel */}
      <div className="listing-card__right">
        <div>
          <div className="listing-card__price">{formatPrice(listing.price)}</div>
          <PriceDiff pct={listing.price_vs_market} />
        </div>
        <div className="listing-card__score">
          <span className="listing-card__score-num">{listing.vago_score}</span>
          <span className="listing-card__score-label">Vago Skor</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }} onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onSelectListing && onSelectListing(listing)}
            className="listing-card__action"
            style={{ width: '100%', cursor: 'pointer', border: 'none' }}
          >
            📋 Detayları İncele →
          </button>
          <a
            href={`/api/listings/${listing.id}/redirect`}
            target="_blank"
            rel="noreferrer noopener"
            referrerPolicy="no-referrer"
            style={{
              fontSize: '0.72rem', color: 'var(--clr-text-2)', textAlign: 'center',
              textDecoration: 'underline', opacity: 0.8,
            }}
            title={`${listing.source_platform} üzerindeki aktif ${listing.brand} ${listing.model} ${listing.year} ilanlarına git`}
          >
            🔍 İlanı {listing.source_platform}'da Bul ↗
          </a>
        </div>
      </div>
    </div>
  );
}

