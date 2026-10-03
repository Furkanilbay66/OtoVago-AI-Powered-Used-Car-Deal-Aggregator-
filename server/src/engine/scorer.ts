import type { NormalizedListing, DamageBadge } from '../types/listing.js';

interface ScoringWeights {
  price: number;    // 40 points
  mileage: number;  // 30 points
  damage: number;   // 20 points
  age: number;      // 10 points
}

const WEIGHTS: ScoringWeights = {
  price: 40,
  mileage: 30,
  damage: 20,
  age: 10,
};

const DAMAGE_SCORES: Record<DamageBadge, number> = {
  NO_DAMAGE: 20,
  MINOR_DAMAGE: 14,
  MAJOR_DAMAGE: 6,
  HEAVY_DAMAGE: 0,
};

export function calculateVagoScore(
  listing: Omit<NormalizedListing, 'vago_score' | 'deal_note' | 'price_vs_market'>,
  marketAvg: number,
  currentYear: number = new Date().getFullYear()
): number {
  let score = 0;

  // --- Price Score (40 pts max) ---
  // Higher score if price is below market average
  const priceDelta = (marketAvg - listing.price) / marketAvg;
  const priceScore = Math.min(WEIGHTS.price, Math.max(0, WEIGHTS.price * (1 + priceDelta)));
  score += priceScore;

  // --- Mileage Score (30 pts max) ---
  // 0 km = 30pts, 300,000 km = 0pts (linear)
  const mileageScore = Math.max(0, WEIGHTS.mileage * (1 - listing.mileage_km / 300000));
  score += mileageScore;

  // --- Damage Score (20 pts max) ---
  score += DAMAGE_SCORES[listing.damage_badge];

  // --- Age Score (10 pts max) ---
  const age = currentYear - listing.year;
  const ageScore = Math.max(0, WEIGHTS.age * (1 - age / 15));
  score += ageScore;

  return Math.round(Math.min(100, Math.max(0, score)));
}

export function calculatePriceVsMarket(price: number, marketAvg: number): number {
  // Returns percentage: negative = cheaper than market, positive = more expensive
  return Math.round(((price - marketAvg) / marketAvg) * 100);
}

export function generateDealNote(
  listing: Omit<NormalizedListing, 'vago_score' | 'deal_note' | 'price_vs_market'>,
  marketAvg: number,
  role: 'cheapest' | 'best_value' | 'cleanest' | 'regular'
): string {
  const pct = Math.abs(Math.round(((listing.price - marketAvg) / marketAvg) * 100));
  const direction = listing.price < marketAvg ? 'altında' : 'üstünde';
  const kmStr = listing.mileage_km.toLocaleString('tr-TR');
  const ageYears = new Date().getFullYear() - listing.year;

  switch (role) {
    case 'cheapest':
      return `Piyasa ortalamasının %${pct} ${direction}. ${listing.damage_badge !== 'NO_DAMAGE' ? 'Hasar durumuna dikkat — ' : ''}Bütçe odaklı en uygun seçenek.`;
    case 'best_value':
      return `${kmStr} km, ${ageYears} yaşında ve piyasanın %${pct} ${direction}. Fiyat/Performans açısından en mantıklı seçim.`;
    case 'cleanest':
      return `Hatasız, boyasız, tramersiz. Masrafsız kullanım için en temiz seçenek. Piyasa ortalamasının %${pct} ${direction}.`;
    default:
      if (listing.price < marketAvg) {
        return `Piyasa ortalamasının %${pct} altında. ${kmStr} km — ${listing.damage_badge === 'NO_DAMAGE' ? 'Hatasız.' : 'Hasar detaylarını inceleyin.'}`;
      }
      return `${kmStr} km, ${listing.year} model. ${listing.source_platform} üzerinde aktif ilan.`;
  }
}

export function selectHighlightedDeals(listings: NormalizedListing[]) {
  if (listings.length === 0) return null;

  // Absolute cheapest (exclude HEAVY_DAMAGE if alternatives exist)
  const nonHeavy = listings.filter(l => l.damage_badge !== 'HEAVY_DAMAGE');
  const cheapestPool = nonHeavy.length > 0 ? nonHeavy : listings;
  const absoluteCheapest = [...cheapestPool].sort((a, b) => a.price - b.price)[0];

  // Best value: highest vago_score (balanced)
  const bestValue = [...listings].sort((a, b) => b.vago_score - a.vago_score)[0];

  // Cleanest mint: lowest price among NO_DAMAGE
  const noDamageListings = listings.filter(l => l.damage_badge === 'NO_DAMAGE');
  const cleanestMint = noDamageListings.length > 0
    ? [...noDamageListings].sort((a, b) => a.price - b.price)[0]
    : [...listings].sort((a, b) => a.vago_score - b.vago_score).reverse()[0];

  return { absoluteCheapest, bestValue, cleanestMint };
}
