import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { EmptyState } from '../components/KpiCard.jsx';

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
      setForm({ fieldName: '', cropType: '', areaDecare: '', location: '', notes: '' });
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">Tarlalarım</h1>
          <p className="mt-1 text-earth-600">Tarla bilgilerinizi yönetin</p>
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
              <label className="label">Konum</label>
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
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
            <div key={f._id} className="card">
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
                  <p className="text-earth-500">Mahsul</p>
                  <p className="font-semibold">{f.cropType}</p>
                </div>
              </div>
              {f.notes && <p className="mt-3 text-sm text-earth-600">{f.notes}</p>}
              <div className="mt-4 flex gap-2 border-t border-earth-100 pt-4">
                <button onClick={() => handleDelete(f._id)} className="text-sm text-red-600 hover:text-red-700">
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
