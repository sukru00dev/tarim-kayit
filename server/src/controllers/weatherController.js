import { asyncHandler } from '../middleware/auth.js';
import Asset from '../models/Asset.js';

export const getFieldWeather = asyncHandler(async (req, res) => {
  const { fieldId } = req.params;
  
  const field = await Asset.findById(fieldId);
  if (!field || field.type !== 'Land') {
    return res.status(404).json({ success: false, error: 'Tarla bulunamadı' });
  }

  // Extract coordinates from polygon or default to a central location if not available
  let lat = 39.92077; // Default Ankara
  let lon = 32.85411;

  if (field.polygon && field.polygon.coordinates && field.polygon.coordinates.length > 0) {
    // Polygon coordinates are [ [ [lon, lat], [lon, lat]... ] ]
    const coords = field.polygon.coordinates[0][0];
    if (coords && coords.length >= 2) {
      lon = coords[0];
      lat = coords[1];
    }
  }

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=auto`
    );
    
    if (!response.ok) {
      throw new Error('Hava durumu API hatası');
    }

    const data = await response.json();
    
    // Karar Destek Sistemi (Decision Support)
    const alerts = [];
    const today = data.daily;
    
    if (today) {
      const minTemp = today.temperature_2m_min[0];
      const maxWind = today.windspeed_10m_max[0];
      const precip = today.precipitation_sum[0];

      let frostThreshold = 3;
      const crop = (field.cropType || '').toLowerCase();
      if (['domates', 'biber', 'patlıcan', 'pamuk', 'karpuz', 'kavun'].some(c => crop.includes(c))) {
        frostThreshold = 5;
      } else if (['buğday', 'arpa', 'yulaf', 'çavdar', 'şeker pancarı'].some(c => crop.includes(c))) {
        frostThreshold = -2;
      } else if (['mısır', 'ayçiçeği', 'soya'].some(c => crop.includes(c))) {
        frostThreshold = 2;
      }

      if (minTemp <= frostThreshold) {
        alerts.push({ type: 'danger', message: `❄️ ${field.cropType || 'Mahsul'} için Don Tehlikesi! Gece sıcaklık ${minTemp}°C civarına düşecek (Kritik: ${frostThreshold}°C).` });
      }
      
      if (maxWind > 20) {
        alerts.push({ type: 'warning', message: '💨 Şiddetli Rüzgar! (' + maxWind + ' km/s) İlaçlama yapılması (sürüklenme riski nedeniyle) tavsiye edilmez.' });
      }

      if (precip > 5) {
        alerts.push({ type: 'info', message: `🌧️ Yağış Bekleniyor (${precip} mm). Yaprak gübresi veya ilaçlama yaparsanız yıkanma riski yüksektir, ertelemeniz önerilir.` });
      } else if (precip === 0 && data.current_weather.temperature > 30) {
        alerts.push({ type: 'warning', message: '☀️ Aşırı Sıcak ve Kuraklık Riski! Kritik gelişim evresindeyseniz sulama yapmanız bitki stresini azaltacaktır.' });
      }
    }

    res.json({
      success: true,
      data: {
        current: data.current_weather,
        daily: data.daily,
        alerts,
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: 'Hava durumu verisi alınamadı' });
  }
});
