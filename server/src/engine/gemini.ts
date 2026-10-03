import { GoogleGenerativeAI } from '@google/generative-ai';
import type { RawListing } from '../types/listing.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const SUPPORTED_MODELS: Record<string, { brand: string; variants: string[] }> = {
  'kia-sportage': { brand: 'Kia', variants: ['1.6 T-GDI Cool', '1.6 T-GDI Elegance', '2.0 MPI Edition', '1.6 CRDi Comfort', '2.0 MHEV GT Line'] },
  'fiat-egea': { brand: 'Fiat', variants: ['1.4 Fire Easy', '1.3 Multijet Urban', '1.4 Fire Lounge', '1.6 Multijet Cross', '1.4 Fire Pop Star'] },
  'renault-megane': { brand: 'Renault', variants: ['1.5 dCi Touch', '1.6 Joy', '1.3 TCe Joy', '1.5 dCi Icon', '1.6 Privilege'] },
  'volkswagen-polo': { brand: 'Volkswagen', variants: ['1.0 TSI Comfortline', '1.0 MPI Trendline', '1.6 TDI Highline', '1.0 TSI Highline', '1.0 TSI Business'] },
  'toyota-corolla': { brand: 'Toyota', variants: ['1.8 Hybrid Dream', '1.6 Advance', '1.8 Hybrid Flame', '1.6 Flame', '2.0 Hybrid Dream'] },
  'honda-civic': { brand: 'Honda', variants: ['1.5 VTEC Turbo Elegance', '1.6 i-DTEC Executive', '1.0 VTEC Elegance', '1.5 VTEC Turbo Sport', '1.6 i-DTEC Sport'] },
  'hyundai-i20': { brand: 'Hyundai', variants: ['1.4 MPI Jump', '1.2 MPI Style', '1.4 CRDI Jump', '1.0 T-GDI Jump Plus', '1.4 MPI Style'] },
  'dacia-duster': { brand: 'Dacia', variants: ['1.3 TCe Prestige', '1.5 dCi Comfort', '1.6 SCe Essential', '1.3 TCe Journey', '1.5 Blue dCi Extreme'] },
  'ford-focus': { brand: 'Ford', variants: ['1.5 EcoBoost Titanium', '1.5 TDCi Trend X', '1.6 TDCi Trend', '2.0 TDCi ST-Line', '1.5 EcoBoost ST-Line'] },
  'bmw-3-series': { brand: 'BMW', variants: ['320i Luxury Line', '320d M Sport', '330i xDrive', '318i Sport Line', '316d Urban Line'] },
  'mercedes-c-class': { brand: 'Mercedes-Benz', variants: ['C180 AMG', 'C200 Avantgarde', 'C220d AMG', 'C180 Urban', 'C200 4Matic'] },
  'audi-a3': { brand: 'Audi', variants: ['1.6 TDI Attraction', '1.4 TFSI Sport', '1.5 TFSI S tronic', '2.0 TDI S line', '1.0 TFSI Design'] },
  'peugeot-308': { brand: 'Peugeot', variants: ['1.6 BlueHDi Active', '1.2 PureTech Allure', '1.5 BlueHDi GT', '1.6 THP GT Line', '1.2 PureTech Active'] },
  'opel-astra': { brand: 'Opel', variants: ['1.4 Dynamic', '1.6 CDTI Excellence', '1.4 Turbo Business', '1.6 CDTI Enjoy', '1.0 Turbo Enjoy'] },
  'skoda-octavia': { brand: 'Skoda', variants: ['1.6 TDI Ambition DSG', '1.4 TSI Style', '2.0 TDI Sportline', '1.6 TDI Active', '1.0 TSI Ambition'] },
  'seat-leon': { brand: 'SEAT', variants: ['1.0 TSI Style', '1.5 TSI FR', '1.6 TDI Xcellence', '1.4 TSI FR', '2.0 TDI Cupra'] },
  'citroen-c3': { brand: 'Citroen', variants: ['1.2 PureTech Shine', '1.5 BlueHDi Feel', '1.2 PureTech Flair', '1.0 VTi Touch', '1.2 PureTech Feel'] },
};

export async function generateListingsWithGemini(modelKey: string, count: number = 20): Promise<RawListing[]> {
  const modelInfo = SUPPORTED_MODELS[modelKey];
  if (!modelInfo) throw new Error(`Unsupported model: ${modelKey}`);

  const ai = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    } as any,
  });

  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 10;
  const modelName = modelKey.split('-').slice(1)
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const prompt = `Türkiye ikinci el araç piyasası Ağustos 2026. ${modelInfo.brand} ${modelName} için ${count} gerçekçi ilan içeren JSON array döndür.

Örnek format:
[
  {
    "id": "${modelKey}-001",
    "title": "2022 ${modelInfo.brand} ${modelName} 1.6 Elegance",
    "price_raw": "850.000 TL",
    "mileage_raw": "55.000 km",
    "year": 2022,
    "brand": "${modelInfo.brand}",
    "model": "${modelName.toUpperCase()}",
    "trim_level": "Elegance",
    "fuel_type": "Benzin",
    "transmission": "Otomatik",
    "damage_description": "Hatasız boyasız tramersiz",
    "source_platform": "Sahibinden",
    "location": "İstanbul",
    "listing_url": "https://sahibinden.com/ilan/${modelKey}-001",
    "color": "Beyaz",
    "engine_cc": 1598,
    "horsepower": 115
  }
]`;

  console.log(`[Gemini] Sending request for ${count} ${modelKey} listings...`);

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await ai.generateContent(prompt);
      const text = result.response.text().trim();

      let parsed: RawListing[] = [];
      try {
        parsed = JSON.parse(text) as RawListing[];
      } catch (parseErr) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]) as RawListing[];
        } else {
          throw parseErr;
        }
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`[Gemini] Successfully generated ${parsed.length} listings for ${modelKey}`);
        return parsed;
      }
    } catch (err: any) {
      console.error(`[Gemini] Attempt ${attempt} error:`, err?.message || err);
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.warn(`[Fallback] Gemini API unavailable or overloaded. Generating fallback realistic listings for ${modelKey}...`);
  return generateFallbackListings(modelKey, count);
}

