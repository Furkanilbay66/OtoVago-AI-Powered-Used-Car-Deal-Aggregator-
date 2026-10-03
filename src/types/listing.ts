export type DamageBadge = 'NO_DAMAGE' | 'MINOR_DAMAGE' | 'MAJOR_DAMAGE' | 'HEAVY_DAMAGE';
export type FuelType = 'Benzin' | 'Dizel' | 'Hybrid' | 'Elektrik' | 'LPG';
export type TransmissionType = 'Manuel' | 'Otomatik' | 'Yarı Otomatik';
export type SourcePlatform = 'Sahibinden' | 'Arabam' | 'VavaCars' | 'Otokoç' | 'CarTR' | 'Otomobil';

export interface NormalizedListing {
  id: string;
  title: string;
  price: number;
  mileage_km: number;
  year: number;
  brand: string;
  model: string;
  trim_level: string;
  fuel_type: FuelType;
  transmission: TransmissionType;
  damage_badge: DamageBadge;
  damage_detail: string;
  source_platform: SourcePlatform;
  location: string;
  listing_url: string;
  google_search_url?: string;
  image_url?: string;
  color?: string;
  engine_cc?: number;
  horsepower?: number;
  vago_score: number;
  price_vs_market: number;
  deal_note: string;
  rank?: number;
}

export interface SearchMeta {
  model_queried: string;
  total_listings_found: number;
  average_market_price: number;
  min_price: number;
  max_price: number;
  generated_at: string;
}

export interface HighlightedDeals {
  absolute_cheapest: NormalizedListing;
  best_value_champ: NormalizedListing;
  cleanest_mint: NormalizedListing;
}

export interface DealsResponse {
  search_meta: SearchMeta;
  highlighted_deals: HighlightedDeals;
  full_comparison_table: NormalizedListing[];
}

export interface SupportedModel {
  key: string;
  brand: string;
  model: string;
  display: string;
  variants: string[];
}

export interface SearchFilters {
  model: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  maxKm?: number;
  damageBadge?: string;
  platform?: string;
  sort?: string;
}
