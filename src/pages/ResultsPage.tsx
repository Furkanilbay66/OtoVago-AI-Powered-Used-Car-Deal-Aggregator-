import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchDeals, fetchSearch, formatPrice, refreshListings } from '../api/client';
import { DealCard } from '../components/DealCard';
import { ListingCard, DamageBadgeComp, ScorePill, PlatformBadge } from '../components/ListingCard';
import { ListingModal } from '../components/ListingModal';
import { Navbar } from '../components/Navbar';
import type { SearchFilters, NormalizedListing } from '../types/listing';

const DAMAGE_OPTIONS = [
  { value: 'ALL', label: 'Tüm Durumlar' },
  { value: 'NO_DAMAGE', label: '✓ Hatasız' },
  { value: 'MINOR_DAMAGE', label: '⚠ Lokal Boyalı' },
  { value: 'MAJOR_DAMAGE', label: '⚡ Değişen Parça' },
  { value: 'HEAVY_DAMAGE', label: '✕ Ağır Hasarlı' },
];
const PLATFORM_OPTIONS = ['ALL', 'Sahibinden', 'Arabam', 'VavaCars', 'Otokoç', 'CarTR'];
const SORT_OPTIONS = [
  { value: 'score', label: '🏆 OtoVago Skoru' },
  { value: 'price_asc', label: '💰 Fiyat (Düşük→Yüksek)' },
  { value: 'price_desc', label: '💰 Fiyat (Yüksek→Düşük)' },
  { value: 'mileage', label: '🛣 Kilometre (Az→Çok)' },
  { value: 'year', label: '📅 Yıl (Yeni→Eski)' },
];

function formatNum(n: number) {
  return new Intl.NumberFormat('tr-TR').format(n);
}

