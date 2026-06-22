import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { EmptyState } from '../components/KpiCard.jsx';

function formatCurrency(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0);
}

export default function Seasons() {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Import states
  const [importFile, setImportFile] = useState(null);
  const [importFieldId, setImportFieldId] = useState('');
  const [fields, setFields] = useState([]);
  const [importing, setImporting] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const load = () => {
    api.get('/seasons').then((res) => setSeasons(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get('/fields').then(res => {
      setFields(res.data.data);
      if (res.data.data.length > 0) setImportFieldId(res.data.data[0]._id);
    });
  }, []);



  const handleDelete = async (id) => {
    if (!confirm('Bu sezon kaydı silinecek. Emin misiniz?')) return;
    await api.delete(`/seasons/${id}`);
    load();
  };

  const handleImport = async () => {
    if (!importFile || !importFieldId) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);
    try {
      const res = await api.post(`/seasons/import/${importFieldId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.message);
      setImportFile(null);
      setShowImport(false);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Hata oluştu');
    } finally {
      setImporting(false);
    }
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
          <h1 className="text-2xl font-bold text-earth-900">Sezon Kayıtları</h1>
          <p className="mt-1 text-earth-600">Yıl ve dönem bazlı girdi maliyet kayıtları</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(!showImport)} className="btn-secondary">
            {showImport ? 'İptal' : 'Toplu Veri İçe Aktar'}
          </button>
          <Link to="/seasons/new" className="btn-primary">
            + Yeni Sezon Kaydı
          </Link>
        </div>
      </div>

      {showImport && (
        <div className="card mb-6 bg-earth-50 border border-earth-200">
          <h2 className="font-bold text-earth-900 mb-2">CSV / Excel'den İçe Aktar</h2>
          <p className="text-sm text-earth-600 mb-4">Girdi kalemleri "Yıl, Dönem, Tohum_Miktar, Tohum_Fiyat, Yakıt_Miktar, Yakıt_Fiyat" formatında olmalıdır.</p>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="label">Hedef Tarla</label>
              <select className="input" value={importFieldId} onChange={e => setImportFieldId(e.target.value)}>
                {fields.map(f => <option key={f._id} value={f._id}>{f.fieldName}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Dosya</label>
              <input type="file" accept=".csv" className="input bg-white" onChange={e => setImportFile(e.target.files[0])} />
            </div>
            <button onClick={handleImport} disabled={!importFile || importing} className="btn-primary">
              {importing ? 'Aktarılıyor...' : 'Yükle'}
            </button>
          </div>
        </div>
      )}

      {seasons.length === 0 ? (
        <EmptyState
          title="Henüz sezon kaydı yok"
          description="Tarla seçerek girdi maliyetlerinizi dönem bazında kaydedin."
          actionLabel="Sezon Kaydı Ekle"
          actionTo="/seasons/new"
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-earth-100 text-left text-earth-500">
                <th className="pb-3 pr-4">Sezon</th>
                <th className="pb-3 pr-4">Tarla</th>
                <th className="pb-3 pr-4">Mahsul</th>
                <th className="pb-3 pr-4">Girdi Sayısı</th>
                <th className="pb-3 pr-4 text-right">Toplam Maliyet</th>
                <th className="pb-3 pr-4 text-right">Dekar Başı</th>
                <th className="pb-3 pr-4 text-right">Karbon Ayizi</th>
                <th className="pb-3">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((s) => (
                <tr key={s._id} className="border-b border-earth-50 hover:bg-earth-50/50">
                  <td className="py-3 pr-4">
                    <span className="font-medium text-earth-900">{s.seasonLabel}</span>
                  </td>
                  <td className="py-3 pr-4">{s.fieldId?.fieldName}</td>
                  <td className="py-3 pr-4">{s.fieldId?.cropType}</td>
                  <td className="py-3 pr-4">{s.inputs?.length || 0}</td>
                  <td className="py-3 pr-4 text-right">{formatCurrency(s.totalCost)}</td>
                  <td className="py-3 pr-4 text-right font-semibold text-primary-700">
                    {formatCurrency(s.costPerDecare)}
                  </td>
                  <td className="py-3 pr-4 text-right text-earth-500">
                    {s.carbonFootprint > 0 ? (
                      <span className="text-xs bg-earth-100 px-2 py-1 rounded">
                        {s.carbonFootprint} kg CO₂e
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Link to={`/seasons/${s._id}/edit`} className="text-primary-600 hover:text-primary-700">
                        Düzenle
                      </Link>
                      <button onClick={() => handleDelete(s._id)} className="text-red-600 hover:text-red-700">
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
