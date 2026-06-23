import MarketPrice from '../models/MarketPrice.js';

// Get the latest prices for all commodities, grouped by source
export const getLatestPrices = async (req, res) => {
  try {
    const { source } = req.query; // 'TURIB', 'CME', 'Local_Hal'
    const filter = source ? { source } : {};

    const commodities = await MarketPrice.distinct('commodity', filter);
    
    const results = [];

    for (const commodity of commodities) {
      // Bulunan source(lar) için en güncel 2 kaydı getir
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
      .sort({ date: 1 }) // Ascending for charts (oldest to newest)
      .limit(30);

    // Format for Recharts { name: 'DD/MM', Fiyat: 10.5 }
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

// Mock TÜRİB/CME fiyat senkronizasyonu
export const syncMarketPrices = async (req, res) => {
  try {
    // Burada normalde gerçek bir API'ye (örn. Bloomberg, TCMB, TÜRİB) istek atılır.
    // Simülasyon amaçlı rastgele dalgalanma yaratıyoruz.
    const commodities = ['Buğday', 'Mısır', 'Soya Fasulyesi'];
    const sources = ['TURIB', 'CME'];
    
    const newPrices = [];
    
    for (const comm of commodities) {
      for (const src of sources) {
        const basePrice = src === 'CME' ? (comm === 'Soya Fasulyesi' ? 12.5 : 5.2) : (comm === 'Buğday' ? 9.5 : 8.2); // CME in USD, TURIB in TL
        const fluctuation = (Math.random() * 0.4) - 0.2; // -0.2 to +0.2
        
        const mp = new MarketPrice({
          commodity: comm,
          price: parseFloat((basePrice + fluctuation).toFixed(2)),
          unit: src === 'CME' ? 'USD/Bushel' : 'TL/kg',
          source: src,
          date: new Date()
        });
        
        // Benzersiz index nedeniyle hata almamak için var olan bugünün kaydını ez
        await MarketPrice.findOneAndUpdate(
          { commodity: comm, source: src, date: { $gte: new Date().setHours(0,0,0,0) } },
          { price: mp.price, unit: mp.unit, source: mp.source },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        newPrices.push(mp);
      }
    }
    
    res.json({ success: true, message: 'Borsa fiyatları senkronize edildi', data: newPrices });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Borsa senkronizasyonu başarısız' });
  }
};