export default function ResultsPage() {
  const { model } = useParams<{ model: string }>();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<SearchFilters>({
    model: model || '',
    sort: 'score',
  });
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<NormalizedListing | null>(null);

  // Main deals query
  const dealsQuery = useQuery({
    queryKey: ['deals', model],
    queryFn: () => fetchDeals(model!),
    enabled: !!model,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Search/filter query
  const searchQuery = useQuery({
    queryKey: ['search', filters],
    queryFn: () => fetchSearch(filters),
    enabled: !!model,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  useEffect(() => {
    setFilters(f => ({ ...f, model: model || '' }));
  }, [model]);

  const handleFilterChange = (key: keyof SearchFilters, value: string | number) => {
    setFilters(f => ({ ...f, [key]: value || undefined }));
  };

  const handleReset = () => {
    setFilters({ model: model || '', sort: 'score' });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshListings(model!);
      dealsQuery.refetch();
      searchQuery.refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const isLoading = dealsQuery.isLoading || searchQuery.isLoading;
  const hasError = dealsQuery.isError || searchQuery.isError;

  const listings: NormalizedListing[] = searchQuery.data?.results || [];
  const meta = dealsQuery.data?.search_meta;
  const deals = dealsQuery.data?.highlighted_deals;

  return (
    <div style={{ minHeight: '100vh', paddingTop: '64px' }}>
      <Navbar />

      {/* Top bar */}
      <div style={{ background: 'var(--clr-bg-2)', borderBottom: '1px solid var(--clr-border)', padding: '12px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/')} style={{
            background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
            borderRadius: '8px', padding: '6px 14px', color: 'var(--clr-text-2)',
            fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
          }}>
            ← Ana Sayfa
          </button>
          <span style={{ color: 'var(--clr-text-3)', fontSize: '0.85rem' }}>
            {meta ? `${meta.model_queried} — ${meta.total_listings_found} ilan bulundu` : 'Yükleniyor...'}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              marginLeft: 'auto', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
              borderRadius: '8px', padding: '6px 14px', color: 'var(--clr-primary)',
              fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
              opacity: isRefreshing ? 0.6 : 1,
            }}
          >
            {isRefreshing ? '⏳ Yenileniyor...' : '🔄 İlanları Yenile'}
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '32px', paddingBottom: '64px' }}>

        {/* Error */}
        {hasError && (
          <div className="error-banner">
            <span>⚠️</span>
            <div>
              <strong>Bağlantı hatası</strong> — API sunucusunun çalıştığından emin olun.
              <br /><code style={{ fontSize: '0.75rem' }}>npm run dev</code> komutunu çalıştırın.
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner" />
            <div className="loading-text">Gemini AI ilanları analiz ediyor...</div>
            <div className="loading-subtext">40 ilan toplanıp skorlanıyor, lütfen bekleyin (~10sn)</div>
          </div>
        )}

        {!isLoading && !hasError && (
          <>
            {/* Search Meta */}
            {meta && (
              <div className="search-meta fade-in">
                <div>
                  <div className="search-meta__title">{meta.model_queried}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)', marginTop: '4px' }}>
                    Ortalama piyasa fiyatı: <strong style={{ color: 'var(--clr-primary)' }}>{formatPrice(meta.average_market_price)}</strong>
                  </div>
                </div>
                <div className="search-meta__stats">
                  <div className="search-meta__stat">
                    <span className="search-meta__stat-num">{meta.total_listings_found}</span>
                    <span className="search-meta__stat-label">İlan</span>
                  </div>
                  <div className="search-meta__stat">
                    <span className="search-meta__stat-num">{formatNum(meta.min_price)}</span>
                    <span className="search-meta__stat-label">Min TL</span>
                  </div>
                  <div className="search-meta__stat">
                    <span className="search-meta__stat-num">{formatNum(meta.max_price)}</span>
                    <span className="search-meta__stat-label">Max TL</span>
                  </div>
                </div>
              </div>
            )}

            {/* Highlighted Deals */}
            {deals && (
              <div>
                <div className="section__label" style={{ marginBottom: '16px' }}>⭐ Öne Çıkan Fırsatlar</div>
                <div className="deal-cards">
                  <DealCard listing={deals.absolute_cheapest} role="cheapest" onSelectListing={setSelectedListing} />
                  <DealCard listing={deals.best_value_champ} role="champion" onSelectListing={setSelectedListing} />
                  <DealCard listing={deals.cleanest_mint} role="clean" onSelectListing={setSelectedListing} />
                </div>
              </div>
            )}

            {/* Full Listings */}
            <div className="results-layout">
              {/* Filter Sidebar */}
              <aside className="filter-sidebar fade-in">
                <div className="filter-sidebar__title">
                  <span>⚙️</span> Filtreler
                </div>

                <div className="filter-group">
                  <div className="filter-group__label">Hasar Durumu</div>
                  <select
                    className="filter-group__select"
                    value={filters.damageBadge || 'ALL'}
                    onChange={e => handleFilterChange('damageBadge', e.target.value)}
                  >
                    {DAMAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <div className="filter-group">
                  <div className="filter-group__label">Platform</div>
                  <select
                    className="filter-group__select"
                    value={filters.platform || 'ALL'}
                    onChange={e => handleFilterChange('platform', e.target.value)}
                  >
                    {PLATFORM_OPTIONS.map(o => <option key={o} value={o}>{o === 'ALL' ? 'Tüm Platformlar' : o}</option>)}
                  </select>
                </div>

                <div className="filter-group">
                  <div className="filter-group__label">Fiyat Aralığı (TL)</div>
                  <div className="filter-row">
                    <input
                      className="filter-input" type="number" placeholder="Min"
                      value={filters.minPrice || ''}
                      onChange={e => handleFilterChange('minPrice', parseInt(e.target.value) || 0)}
                    />
                    <input
                      className="filter-input" type="number" placeholder="Max"
                      value={filters.maxPrice || ''}
                      onChange={e => handleFilterChange('maxPrice', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="filter-group">
                  <div className="filter-group__label">Yıl Aralığı</div>
                  <div className="filter-row">
                    <input
                      className="filter-input" type="number" placeholder="Min" min={2010} max={2026}
                      value={filters.minYear || ''}
                      onChange={e => handleFilterChange('minYear', parseInt(e.target.value) || 0)}
                    />
                    <input
                      className="filter-input" type="number" placeholder="Max" min={2010} max={2026}
                      value={filters.maxYear || ''}
                      onChange={e => handleFilterChange('maxYear', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="filter-group">
                  <div className="filter-group__label">Max Kilometre</div>
                  <input
                    className="filter-input" type="number" placeholder="Örn: 150000" style={{ width: '100%' }}
                    value={filters.maxKm || ''}
                    onChange={e => handleFilterChange('maxKm', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="filter-group">
                  <div className="filter-group__label">Sıralama</div>
                  <select
                    className="filter-group__select"
                    value={filters.sort || 'score'}
                    onChange={e => handleFilterChange('sort', e.target.value)}
                  >
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <button className="filter-reset" onClick={handleReset}>Filtreleri Temizle</button>
              </aside>

              {/* Listings Main */}
              <main>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                    {listings.length} ilan
                    {searchQuery.isFetching && <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)', marginLeft: '8px' }}>güncelleniyor...</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setView('cards')}
                      style={{
                        background: view === 'cards' ? 'var(--clr-primary)' : 'var(--clr-surface)',
                        border: '1px solid var(--clr-border)', borderRadius: '8px',
                        padding: '6px 14px', color: view === 'cards' ? 'white' : 'var(--clr-text-2)',
                        fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                      }}
                    >≡ Kart</button>
                    <button
                      onClick={() => setView('table')}
                      style={{
                        background: view === 'table' ? 'var(--clr-primary)' : 'var(--clr-surface)',
                        border: '1px solid var(--clr-border)', borderRadius: '8px',
                        padding: '6px 14px', color: view === 'table' ? 'white' : 'var(--clr-text-2)',
                        fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                      }}
                    >⊞ Tablo</button>
                  </div>
                </div>

                {listings.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state__icon">🔎</div>
                    <div className="empty-state__title">İlan bulunamadı</div>
                    <div>Filtrelerinizi gevşetin ya da farklı bir model deneyin.</div>
                  </div>
                ) : view === 'cards' ? (
                  <div className="listing-grid">
                    {listings.map((l, i) => (
                      <ListingCard key={l.id} listing={l} rank={i + 1} onSelectListing={setSelectedListing} />
                    ))}
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Araç</th>
                          <th>Fiyat</th>
                          <th>KM</th>
                          <th>Yıl</th>
                          <th>Hasar</th>
                          <th>Platform</th>
                          <th>Skor</th>
                          <th>İlan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listings.map((l, i) => (
                          <tr key={l.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedListing(l)}>
                            <td>
                              <div className={`table__rank table__rank--${i < 3 ? i + 1 : ''}`}>
                                {i + 1}
                              </div>
                            </td>
                            <td>
                              <div className="table__title">{l.brand} {l.model}</div>
                              <div className="table__subtitle">{l.trim_level} • {l.color || ''}</div>
                            </td>
                            <td className="table__price">{formatPrice(l.price)}</td>
                            <td style={{ color: 'var(--clr-text-2)', fontSize: '0.85rem' }}>
                              {formatNum(l.mileage_km)} km
                            </td>
                            <td style={{ color: 'var(--clr-text-2)', fontSize: '0.85rem' }}>{l.year}</td>
                            <td><DamageBadgeComp badge={l.damage_badge} detail={l.damage_detail} /></td>
                            <td><PlatformBadge platform={l.source_platform} /></td>
                            <td><ScorePill score={l.vago_score} /></td>
                            <td onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => setSelectedListing(l)}
                                className="table__link"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                              >
                                Detay →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </main>
            </div>
          </>
        )}
      </div>

      {/* Carvago Style Vehicle Inspection Modal */}
      <ListingModal listing={selectedListing} onClose={() => setSelectedListing(null)} />
    </div>
  );
}
