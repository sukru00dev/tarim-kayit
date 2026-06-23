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

  // E-Fatura State
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);

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

  const createInvoice = async (season) => {
    setInvoiceLoading(true);
    setSelectedSeason(season);
    try {
      // Backend api/gov/hks/invoice uç noktası lotNumber, quantity ve unitPrice bekler.
      // Sezon'dan simüle ediyoruz.
      const payload = {
        lotNumber: `LOT-${season.year}-${season.seasonPeriod.substring(0, 3).toUpperCase()}`,
        quantityKg: season.harvestQuantity,
        unitPriceTry: season.unitSalePrice
      };
      const res = await api.post('/gov/hks/invoice', payload);
      setGeneratedInvoice(res.data.data);
      setShowInvoiceModal(true);
    } catch (error) {
      alert(error.response?.data?.error || 'E-Fatura oluşturulurken hata oluştu.');
    } finally {
      setInvoiceLoading(false);
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
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">Gelir, Hasat ve E-Fatura</h1>
          <p className="mt-1 text-earth-600">Sezon hasatlarınızı girin, net karınızı görün ve Hal Kayıt Sistemine E-Müstahsil Makbuzu kesin.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold shadow-md">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> GİB Entegrasyonu Aktif
        </div>
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-3">
        <div className="card border-l-4 border-l-green-500 shadow-sm">
          <p className="text-sm font-medium text-earth-500">Toplam Elde Edilen Gelir</p>
          <p className="mt-2 text-3xl font-black text-green-700">{formatCurrency(totalIncome)}</p>
        </div>
        <div className={`card border-l-4 shadow-sm ${totalProfit >= 0 ? 'border-l-primary-500' : 'border-l-red-500'}`}>
          <p className="text-sm font-medium text-earth-500">Toplam Net Kar/Zarar</p>
          <p className={`mt-2 text-3xl font-black ${totalProfit >= 0 ? 'text-primary-700' : 'text-red-700'}`}>
            {formatCurrency(totalProfit)}
          </p>
        </div>
        <div className="card border-l-4 border-l-yellow-500 shadow-sm">
          <p className="text-sm font-medium text-earth-500">Hasat Bekleyen Sezon</p>
          <p className="mt-2 text-3xl font-black text-yellow-700">{pendingHarvests} Adet</p>
        </div>
      </div>

      <div className="card shadow-sm border border-earth-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-earth-200 text-left text-earth-500 bg-earth-50">
                <th className="py-4 pl-4 pr-4 font-semibold rounded-tl-lg">Sezon Bilgisi</th>
                <th className="py-4 pr-4 font-semibold">Tohum/Mahsul</th>
                <th className="py-4 pr-4 font-semibold text-right">Maliyet</th>
                <th className="py-4 pr-4 font-semibold text-right">Hasat</th>
                <th className="py-4 pr-4 font-semibold text-right">Birim Fiyat</th>
                <th className="py-4 pr-4 font-semibold text-right">Net Kar</th>
                <th className="py-4 pl-4 pr-4 font-semibold text-center rounded-tr-lg">İşlem & E-Fatura</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((season) => {
                const hasHarvest = season.harvestQuantity > 0;
                const isProfitable = season.netProfit >= 0;
                
                return (
                  <tr key={season._id} className="border-b border-earth-50 hover:bg-earth-50/50 transition group">
                    <td className="py-4 pl-4 pr-4">
                      <p className="font-bold text-earth-900">{season.seasonLabel}</p>
                      <p className="text-xs text-earth-500">{season.fieldId?.fieldName}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="badge bg-earth-100 text-earth-800 font-bold px-3 py-1">{season.fieldId?.cropType}</span>
                    </td>
                    <td className="py-4 pr-4 text-right text-earth-600 font-medium">
                      {formatCurrency(season.totalCost)}
                    </td>
                    <td className="py-4 pr-4 text-right">
                      {hasHarvest ? (
                        <span className="font-bold text-green-700 bg-green-50 px-2 py-1 rounded">{season.harvestQuantity} kg</span>
                      ) : (
                        <span className="text-earth-400 italic">Girmedi</span>
                      )}
                    </td>
                    <td className="py-4 pr-4 text-right text-earth-600 font-medium">
                      {hasHarvest ? formatCurrency(season.unitSalePrice) : '-'}
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <span className={`font-black text-base ${isProfitable ? 'text-primary-600' : 'text-red-600'}`}>
                        {formatCurrency(season.netProfit || -season.totalCost)}
                      </span>
                    </td>
                    <td className="py-4 pl-4 pr-4 flex justify-center gap-2 items-center">
                      <button 
                        onClick={() => openModal(season)}
                        className={`text-xs font-bold px-3 py-2 rounded-lg transition-all shadow-sm ${
                          hasHarvest 
                            ? 'bg-earth-100 text-earth-700 hover:bg-earth-200' 
                            : 'bg-green-600 text-white hover:bg-green-700 shadow-green-200'
                        }`}
                      >
                        {hasHarvest ? 'Düzenle' : 'Hasat Gir'}
                      </button>

                      {hasHarvest && (
                        <button 
                          onClick={() => createInvoice(season)}
                          disabled={invoiceLoading}
                          className="text-xs font-bold px-3 py-2 rounded-lg transition-all shadow-sm bg-slate-800 text-white hover:bg-slate-900 flex items-center gap-1"
                        >
                          E-Müstahsil Kes
                        </button>
                      )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Hasat Bilgisi Gir</h3>
            <p className="text-sm text-slate-500 mb-6">
              <strong className="text-slate-700">{selectedSeason?.fieldId?.fieldName}</strong> tarlasının {selectedSeason?.seasonLabel} sezonu için satış verilerini ekleyin.
            </p>
            
            <form onSubmit={saveHarvest} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Hasat Miktarı (kg)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    required 
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all pr-12 text-lg font-bold"
                    placeholder="Örn: 5000"
                    value={harvestForm.harvestQuantity}
                    onChange={(e) => setHarvestForm({ ...harvestForm, harvestQuantity: e.target.value })}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">KG</span>
                </div>
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Birim Satış Fiyatı (₺/kg)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400 font-bold">₺</span>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all pl-10 text-lg font-bold"
                    placeholder="Örn: 24.50"
                    value={harvestForm.unitSalePrice}
                    onChange={(e) => setHarvestForm({ ...harvestForm, unitSalePrice: e.target.value })}
                  />
                </div>
              </div>

              {/* Tahmini Önizleme */}
              {(harvestForm.harvestQuantity && harvestForm.unitSalePrice) ? (
                <div className="rounded-xl bg-green-50 p-4 mt-2 border border-green-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-green-800">Tahmini Toplam Gelir:</span>
                    <strong className="text-xl font-black text-green-700">
                      {formatCurrency(Number(harvestForm.harvestQuantity) * Number(harvestForm.unitSalePrice))}
                    </strong>
                  </div>
                </div>
              ) : null}

              <div className="mt-8 flex gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="w-1/2 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-1/2 py-3 px-4 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 transition-all disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* E-Fatura (Müstahsil Makbuzu) Modalı */}
      {showInvoiceModal && generatedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Fatura Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <span className="text-2xl">🧾</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">e-Müstahsil Makbuzu</h3>
                  <p className="text-xs text-slate-400 font-medium">Gelir İdaresi Başkanlığı GİB Onaylı</p>
                </div>
              </div>
              <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* Fatura Body */}
            <div className="p-6 bg-[#fcfcfc]">
              
              <div className="flex justify-between items-end mb-6 pb-6 border-b border-dashed border-slate-300">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Makbuz No</p>
                  <p className="font-mono font-bold text-slate-800">{generatedInvoice.invoiceNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Tarih</p>
                  <p className="font-medium text-slate-800">{new Date(generatedInvoice.date).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Ürün (Lot No):</span>
                  <span className="font-bold text-slate-900">{generatedInvoice.lotNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Miktar:</span>
                  <span className="font-bold text-slate-900">{generatedInvoice.quantityKg} KG</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Birim Fiyat:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(generatedInvoice.unitPriceTry)}</span>
                </div>
              </div>

              <div className="bg-slate-100 rounded-xl p-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600 font-bold">Brüt Tutar:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(generatedInvoice.grossTotalTry)}</span>
                </div>
                <div className="flex justify-between mb-2 pb-2 border-b border-slate-200">
                  <span className="text-red-600 font-bold text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                    Stopaj Kesintisi (%2):
                  </span>
                  <span className="font-bold text-red-600 text-sm">-{formatCurrency(generatedInvoice.taxDeductionTry)}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-800 font-black uppercase tracking-wide">Net Ödenecek:</span>
                  <span className="font-black text-2xl text-green-600">{formatCurrency(generatedInvoice.netTotalTry)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowInvoiceModal(false)}
                  className="w-full py-3 px-4 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Kapat
                </button>
                <button 
                  className="w-full py-3 px-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Yazdır / İndir
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
