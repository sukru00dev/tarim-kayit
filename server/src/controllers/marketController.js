import MarketPrice from '../models/MarketPrice.js';
import yahooFinance from 'yahoo-finance2';

// Helper mapping for Yahoo Finance futures symbols
const Tickers = {
  'Buğday': 'ZW=F', // CBOT Wheat
  'Mısır': 'ZC=F',  // CBOT Corn
  'Soya Fasulyesi': 'ZS=F' // CBOT Soybeans
};

// Conversion factors: 1 bushel to kg
const BushelToKg = {
  'Buğday': 27.2155,
  'Mısır': 25.4012,
  'Soya Fasulyesi': 27.2155
};

// Internal function to sync data from Yahoo Finance
const syncDataInternal = async () => {
  try {
    // 1. Get USD/TRY exchange rate
    const tryQuote = await yahooFinance.quote('TRY=X');
    const usdTry = tryQuote.regularMarketPrice;

    const commodities = ['Buğday', 'Mısır', 'Soya Fasulyesi'];
    const newPrices = [];
    
    for (const comm of commodities) {
      const ticker = Tickers[comm];
      const quote = await yahooFinance.quote(ticker);
      
      // CBOT Grain Futures are usually priced in US Cents per Bushel
      const priceCents = quote.regularMarketPrice;
      const priceUsdBushel = priceCents / 100;

      // Calculate TURIB equivalent (TL/kg)
      const priceUsdKg = priceUsdBushel / BushelToKg[comm];
      const priceTlKg = priceUsdKg * usdTry;

      // Upsert CME record
      const cmeRecord = await MarketPrice.findOneAndUpdate(
        { commodity: comm, source: 'CME', date: { $gte: new Date().setHours(0,0,0,0) } },
        { price: parseFloat(priceUsdBushel.toFixed(2)), unit: 'USD/Bushel', source: 'CME', date: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      newPrices.push(cmeRecord);

      // Upsert TURIB record
      const turibRecord = await MarketPrice.findOneAndUpdate(
        { commodity: comm, source: 'TURIB', date: { $gte: new Date().setHours(0,0,0,0) } },
        { price: parseFloat(priceTlKg.toFixed(2)), unit: 'TL/kg', source: 'TURIB', date: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      newPrices.push(turibRecord);
    }
    return newPrices;
  } catch (error) {
    console.error('Yahoo Finance sync failed:', error);
    throw error;
  }
};

// Get the latest prices for all commodities, grouped by source
export const getLatestPrices = async (req, res) => {
  try {
    const { source } = req.query; // 'TURIB', 'CME', 'Local_Hal'
    const filter = source ? { source } : {};

    // Auto-sync if no data exists for today
    const todayCount = await MarketPrice.countDocuments({
      date: { $gte: new Date().setHours(0,0,0,0) },
      source: source || 'TURIB'
    });

    if (todayCount === 0) {
      await syncDataInternal().catch(e => console.error("Auto-sync error", e));
    }

    const commodities = await MarketPrice.distinct('commodity', filter);
    const results = [];

    for (const commodity of commodities) {
      const records = await MarketPrice.find({ commodity, ...filter })
        .sort({ date: -1 })
        .limit(2);

      if (records.length > 0) {
        const current = records[0];
        let changePercent = 0;
        let changeAmount = 0;

        if (records.length === 2) {
          const previous = records[1];
          changeAmount = current.price - previous.price;
          changePercent = (changeAmount / previous.price) * 100;
        }

        results.push({
          commodity: current.commodity,
          price: current.price,
          unit: current.unit,
          source: current.source,
          date: current.date,
          changeAmount: parseFloat(changeAmount.toFixed(2)),
          changePercent: parseFloat(changePercent.toFixed(2))
        });
      }
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Piyasa verileri çekilirken hata:', error);
    res.status(500).json({ success: false, error: 'Piyasa verileri alınamadı' });
  }
};

// Get the last 30 days of data for a specific commodity for the chart
export const getCommodityHistory = async (req, res) => {
  try {
    const { commodity } = req.params;
    const { source } = req.query;
    
    const filter = { commodity };
    if (source) filter.source = source;

    const records = await MarketPrice.find(filter)
      .sort({ date: 1 }) // Ascending for charts
      .limit(30);

    const formattedData = records.map(record => {
      const d = new Date(record.date);
      return {
        name: `${d.getDate()}/${d.getMonth() + 1}`,
        Fiyat: record.price,
        source: record.source,
        fullDate: record.date
      };
    });

    res.json({ success: true, data: formattedData, unit: records.length > 0 ? records[0].unit : '' });
  } catch (error) {
    console.error('Fiyat geçmişi çekilirken hata:', error);
    res.status(500).json({ success: false, error: 'Fiyat geçmişi alınamadı' });
  }
};

// Admin sync endpoint
export const syncMarketPrices = async (req, res) => {
  try {
    const newPrices = await syncDataInternal();
    res.json({ success: true, message: 'Borsa fiyatları senkronize edildi (Gerçek Veri)', data: newPrices });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Borsa senkronizasyonu başarısız' });
  }
};
