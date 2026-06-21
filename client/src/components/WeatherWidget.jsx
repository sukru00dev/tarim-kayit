import { useEffect, useState } from 'react';

const WEATHER_CODE_MAP = {
  0: { label: 'Açık', icon: '☀️' },
  1: { label: 'Çoğunlukla Açık', icon: '🌤️' },
  2: { label: 'Parçalı Bulutlu', icon: '⛅' },
  3: { label: 'Kapalı', icon: '☁️' },
  45: { label: 'Sisli', icon: '🌫️' },
  48: { label: 'Puslu', icon: '🌫️' },
  51: { label: 'Hafif Çisenti', icon: '🌦️' },
  53: { label: 'Orta Çisenti', icon: '🌧️' },
  55: { label: 'Yoğun Çisenti', icon: '🌧️' },
  61: { label: 'Hafif Yağmur', icon: '🌦️' },
  63: { label: 'Orta Yağmur', icon: '🌧️' },
  65: { label: 'Şiddetli Yağmur', icon: '⛈️' },
  71: { label: 'Hafif Kar', icon: '🌨️' },
  73: { label: 'Orta Kar', icon: '❄️' },
  75: { label: 'Yoğun Kar', icon: '❄️' },
  95: { label: 'Gök Gürültülü Fırtına', icon: '🌩️' },
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  // Varsayılan: Şanlıurfa koordinatları
  const lat = 37.1583;
  const lon = 38.7939;

  useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`)
      .then(res => res.json())
      .then(data => {
        setWeather(data);
      })
      .catch(err => console.error('Hava durumu yüklenemedi', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="card h-48 animate-pulse bg-earth-100 flex items-center justify-center">Hava Durumu Yükleniyor...</div>;
  }

  if (!weather) {
    return null;
  }

  const current = weather.current;
  const daily = weather.daily;
  const todayCode = current.weather_code;
  const condition = WEATHER_CODE_MAP[todayCode] || { label: 'Bilinmiyor', icon: '🌡️' };

  let advice = "Hava tarımsal faaliyetler için uygun görünüyor.";
  if ([61, 63, 65, 95].includes(todayCode)) advice = "⚠️ Yağış bekleniyor. İlaçlama yapmaktan kaçının.";
  if (current.temperature_2m > 35) advice = "⚠️ Aşırı sıcaklık. Sulama işlemlerini sabah erken veya akşam geç saatlerde yapın.";
  if (current.wind_speed_10m > 25) advice = "⚠️ Rüzgar şiddetli. İlaçlama sırasında sürüklenmeye (drift) dikkat edin.";

  return (
    <div className="card bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="font-bold text-blue-900 flex items-center gap-2">
            <span>📍</span> Şanlıurfa Hava Durumu
          </h2>
          <p className="text-xs text-blue-700 mt-1">Canlı Meteoroloji Verisi</p>
        </div>
        <div className="text-right">
          <div className="text-4xl">{condition.icon}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-blue-600 font-medium">Sıcaklık</p>
          <p className="text-2xl font-bold text-blue-900">{current.temperature_2m}°C</p>
          <p className="text-xs text-blue-700">{condition.label}</p>
        </div>
        <div>
          <p className="text-xs text-blue-600 font-medium">Nem</p>
          <p className="text-lg font-bold text-blue-900">{current.relative_humidity_2m}%</p>
        </div>
        <div>
          <p className="text-xs text-blue-600 font-medium">Rüzgar</p>
          <p className="text-lg font-bold text-blue-900">{current.wind_speed_10m} km/s</p>
        </div>
      </div>

      <div className="rounded bg-blue-600/10 p-3 mb-4 text-sm font-medium text-blue-800">
        {advice}
      </div>

      <div className="border-t border-blue-200/50 pt-3">
        <p className="text-xs font-semibold text-blue-800 mb-2">Önümüzdeki 3 Gün</p>
        <div className="flex justify-between">
          {[1, 2, 3].map(i => {
            const date = new Date(daily.time[i]);
            const dayName = date.toLocaleDateString('tr-TR', { weekday: 'short' });
            const wCode = daily.weather_code[i];
            const icon = WEATHER_CODE_MAP[wCode]?.icon || '🌡️';
            
            return (
              <div key={i} className="text-center">
                <p className="text-xs text-blue-700">{dayName}</p>
                <p className="text-lg my-1">{icon}</p>
                <p className="text-xs font-bold text-blue-900">{Math.round(daily.temperature_2m_max[i])}° / {Math.round(daily.temperature_2m_min[i])}°</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
