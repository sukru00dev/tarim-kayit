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
  const [showCksModal, setShowCksModal] = useState(false);
  const [cksLoading, setCksLoading] = useState(false);
  const [tcKimlik, setTcKimlik] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    fieldName: '',
    cropType: '',
    areaDecare: '',
    location: '',
    notes: '',
    polygon: null,
  });
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const load = () => {
    api.get('/fields').then((res) => setFields(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/fields/${editingId}`, { ...form, areaDecare: Number(form.areaDecare) });
      } else {
        await api.post('/fields', { ...form, areaDecare: Number(form.areaDecare) });
      }
      setForm({ fieldName: '', cropType: '', areaDecare: '', location: '', notes: '', polygon: null });
      setEditingId(null);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Kayıt başarısız');
    }
  };

  const handleEdit = (field) => {
    setEditingId(field._id);
    setForm({
      fieldName: field.fieldName || '',
      cropType: field.cropType || '',
      areaDecare: field.areaDecare || '',
      location: field.location || '',
      notes: field.notes || '',
      polygon: field.polygon || null,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ fieldName: '', cropType: '', areaDecare: '', location: '', notes: '', polygon: null });
  };

  const handleCksSync = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setCksLoading(true);
    try {
      const res = await api.post('/gov/cks/sync', { tcIdentity: tcKimlik });
      setSuccessMsg(res.data.message);
      setTcKimlik('');
      setTimeout(() => {
        setShowCksModal(false);
        setSuccessMsg('');
        load();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'ÇKS bağlantısı başarısız oldu.');
    } finally {
      setCksLoading(false);
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
          <p className="mt-1 text-earth-600">Tarla bilgilerinizi yönetin, haritada çizin ve e-Devlet ile senkronize edin.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => setShowCksModal(true)} className="btn-secondary flex items-center justify-center gap-2 border-green-600 text-green-700 hover:bg-green-50">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            ÇKS'den Aktar
          </button>
          <button onClick={() => !showForm && setShowForm(true)} className="btn-primary">
            + Yeni Tarla
          </button>
        </div>
      </div>

      {/* ÇKS Modal */}
      {showCksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-xl">🇹🇷</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">e-Devlet ÇKS Bağlantısı</h3>
                    <p className="text-xs text-gray-500 font-medium">Tarım ve Orman Bakanlığı</p>
                  </div>
                </div>
                <button onClick={() => setShowCksModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <form onSubmit={handleCksSync}>
                <p className="text-sm text-gray-600 mb-4">
                  T.C. Kimlik numaranızı girerek Çiftçi Kayıt Sisteminde (ÇKS) kayıtlı olan tarlalarınızı tek tuşla aktarabilirsiniz.
                </p>
                
                {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-100">{error}</div>}
                {successMsg && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-100 flex items-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>{successMsg}</div>}
                
                <div className="mb-5">
                  <label className="block text-sm font-bold text-gray-700 mb-1">T.C. Kimlik Numarası</label>
                  <input 
                    type="text" 
                    maxLength="11"
                    pattern="\d{11}"
                    placeholder="11 Haneli TCKN"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-mono text-lg tracking-widest text-center"
                    value={tcKimlik}
                    onChange={(e) => setTcKimlik(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={cksLoading || tcKimlik.length !== 11}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cksLoading ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Bağlanıyor...</>
                  ) : (
                    <>Tarlalarımı Çek</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-8 border-t-4 border-t-primary-500 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg text-earth-900">{editingId ? 'Tarlayı Düzenle' : 'Yeni Tarla Ekle'}</h2>
            <button type="button" onClick={handleCancelForm} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          {error && <p className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
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
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Örn: Kuzey Parsel, Antalya" />
            </div>
            
            <div className="sm:col-span-2">
              <label className="label mb-1">Harita Üzerinde Çizim (CBS)</label>
              <p className="text-xs text-earth-500 mb-3">Tarlanızın sınırlarını sağ üstteki poligon ikonuna (⬟) tıklayarak haritada çizin. Bu sayede hava durumu tam o noktaya göre çekilecektir.</p>
              <MapPolygonSelector onPolygonChange={(geo) => setForm({ ...form, polygon: geo })} />
            </div>

            <div className="sm:col-span-2">
              <label className="label">Notlar</label>
              <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={handleCancelForm} className="btn-secondary">İptal</button>
            <button type="submit" className="btn-primary">{editingId ? 'Güncelle' : 'Kaydet'}</button>
          </div>
        </form>
      )}

      {fields.length === 0 ? (
        <EmptyState
          title="Henüz tarla eklenmemiş"
          description="E-Devlet üzerinden ÇKS tarlalarınızı aktarabilir veya elle ekleyebilirsiniz."
          actionLabel="ÇKS ile Aktar"
          actionTo="#"
          onClick={() => setShowCksModal(true)}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {fields.map((f) => (
            <div key={f._id} className={`card flex flex-col hover:shadow-xl transition-shadow border-t-4 ${editingId === f._id ? 'border-t-blue-500 ring-2 ring-blue-100' : 'border-t-primary-500'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-earth-900">{f.fieldName}</h3>
                  <p className="mt-1 text-sm text-earth-500 flex items-center gap-1">
                    <svg className="w-4 h-4 text-earth-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {f.location || 'Konum belirtilmedi'}
                  </p>
                </div>
                <span className="badge bg-primary-100 text-primary-800 font-bold px-3 py-1 shadow-sm">{f.cropType}</span>
              </div>
              
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="flex flex-col">
                  <span className="text-xs text-earth-500 uppercase tracking-wider font-bold mb-1">Büyüklük</span>
                  <span className="font-black text-lg text-gray-800">{f.areaDecare} <span className="text-sm font-medium text-gray-500">dekar</span></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-earth-500 uppercase tracking-wider font-bold mb-1">Harita (CBS)</span>
                  <span className={`font-bold ${f.polygon && f.polygon.coordinates ? 'text-green-600' : 'text-amber-500'}`}>
                    {f.polygon && f.polygon.coordinates ? '✓ Çizildi' : '⚠ Çizilmedi'}
                  </span>
                </div>
              </div>
              
              {f.notes && <p className="mt-4 text-sm text-earth-600 italic border-l-2 border-earth-300 pl-2">"{f.notes}"</p>}
              
              <div className="mt-auto pt-5">
                <FieldWeather fieldId={f._id} />
                
                <div className="mt-4 flex gap-2 border-t border-earth-100 pt-4 justify-end">
                  <button onClick={() => handleEdit(f)} className="text-sm text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Düzenle
                  </button>
                  <button onClick={() => handleDelete(f._id)} className="text-sm text-red-600 hover:text-red-700 font-bold flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
