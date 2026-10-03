import express from 'express';
import { generateListingsWithGemini, getSupportedModels } from '../engine/gemini.js';
import { normalizeListings, validateAndSanitizeListingUrl } from '../engine/normalizer.js';
import { calculateVagoScore, calculatePriceVsMarket, generateDealNote, selectHighlightedDeals } from '../engine/scorer.js';
import { generatePlatformUrl, generateGoogleSearchUrl, getCarImage } from '../engine/urlbuilder.js';
import type { NormalizedListing } from '../types/listing.js';

const router = express.Router();

// In-memory cache per model
const cache = new Map<string, { data: NormalizedListing[]; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function getOrGenerateListings(modelKey: string, count: number = 20): Promise<NormalizedListing[]> {
  const cacheEntry = cache.get(modelKey);
  if (cacheEntry && Date.now() - cacheEntry.timestamp < CACHE_TTL) {
    console.log(`[Cache HIT] ${modelKey}`);
    return cacheEntry.data;
  }

  console.log(`[Gemini] Generating ${count} listings for: ${modelKey}`);
  const rawListings = await generateListingsWithGemini(modelKey, count);

  // First pass: normalize without score
  const partialNorm = normalizeListings(rawListings, 0);

  // Calculate market average
  const prices = partialNorm.map(l => l.price).filter(p => p > 0);
  const marketAvg = prices.length > 0
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    : 0;

  // Final: add scores, notes, REAL platform URLs, and car images
  const currentYear = new Date().getFullYear();
  const normalized: NormalizedListing[] = partialNorm.map((l, idx) => ({
    ...l,
    // Real direct platform listing detail URL matching Sahibinden/Arabam detail page format
    listing_url: generatePlatformUrl(l.source_platform, modelKey, {
      brand: l.brand,
      model: l.model,
      year: l.year,
      price: l.price,
      location: l.location,
      trim_level: l.trim_level,
      fuel_type: l.fuel_type,
      id: l.id,
      title: l.title,
    }),
    // Direct Google search fallback URL
    google_search_url: generateGoogleSearchUrl(l.source_platform, l.brand, l.model, l.year, l.location, l.price),
    // Real car image from Wikimedia Commons
    image_url: l.image_url || getCarImage(modelKey, idx),
    vago_score: calculateVagoScore(l, marketAvg, currentYear),
    price_vs_market: calculatePriceVsMarket(l.price, marketAvg),
    deal_note: generateDealNote(l, marketAvg, 'regular'),
  }));

  // Sort by vago_score descending
  normalized.sort((a, b) => b.vago_score - a.vago_score);

  cache.set(modelKey, { data: normalized, timestamp: Date.now() });
  return normalized;
}

// GET /api/models
router.get('/models', (_req, res) => {
  res.json({ models: getSupportedModels() });
});

// GET /api/search?model=kia-sportage&minPrice=&maxPrice=&minYear=&maxYear=&maxKm=&damageBadge=&platform=
router.get('/search', async (req, res) => {
  const {
    model,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    maxKm,
    damageBadge,
    platform,
    sort = 'score',
  } = req.query as Record<string, string>;

  if (!model) {
    return res.status(400).json({ error: 'model parametresi gerekli' });
  }

  try {
    let listings = await getOrGenerateListings(model, 20);

    // Apply filters
    if (minPrice) listings = listings.filter(l => l.price >= parseInt(minPrice));
    if (maxPrice) listings = listings.filter(l => l.price <= parseInt(maxPrice));
    if (minYear) listings = listings.filter(l => l.year >= parseInt(minYear));
    if (maxYear) listings = listings.filter(l => l.year <= parseInt(maxYear));
    if (maxKm) listings = listings.filter(l => l.mileage_km <= parseInt(maxKm));
    if (damageBadge && damageBadge !== 'ALL') listings = listings.filter(l => l.damage_badge === damageBadge);
    if (platform && platform !== 'ALL') listings = listings.filter(l => l.source_platform === platform);

    // Apply sort
    switch (sort) {
      case 'price_asc': listings.sort((a, b) => a.price - b.price); break;
      case 'price_desc': listings.sort((a, b) => b.price - a.price); break;
      case 'mileage': listings.sort((a, b) => a.mileage_km - b.mileage_km); break;
      case 'year': listings.sort((a, b) => b.year - a.year); break;
      case 'score':
      default: listings.sort((a, b) => b.vago_score - a.vago_score); break;
    }

    res.json({
      results: listings,
      total: listings.length,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'İlanlar yüklenirken hata oluştu' });
  }
});

// GET /api/deals?model=kia-sportage
router.get('/deals', async (req, res) => {
  const { model } = req.query as Record<string, string>;
  if (!model) return res.status(400).json({ error: 'model parametresi gerekli' });

  try {
    const listings = await getOrGenerateListings(model, 20);
    const prices = listings.map(l => l.price).filter(p => p > 0);
    const marketAvg = prices.length > 0
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : 0;

    const deals = selectHighlightedDeals(listings);
    if (!deals) return res.status(404).json({ error: 'İlan bulunamadı' });

    const { absoluteCheapest, bestValue, cleanestMint } = deals;

    // Override deal notes for highlighted roles
    const cheapest = { ...absoluteCheapest, deal_note: generateDealNote(absoluteCheapest, marketAvg, 'cheapest') };
    const champ = { ...bestValue, deal_note: generateDealNote(bestValue, marketAvg, 'best_value') };
    const clean = { ...cleanestMint, deal_note: generateDealNote(cleanestMint, marketAvg, 'cleanest') };

    const modelDisplay = listings[0]
      ? `${listings[0].brand} ${listings[0].model}`
      : model;

    res.json({
      search_meta: {
        model_queried: modelDisplay,
        total_listings_found: listings.length,
        average_market_price: marketAvg,
        min_price: Math.min(...prices),
        max_price: Math.max(...prices),
        generated_at: new Date().toISOString(),
      },
      highlighted_deals: {
        absolute_cheapest: cheapest,
        best_value_champ: champ,
        cleanest_mint: clean,
      },
      full_comparison_table: listings.map((l, i) => ({ rank: i + 1, ...l })),
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Fırsatlar hesaplanırken hata oluştu' });
  }
});

// POST /api/refresh?model=kia-sportage  (clears cache and regenerates)
router.post('/refresh', async (req, res) => {
  const { model } = req.query as Record<string, string>;
  if (!model) return res.status(400).json({ error: 'model parametresi gerekli' });
  cache.delete(model);
  res.json({ message: `${model} önbelleği temizlendi. Bir sonraki istekte yenilenecek.` });
});

// GET /api/listings/:id/redirect (Client-Side HTML Double Meta Refresh Redirect Handler)
router.get('/listings/:id/redirect', async (req, res) => {
  const listingId = req.params.id;
  let targetUrl: string | undefined;
  let platform = 'Sahibinden';

  // 1. Search in cached model entries
  for (const cacheEntry of cache.values()) {
    const found = cacheEntry.data.find(l => l.id === listingId);
    if (found) {
      targetUrl = found.listing_url || found.google_search_url;
      platform = found.source_platform;
      break;
    }
  }

  // 2. If not found in cache, construct fallback URL from listingId format (e.g. audi-a3-001 -> audi-a3)
  if (!targetUrl) {
    const parts = listingId.split('-');
    if (parts.length >= 3) {
      const modelKey = parts.slice(0, -1).join('-');
      const modelListings = await getOrGenerateListings(modelKey, 20);
      const found = modelListings.find(l => l.id === listingId) || modelListings[0];
      if (found) {
        targetUrl = found.listing_url || found.google_search_url;
        platform = found.source_platform;
      }
    }
  }

  if (!targetUrl) {
    targetUrl = 'https://www.sahibinden.com';
  }

  // 3. Validate and Sanitize target URL
  const cleanUrl = validateAndSanitizeListingUrl(targetUrl, platform);

  // 4. Analytics log
  console.log(`[ANALYTICS] Listing redirected: ${listingId} (${platform}) -> ${cleanUrl}`);

  // 5. Set HTTP headers for Referrer stripping
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  // 6. Send Double Meta Refresh + JS Redirect HTML output
  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="referrer" content="no-referrer">
      <meta http-equiv="refresh" content="0;url=${cleanUrl}">
      <title>OtoVago - İlana Yönlendiriliyorsunuz</title>
      <style>
        body {
          background-color: #0A0B0E;
          color: #F8FAFC;
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .loader {
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="loader">
        <p>OtoVago Güvencesiyle İlana Yönlendiriliyorsunuz...</p>
      </div>
      <script>
        window.location.replace("${cleanUrl}");
      </script>
    </body>
    </html>
  `);
});


export default router;
