import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { EmptyState } from '../components/KpiCard.jsx';
import MapPolygonSelector from '../components/MapPolygonSelector.jsx';

// A component to display weather data for a field
function FieldWeather({ fieldId }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadWeather = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/weather/${fieldId}`);
      setWeather(res.data.data);
    } catch (err) {
      setError('Hava durumu yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (!weather && !loading && !error) {
    return (
      <button onClick={loadWeather} className="text-sm text-blue-600 hover:underline">
        🌤️ Hava Durumunu Yükle
      </button>
    );
  }

  if (loading) return <span className="text-sm text-gray-500">Yükleniyor...</span>;
  if (error) return <span className="text-sm text-red-500">{error}</span>;

  return (
    <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-100">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-blue-900">Mevcut Sıcaklık: {weather.current.temperature}°C</span>
      </div>
      {weather.alerts && weather.alerts.length > 0 && (
        <div className="space-y-1 mt-2">
          {weather.alerts.map((alert, i) => (
            <div key={i} className={`text-xs p-2 rounded ${
              alert.type === 'danger' ? 'bg-red-100 text-red-800' :
              alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {alert.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Fields() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fieldName: '',
    cropType: '',
    areaDecare: '',
    location: '',
    notes: '',
    polygon: null,
  });
  const [error, setError] = useState('');

  const load = () => {
    api.get('/fields').then((res) => setFields(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/fields', { ...form, areaDecare: Number(form.areaDecare) });
      setForm({ fieldName: '', cropType: '', areaDecare: '', location: '', notes: '', polygon: null });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Kayıt başarısız');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tarla ve tüm sezon kayıtları silinecek. Emin misiniz?')) return;
    await api.delete(`/fields/${id}`);
    load();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button onClick={() => window.history.back()} className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-earth-500 hover:text-earth-900 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Geri Dön
          </button>
          <h1 className="text-2xl font-bold text-earth-900">Tarlalarım</h1>
          <p className="mt-1 text-earth-600">Tarla bilgilerinizi yönetin ve hava durumunu takip edin.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'İptal' : '+ Yeni Tarla'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-8">
          <h2 className="font-semibold text-earth-900">Yeni Tarla Ekle</h2>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Tarla Adı</label>
              <input className="input" value={form.fieldName} onChange={(e) => setForm({ ...form, fieldName: e.target.value })} required />
            </div>
            <div>
              <label className="label">Mahsul Türü</label>
              <input className="input" value={form.cropType} onChange={(e) => setForm({ ...form, cropType: e.target.value })} placeholder="Pamuk, Buğday..." required />
            </div>
            <div>
              <label className="label">Alan (dekar)</label>
              <input type="number" step="0.1" min="0.1" className="input" value={form.areaDecare} onChange={(e) => setForm({ ...form, areaDecare: e.target.value })} required />
            </div>
            <div>
              <label className="label">Konum (Metin)</label>
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Örn: Kuzey Parsel" />
            </div>
            
            <div className="sm:col-span-2">
              <label className="label mb-2">Harita Üzerinde İşaretle (Opsiyonel)</label>
              <p className="text-xs text-gray-500 mb-2">Tarlanızın sınırlarını haritada sağ üstteki poligon ikonuna tıklayarak çizebilirsiniz.</p>
              <MapPolygonSelector onPolygonChange={(geo) => setForm({ ...form, polygon: geo })} />
            </div>

            <div className="sm:col-span-2">
              <label className="label">Notlar</label>
              <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn-primary mt-4">Kaydet</button>
        </form>
      )}

      {fields.length === 0 ? (
        <EmptyState
          title="Henüz tarla eklenmemiş"
          description="İlk tarlanızı ekleyerek maliyet takibine başlayın."
          actionLabel="Tarla Ekle"
          actionTo="#"
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {fields.map((f) => (
            <div key={f._id} className="card flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-earth-900">{f.fieldName}</h3>
                  <p className="mt-1 text-sm text-earth-500">{f.location || 'Konum belirtilmedi'}</p>
                </div>
                <span className="badge bg-primary-100 text-primary-800">{f.cropType}</span>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-earth-500">Alan</p>
                  <p className="font-semibold">{f.areaDecare} dekar</p>
                </div>
                <div>
                  <p className="text-earth-500">Harita Verisi</p>
                  <p className="font-semibold">
                    {f.polygon && f.polygon.coordinates ? '✅ Çizildi' : '❌ Çizilmedi'}
                  </p>
                </div>
              </div>
              
              {f.notes && <p className="mt-3 text-sm text-earth-600">{f.notes}</p>}
              
              <div className="mt-auto pt-4">
                <FieldWeather fieldId={f._id} />
                
                <div className="mt-4 flex gap-2 border-t border-earth-100 pt-4">
                  <button onClick={() => handleDelete(f._id)} className="text-sm text-red-600 hover:text-red-700">
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
