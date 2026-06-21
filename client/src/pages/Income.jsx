import { useEffect, useState } from 'react';
import api from '../api/client.js';

function formatCurrency(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0);
}

export default function Income() {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [harvestForm, setHarvestForm] = useState({ harvestQuantity: '', unitSalePrice: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSeasons();
  }, []);

  const loadSeasons = async () => {
    try {
      const res = await api.get('/seasons');
      setSeasons(res.data.data);
    } catch (error) {
      console.error('Sezonlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (season) => {
    setSelectedSeason(season);
    setHarvestForm({
      harvestQuantity: season.harvestQuantity || '',
      unitSalePrice: season.unitSalePrice || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSeason(null);
  };

  const saveHarvest = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/seasons/${selectedSeason._id}`, {
        harvestQuantity: Number(harvestForm.harvestQuantity),
        unitSalePrice: Number(harvestForm.unitSalePrice),
      });
      await loadSeasons();
      closeModal();
    } catch (error) {
      alert('Kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  // Summary Cards
  const totalIncome = seasons.reduce((sum, s) => sum + (s.totalIncome || 0), 0);
  const totalProfit = seasons.reduce((sum, s) => sum + (s.netProfit || -s.totalCost), 0);
  const pendingHarvests = seasons.filter(s => !s.harvestQuantity).length;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">Gelir ve Hasat</h1>
          <p className="mt-1 text-earth-600">Sezon hasatlarınızı girin ve net karınızı görün</p>
        </div>
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-3">
        <div className="card border-l-4 border-l-green-500">
          <p className="text-sm font-medium text-earth-500">Toplam Elde Edilen Gelir</p>
          <p className="mt-2 text-2xl font-bold text-green-700">{formatCurrency(totalIncome)}</p>
        </div>
        <div className={`card border-l-4 ${totalProfit >= 0 ? 'border-l-primary-500' : 'border-l-red-500'}`}>
          <p className="text-sm font-medium text-earth-500">Toplam Net Kar/Zarar</p>
          <p className={`mt-2 text-2xl font-bold ${totalProfit >= 0 ? 'text-primary-700' : 'text-red-700'}`}>
            {formatCurrency(totalProfit)}
          </p>
        </div>
        <div className="card border-l-4 border-l-yellow-500">
          <p className="text-sm font-medium text-earth-500">Hasat Bekleyen Sezon</p>
          <p className="mt-2 text-2xl font-bold text-yellow-700">{pendingHarvests} Adet</p>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-earth-200 text-left text-earth-500">
                <th className="pb-3 pr-4 font-semibold">Sezon Bilgisi</th>
                <th className="pb-3 pr-4 font-semibold">Tohum/Mahsul</th>
                <th className="pb-3 pr-4 font-semibold text-right">Toplam Maliyet</th>
                <th className="pb-3 pr-4 font-semibold text-right">Hasat Edilen</th>
                <th className="pb-3 pr-4 font-semibold text-right">Birim Fiyat</th>
                <th className="pb-3 pr-4 font-semibold text-right">Net Kar</th>
                <th className="pb-3 pl-4 font-semibold text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((season) => {
                const hasHarvest = season.harvestQuantity > 0;
                const isProfitable = season.netProfit >= 0;
                
                return (
                  <tr key={season._id} className="border-b border-earth-50 hover:bg-earth-50/50 transition">
                    <td className="py-4 pr-4">
                      <p className="font-medium text-earth-900">{season.seasonLabel}</p>
                      <p className="text-xs text-earth-500">{season.fieldId?.fieldName}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="badge bg-earth-100 text-earth-700">{season.fieldId?.cropType}</span>
                    </td>
                    <td className="py-4 pr-4 text-right text-earth-600 font-medium">
                      {formatCurrency(season.totalCost)}
                    </td>
                    <td className="py-4 pr-4 text-right">
                      {hasHarvest ? (
                        <span className="font-medium text-green-700">{season.harvestQuantity} kg</span>
                      ) : (
                        <span className="text-earth-400 italic">Girmedi</span>
                      )}
                    </td>
                    <td className="py-4 pr-4 text-right text-earth-600">
                      {hasHarvest ? formatCurrency(season.unitSalePrice) : '-'}
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <span className={`font-bold ${isProfitable ? 'text-primary-600' : 'text-red-600'}`}>
                        {formatCurrency(season.netProfit || -season.totalCost)}
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <button 
                        onClick={() => openModal(season)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                          hasHarvest 
                            ? 'bg-earth-100 text-earth-700 hover:bg-earth-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {hasHarvest ? 'Güncelle' : 'Hasat Gir'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {seasons.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-earth-500">
                    Henüz hiç sezon kaydınız bulunmuyor. Önce tarlanıza bir sezon eklemelisiniz.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hasat Modalı */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-earth-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-earth-900 mb-1">Hasat Bilgisi Gir</h3>
            <p className="text-sm text-earth-500 mb-6">
              {selectedSeason?.fieldId?.fieldName} tarlasının {selectedSeason?.seasonLabel} sezonu için satış verilerini ekleyin.
            </p>
            
            <form onSubmit={saveHarvest} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-earth-700">Hasat Miktarı (kg)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    required 
                    min="0"
                    step="0.01"
                    className="input pr-12"
                    placeholder="Örn: 5000"
                    value={harvestForm.harvestQuantity}
                    onChange={(e) => setHarvestForm({ ...harvestForm, harvestQuantity: e.target.value })}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-earth-400 font-medium">kg</span>
                </div>
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-earth-700">Birim Satış Fiyatı (₺/kg)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-earth-400 font-medium">₺</span>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    step="0.01"
                    className="input pl-8"
                    placeholder="Örn: 24.50"
                    value={harvestForm.unitSalePrice}
                    onChange={(e) => setHarvestForm({ ...harvestForm, unitSalePrice: e.target.value })}
                  />
                </div>
              </div>

              {/* Tahmini Önizleme */}
              {(harvestForm.harvestQuantity && harvestForm.unitSalePrice) ? (
                <div className="rounded-lg bg-green-50 p-4 mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-green-700">Tahmini Toplam Gelir:</span>
                    <strong className="text-green-800">
                      {formatCurrency(Number(harvestForm.harvestQuantity) * Number(harvestForm.unitSalePrice))}
                    </strong>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="btn-secondary flex-1"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="btn-primary flex-1 bg-green-600 hover:bg-green-700"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
