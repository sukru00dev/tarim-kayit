import MarketPrice from '../models/MarketPrice.js';

// Get the latest prices for all commodities, and calculate % change from yesterday
export const getLatestPrices = async (req, res) => {
  try {
    // Get distinct commodities
    const commodities = await MarketPrice.distinct('commodity');
    
    const results = [];

    for (const commodity of commodities) {
      // Find top 2 most recent records
      const records = await MarketPrice.find({ commodity })
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
    
    const records = await MarketPrice.find({ commodity })
      .sort({ date: 1 }) // Ascending for charts (oldest to newest)
      .limit(30);

    // Format for Recharts { name: 'DD/MM', Fiyat: 10.5 }
    const formattedData = records.map(record => {
      const d = new Date(record.date);
      return {
        name: `${d.getDate()}/${d.getMonth() + 1}`,
        Fiyat: record.price,
        fullDate: record.date
      };
    });

    res.json({ success: true, data: formattedData, unit: records.length > 0 ? records[0].unit : '' });
  } catch (error) {
    console.error('Fiyat geçmişi çekilirken hata:', error);
    res.status(500).json({ success: false, error: 'Fiyat geçmişi alınamadı' });
  }
};
