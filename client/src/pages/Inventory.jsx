import { useEffect, useState } from 'react';
import api from '../api/client.js';

function formatCurrency(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0);
}

const CATEGORIES = ['Tohum', 'Gübre', 'Yakıt', 'İlaç', 'İşçilik', 'Diğer'];
const UNITS = ['kg', 'litre', 'adet', 'ton', 'çuval', 'paket'];

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    _id: '', itemName: '', category: 'Gübre', unit: 'kg', totalQuantity: '', unitPrice: '', notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setItems(res.data.data);
    } catch (error) {
      console.error('Envanter yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setFormData({
      _id: '', itemName: '', category: 'Gübre', unit: 'kg', totalQuantity: '', unitPrice: '', notes: ''
    });
    setIsEdit(false);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setFormData({
      _id: item._id,
      itemName: item.itemName,
      category: item.category,
      unit: item.unit,
      totalQuantity: item.totalQuantity,
      unitPrice: item.unitPrice,
      notes: item.notes || ''
    });
    setIsEdit(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        itemName: formData.itemName,
        category: formData.category,
        unit: formData.unit,
        totalQuantity: Number(formData.totalQuantity),
        unitPrice: Number(formData.unitPrice),
        notes: formData.notes
      };

      if (isEdit) {
        await api.put(`/inventory/${formData._id}`, payload);
      } else {
        await api.post('/inventory', payload);
      }
      
      await loadInventory();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Kayıt sırasında bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id) => {
    if (window.confirm('Bu ürünü depodan silmek istediğinize emin misiniz?')) {
      try {
        await api.delete(`/inventory/${id}`);
        await loadInventory();
      } catch (error) {
        alert(error.response?.data?.error || 'Silinirken bir hata oluştu');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  const totalInventoryValue = items.reduce((sum, item) => sum + (item.totalQuantity * item.unitPrice), 0);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">Envanter ve Depo</h1>
          <p className="mt-1 text-earth-600">Toptan aldığınız girdilerin stok takibini yapın</p>
        </div>
        <button onClick={openNewModal} className="btn-primary flex items-center gap-2">
          <span>+</span> Depoya Ürün Ekle
        </button>
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-3">
        <div className="card border-l-4 border-l-primary-500">
          <p className="text-sm font-medium text-earth-500">Toplam Depo Değeri</p>
          <p className="mt-2 text-2xl font-bold text-primary-700">{formatCurrency(totalInventoryValue)}</p>
        </div>
        <div className="card border-l-4 border-l-green-500">
          <p className="text-sm font-medium text-earth-500">Depodaki Ürün Çeşidi</p>
          <p className="mt-2 text-2xl font-bold text-green-700">{items.length} Kalem</p>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-earth-600">
            <thead className="border-b border-earth-200 text-earth-900 bg-earth-50">
              <tr>
                <th className="py-3 pl-4 pr-3 font-semibold rounded-tl-lg">Kategori</th>
                <th className="py-3 px-3 font-semibold">Ürün Adı</th>
                <th className="py-3 px-3 font-semibold text-right">Mevcut Stok</th>
                <th className="py-3 px-3 font-semibold text-right">Ortalama Birim Fiyat</th>
                <th className="py-3 px-3 font-semibold text-right">Toplam Değer</th>
                <th className="py-3 px-3 font-semibold text-right rounded-tr-lg">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-b border-earth-50 hover:bg-earth-50/50 transition">
                  <td className="py-4 pl-4 pr-3">
                    <span className="badge bg-earth-100 text-earth-700">{item.category}</span>
                  </td>
                  <td className="py-4 px-3 font-medium text-earth-900">
                    {item.itemName}
                    {item.notes && <p className="text-xs text-earth-400 font-normal">{item.notes}</p>}
                  </td>
                  <td className="py-4 px-3 text-right">
                    <span className={`font-bold ${item.totalQuantity > 0 ? 'text-primary-700' : 'text-red-500'}`}>
                      {item.totalQuantity} {item.unit}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-4 px-3 text-right font-medium">
                    {formatCurrency(item.totalQuantity * item.unitPrice)}
                  </td>
                  <td className="py-4 px-3 text-right">
                    <button onClick={() => openEditModal(item)} className="text-primary-600 hover:text-primary-800 text-sm font-medium mr-3">
                      Düzenle
                    </button>
                    <button onClick={() => deleteItem(item._id)} className="text-red-600 hover:text-red-800 text-sm font-medium">
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
              
              {items.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-earth-500">
                    Deponuzda hiç ürün bulunmuyor. Yeni ürün eklemek için sağ üstteki butonu kullanın.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-earth-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-earth-900 mb-6">
              {isEdit ? 'Depo Ürününü Düzenle' : 'Depoya Yeni Ürün Ekle'}
            </h3>
            
            <form onSubmit={saveItem} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-earth-700">Ürün Adı</label>
                  <input 
                    type="text" required 
                    className="input" placeholder="Örn: 20.20.0 Taban Gübresi"
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-earth-700">Kategori</label>
                  <select 
                    className="input" 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-earth-700">Birim</label>
                  <select 
                    className="input" 
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-earth-700">Mevcut Miktar / Stok</label>
                  <div className="relative">
                    <input 
                      type="number" required min="0" step="0.01" className="input pr-12"
                      value={formData.totalQuantity}
                      onChange={(e) => setFormData({ ...formData, totalQuantity: e.target.value })}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-earth-400 font-medium">{formData.unit}</span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-earth-700">Birim Fiyat (Maliyet)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-earth-400 font-medium">₺</span>
                    <input 
                      type="number" required min="0" step="0.01" className="input pl-8"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-earth-700">Notlar (İsteğe Bağlı)</label>
                  <input 
                    type="text" className="input" placeholder="Örn: X firmasından toptan alındı"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  İptal
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
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
