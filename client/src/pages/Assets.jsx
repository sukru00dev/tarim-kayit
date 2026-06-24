import { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    assetName: '',
    purchasePrice: '',
    purchaseYear: new Date().getFullYear(),
    usefulLifeYears: 10,
    salvageValue: 0,
    notes: '',
  });

  const fetchAssets = async () => {
    try {
      const { data } = await apiClient.get('/assets');
      setAssets(data.data);
    } catch (err) {
      setError('Demirbaşlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'assetName' || name === 'notes' ? value : Number(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/assets', {
        name: formData.assetName,
        type: 'Equipment',
        purchasePrice: formData.purchasePrice,
        purchaseYear: formData.purchaseYear,
        usefulLifeYears: formData.usefulLifeYears,
        salvageValue: formData.salvageValue,
        notes: formData.notes
      });
      setShowForm(false);
      setFormData({
        assetName: '',
        purchasePrice: '',
        purchaseYear: new Date().getFullYear(),
        usefulLifeYears: 10,
        salvageValue: 0,
        notes: '',
      });
      fetchAssets();
    } catch (err) {
      alert(err.response?.data?.error || 'Demirbaş eklenemedi');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu demirbaşı silmek istediğinize emin misiniz?')) {
      try {
        await apiClient.delete(`/assets/${id}`);
        fetchAssets();
      } catch (err) {
        alert('Silme işlemi başarısız oldu');
      }
    }
  };

  if (loading) return <div className="p-4">Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">Demirbaş ve Varlıklarım</h1>
          <p className="text-sm text-earth-500">Traktör, sulama sistemi vb. yatırımlarınızın amortisman (yıpranma) takibi</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'İptal Et' : '+ Yeni Demirbaş Ekle'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card bg-earth-50">
          <h2 className="mb-4 text-lg font-bold text-earth-800">Demirbaş Ekle</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label">Varlık Adı (Örn: Traktör)</label>
              <input type="text" name="assetName" value={formData.assetName} onChange={handleChange} className="input" required />
            </div>
            <div>
              <label className="label">Alış Fiyatı (TL)</label>
              <input type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} className="input" required min="0" />
            </div>
            <div>
              <label className="label">Alış Yılı</label>
              <input type="number" name="purchaseYear" value={formData.purchaseYear} onChange={handleChange} className="input" required min="1950" />
            </div>
            <div>
              <label className="label">Faydalı Ömür (Yıl)</label>
              <input type="number" name="usefulLifeYears" value={formData.usefulLifeYears} onChange={handleChange} className="input" required min="1" />
            </div>
            <div>
              <label className="label">Hurda/Satış Değeri (TL) - İsteğe Bağlı</label>
              <input type="number" name="salvageValue" value={formData.salvageValue} onChange={handleChange} className="input" min="0" />
            </div>
            <div>
              <label className="label">Notlar</label>
              <input type="text" name="notes" value={formData.notes} onChange={handleChange} className="input" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" className="btn-primary">Kaydet</button>
          </div>
        </form>
      )}

      {error && <div className="rounded-md bg-red-50 p-4 text-red-700">{error}</div>}

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-earth-600">
            <thead className="bg-earth-50 text-xs uppercase text-earth-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Varlık Adı</th>
                <th className="px-6 py-4 font-semibold">Alış Fiyatı</th>
                <th className="px-6 py-4 font-semibold">Yıl / Ömür</th>
                <th className="px-6 py-4 font-semibold text-primary-700">Yıllık Amortisman Gideri</th>
                <th className="px-6 py-4 font-semibold text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-100">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-earth-500">
                    Henüz kayıtlı demirbaşınız bulunmuyor.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-earth-50/50">
                    <td className="px-6 py-4 font-medium text-earth-900">{asset.assetName || asset.name}</td>
                    <td className="px-6 py-4">{(asset.purchasePrice || 0).toLocaleString('tr-TR')} ₺</td>
                    <td className="px-6 py-4">{asset.purchaseYear} <span className="text-earth-400">({asset.usefulLifeYears} Yıl)</span></td>
                    <td className="px-6 py-4 font-bold text-primary-700">
                      {(asset.annualDepreciation || 0).toLocaleString('tr-TR')} ₺
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(asset.id)} className="text-red-500 hover:text-red-700">Sil</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
