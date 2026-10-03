import type { RawListing, NormalizedListing, DamageBadge } from '../types/listing.js';

export function normalizePrice(raw: string): number {
  // "1.450.000 TL" -> 1450000
  // "1,450,000" -> 1450000
  // "1450000" -> 1450000
  return parseInt(
    raw
      .replace(/[^\d,\.]/g, '')
      .replace(/\./g, '')
      .replace(/,/g, ''),
    10
  ) || 0;
}

export function normalizeMileage(raw: string): number {
  return parseInt(
    raw
      .replace(/[^\d,\.]/g, '')
      .replace(/\./g, '')
      .replace(/,/g, ''),
    10
  ) || 0;
}

export function normalizeDamageBadge(description: string): DamageBadge {
  const lower = description.toLowerCase();

  if (
    lower.includes('pert') ||
    lower.includes('ağır hasarlı') ||
    lower.includes('agir hasarli') ||
    lower.includes('total loss') ||
    lower.includes('hurda')
  ) {
    return 'HEAVY_DAMAGE';
  }

  if (
    lower.includes('değişen') ||
    lower.includes('degisen') ||
    lower.includes('major') ||
    lower.includes('büyük hasar') ||
    lower.includes('byk hasar') ||
    (lower.includes('tramer') && (lower.includes('ağır') || lower.includes('yüksek')))
  ) {
    return 'MAJOR_DAMAGE';
  }

  if (
    lower.includes('boyalı') ||
    lower.includes('boyali') ||
    lower.includes('lokal') ||
    lower.includes('minor') ||
    (lower.includes('parça') && lower.includes('boya')) ||
    lower.includes('küçük hasar') ||
    lower.includes('küçük boya')
  ) {
    return 'MINOR_DAMAGE';
  }

  // NO_DAMAGE indicators
  if (
    lower.includes('hatasız') ||
    lower.includes('hatasiz') ||
    lower.includes('boyasız') ||
    lower.includes('boyasiz') ||
    lower.includes('tramersiz') ||
    lower.includes('no damage') ||
    lower.includes('temiz')
  ) {
    return 'NO_DAMAGE';
  }

  // Default: check for explicit "yok" around damage words
  return 'NO_DAMAGE';
}

export function normalizeListings(raws: RawListing[], marketAvg: number): Omit<NormalizedListing, 'vago_score' | 'deal_note' | 'price_vs_market'>[] {
  return raws.map(raw => ({
    id: raw.id,
    title: raw.title,
    price: normalizePrice(raw.price_raw),
    mileage_km: normalizeMileage(raw.mileage_raw),
    year: raw.year,
    brand: raw.brand,
    model: raw.model,
    trim_level: raw.trim_level,
    fuel_type: raw.fuel_type,
    transmission: raw.transmission,
    damage_badge: normalizeDamageBadge(raw.damage_description),
    damage_detail: raw.damage_description,
    source_platform: raw.source_platform,
    location: raw.location,
    listing_url: raw.listing_url,
    image_url: raw.image_url,
    color: raw.color,
    engine_cc: raw.engine_cc,
    horsepower: raw.horsepower,
  }));
}

export function sanitizeVavaUrl(url: string): string {
  if (!url) return '';
  // Rewrite invalid vavacars.com.tr domain to official tr.vava.cars
  return url.replace(/vavacars\.com\.tr/g, 'tr.vava.cars').replace(/https?:\/\/vava\.cars/g, 'https://tr.vava.cars');
}

export function validateAndSanitizeListingUrl(rawUrl: string, platform: string = 'Sahibinden'): string {
  if (!rawUrl) return '';

  // 1. Strip all tracking parameters after ?
  let cleanUrl = rawUrl.split('?')[0].trim();

  const plat = (platform || '').toLowerCase();

  // 2. Sahibinden Transformation and Validation
  if (plat.includes('sahibinden')) {
    cleanUrl = cleanUrl.replace('m.sahibinden.com', 'www.sahibinden.com');
    if (!cleanUrl.endsWith('/detay')) {
      cleanUrl = `${cleanUrl}/detay`;
    }
    if (!cleanUrl.includes('/ilan/')) {
      console.warn(`[WARN] [Sahibinden] Geçersiz detay URL'i! Kategori adresi tespit edildi: ${rawUrl}`);
    }
    return cleanUrl;
  }

  // 3. Arabam Transformation and Validation
  if (plat.includes('arabam')) {
    cleanUrl = cleanUrl.replace('m.arabam.com', 'www.arabam.com');
    if (!cleanUrl.includes('/ilan/')) {
      console.warn(`[WARN] [Arabam] Nokta atışı ilan adresi değil! Kategori adresi tespit edildi: ${rawUrl}`);
    }
    return cleanUrl;
  }

  // 4. VavaCars Transformation and Validation
  if (plat.includes('vava')) {
    cleanUrl = sanitizeVavaUrl(cleanUrl);
    if (!cleanUrl.includes('/araba-detay/')) {
      console.warn(`[WARN] [VavaCars] Detay sayfası formatına uymuyor: ${rawUrl}`);
    }
    return cleanUrl;
  }

  return cleanUrl;
}

export function sanitizeSahibindenUrl(url: string): string {
  return validateAndSanitizeListingUrl(url, 'Sahibinden');
}

export function sanitizeListingUrl(url: string, platform: string = 'Sahibinden'): string {
  return validateAndSanitizeListingUrl(url, platform);
}