function generateFallbackListings(modelKey: string, count: number): RawListing[] {
  const modelInfo = SUPPORTED_MODELS[modelKey] || { brand: 'Araç', variants: ['Standart'] };
  const currentYear = new Date().getFullYear();
  const modelName = modelKey.split('-').slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const platforms = ['Sahibinden', 'Arabam', 'VavaCars', 'Otokoç', 'CarTR'] as const;
  const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Kocaeli', 'Adana', 'Konya', 'Eskişehir', 'Trabzon'];
  const colors = ['Beyaz', 'Siyah', 'Gümüş', 'Gri', 'Kırmızı', 'Mavi'];
  const damages = [
    'Hatasız, boyasız, tramersiz',
    'Hatasız boyasız',
    'Sağ çamurluk lokal boyalı, Tramer yok',
    'Sol ön kapı boyalı, 4.500 TL Tramer',
    '2 parça değişen, 15.000 TL Tramer',
    'Kaput değişen, sol arka çamurluk boyalı',
    'Ağır hasarlı / Pert kayıtlı',
  ];

  const basePrices: Record<string, number> = {
    'kia-sportage': 1350000,
    'fiat-egea': 850000,
    'renault-megane': 1100000,
    'volkswagen-polo': 950000,
    'toyota-corolla': 1200000,
    'honda-civic': 1400000,
    'hyundai-i20': 800000,
    'dacia-duster': 1050000,
    'ford-focus': 1150000,
    'bmw-3-series': 2800000,
    'mercedes-c-class': 3100000,
    'audi-a3': 1800000,
    'peugeot-308': 1250000,
    'opel-astra': 1050000,
    'skoda-octavia': 1450000,
    'seat-leon': 1300000,
    'citroen-c3': 750000,
  };

  const basePrice = basePrices[modelKey] || 1000000;
  const listings: RawListing[] = [];

  for (let i = 1; i <= count; i++) {
    const year = currentYear - (i % 8);
    const yearFactor = 1 - (currentYear - year) * 0.05;
    const km = Math.round(15000 + (i * 7350) % 220000);
    const kmFactor = 1 - (km / 300000) * 0.2;
    const damageIdx = i % damages.length;
    const damageFactor = damageIdx === 0 || damageIdx === 1 ? 1.05 : damageIdx < 4 ? 0.95 : damageIdx < 6 ? 0.85 : 0.65;
    
    const price = Math.round(basePrice * yearFactor * kmFactor * damageFactor * (0.9 + (i % 5) * 0.04));
    const variant = modelInfo.variants[i % modelInfo.variants.length];
    const platform = platforms[i % platforms.length];
    const city = cities[i % cities.length];
    const color = colors[i % colors.length];

    listings.push({
      id: `${modelKey}-${String(i).padStart(3, '0')}`,
      title: `${year} ${modelInfo.brand} ${modelName} ${variant}`,
      price_raw: `${new Intl.NumberFormat('tr-TR').format(price)} TL`,
      mileage_raw: `${new Intl.NumberFormat('tr-TR').format(km)} km`,
      year,
      brand: modelInfo.brand,
      model: modelName.toUpperCase(),
      trim_level: variant.split(' ').slice(1).join(' ') || 'Standart',
      fuel_type: variant.includes('dCi') || variant.includes('TDI') || variant.includes('Multijet') || variant.includes('HDi') ? 'Dizel' : variant.includes('Hybrid') ? 'Hybrid' : 'Benzin',
      transmission: i % 2 === 0 ? 'Otomatik' : 'Manuel',
      damage_description: damages[damageIdx],
      source_platform: platform,
      location: city,
      listing_url: `https://www.${platform.toLowerCase()}.com/search`,
      color,
      engine_cc: variant.includes('1.6') ? 1598 : variant.includes('1.4') ? 1368 : variant.includes('1.5') ? 1499 : variant.includes('2.0') ? 1995 : 1199,
      horsepower: variant.includes('2.0') ? 190 : variant.includes('1.6') ? 130 : 95,
    });
  }

  return listings;
}

export function getSupportedModels() {
  return Object.entries(SUPPORTED_MODELS).map(([key, val]) => ({
    key,
    brand: val.brand,
    model: key.split('-').slice(1).join(' ').toUpperCase(),
    display: `${val.brand} ${key.split('-').slice(1).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`,
    variants: val.variants,
  }));
}
