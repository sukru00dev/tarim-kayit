import { useState, useEffect } from 'react';
import api from '../api/client.js';

export default function SoilAnalysis() {
  const [analyses, setAnalyses] = useState([]);
  const [fields, setFields] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fieldId: '',
    analysisDate: new Date().toISOString().split('T')[0],
    phLevel: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    organicMatter: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      const [analysisRes, fieldsRes] = await Promise.all([
        api.get('/soils'),
        api.get('/fields')
      ]);
      setAnalyses(analysisRes.data.data);
      setFields(fieldsRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/soils', form);
      setForm({
        fieldId: '',
        analysisDate: new Date().toISOString().split('T')[0],
        phLevel: '',
        nitrogen: '',
        phosphorus: '',
        potassium: '',
        organicMatter: '',
        notes: '',
      });
      setShowForm(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Hata oluştu');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Emin misiniz?')) {
      try {
        await api.delete(`/soils/${id}`);
        loadData();
      } catch (err) {
        alert(err.response?.data?.error || 'Hata oluştu');
      }
    }
  };

  const getRecommendations = (a) => {
    const recs = [];
    if (a.phLevel < 6.5) recs.push('Düşük pH, kireçleme önerilir.');
    if (a.phLevel > 7.5) recs.push('Yüksek pH, kükürt önerilir.');
    if (a.nitrogen && a.nitrogen < 15) recs.push('Düşük Azot, sentetik gübreleme önerilir.');
    if (a.phosphorus && a.phosphorus < 10) recs.push('Düşük Fosfor, DAP/TSP gübresi önerisi.');
    if (a.potassium && a.potassium < 10) recs.push('Düşük Potasyum, sülfat-potas önerisi.');
    if (a.organicMatter && a.organicMatter < 2.0) recs.push('Düşük organik madde, kompost/ahır gübresi önerilir.');
    return recs.length > 0 ? recs.join(' ') : 'İdeal Değerler';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">Toprak Analizi (Toprak ve Verim)</h1>
          <p className="mt-1 text-earth-600">
            Tarlalarınızın toprak sağlığını ölçün, akademiye destek olun ve verim artışını gözlemleyin.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'İptal' : '+ Yeni Analiz Ekle'}
        </button>
      </div>

      {showForm && (
        <div className="card border-primary-200 bg-primary-50">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-earth-700">Tarla *</label>
              <select className="input" value={form.fieldId} onChange={(e) => setForm({ ...form, fieldId: e.target.value })} required>
                <option value="">Tarla Seçin</option>
                {fields.map((f) => (
                  <option key={f._id} value={f._id}>{f.fieldName} ({f.cropType})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-earth-700">Tarih *</label>
              <input type="date" className="input" value={form.analysisDate} onChange={(e) => setForm({ ...form, analysisDate: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-earth-700">pH Değeri *</label>
              <input type="number" step="0.1" max="14" className="input" value={form.phLevel} onChange={(e) => setForm({ ...form, phLevel: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-earth-700">Azot (N) ppm</label>
              <input type="number" step="0.1" className="input" value={form.nitrogen} onChange={(e) => setForm({ ...form, nitrogen: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-earth-700">Fosfor (P) ppm</label>
              <input type="number" step="0.1" className="input" value={form.phosphorus} onChange={(e) => setForm({ ...form, phosphorus: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-earth-700">Potasyum (K) ppm</label>
              <input type="number" step="0.1" className="input" value={form.potassium} onChange={(e) => setForm({ ...form, potassium: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-earth-700">Organik Madde (%)</label>
              <input type="number" step="0.1" max="100" className="input" value={form.organicMatter} onChange={(e) => setForm({ ...form, organicMatter: e.target.value })} />
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="mb-1 block text-sm font-medium text-earth-700">Notlar</label>
              <input type="text" className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Laboratuvar sonuç no vs." />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <button type="submit" className="btn-primary w-full sm:w-auto">Kaydet</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {analyses.length === 0 ? (
          <p className="py-4 text-center text-earth-500">Henüz toprak analizi kaydınız bulunmuyor.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-earth-700">
              <thead className="border-b border-earth-200 text-earth-900">
                <tr>
                  <th className="pb-3 pr-4">Tarla</th>
                  <th className="pb-3 pr-4">Tarih</th>
                  <th className="pb-3 pr-4">pH</th>
                  <th className="pb-3 pr-4">N-P-K</th>
                  <th className="pb-3 pr-4">Organik Madde</th>
                  <th className="pb-3 pr-4">Öneriler / Uyarılar</th>
                  <th className="pb-3 pr-4">Notlar</th>
                  <th className="pb-3">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((a) => (
                  <tr key={a._id} className="border-b border-earth-50 hover:bg-earth-50/50">
                    <td className="py-3 pr-4 font-medium text-earth-900">{a.fieldId?.fieldName}</td>
                    <td className="py-3 pr-4">{new Date(a.analysisDate).toLocaleDateString('tr-TR')}</td>
                    <td className="py-3 pr-4 text-primary-700 font-semibold">{a.phLevel}</td>
                    <td className="py-3 pr-4">
                      {a.nitrogen || '-'} / {a.phosphorus || '-'} / {a.potassium || '-'}
                    </td>
                    <td className="py-3 pr-4">{a.organicMatter ? `${a.organicMatter}%` : '-'}</td>
                    <td className="py-3 pr-4 text-sm text-yellow-700 font-medium max-w-[200px]">
                      {getRecommendations(a)}
                    </td>
                    <td className="py-3 pr-4 text-xs text-earth-500 truncate max-w-[150px]">{a.notes}</td>
                    <td className="py-3">
                      <button onClick={() => handleDelete(a._id)} className="text-red-500 hover:text-red-700 transition">Sil</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
