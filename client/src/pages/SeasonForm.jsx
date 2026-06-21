import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client.js';

const UNITS = ['kg', 'litre', 'gün', 'adet', 'ton', 'çuval', 'paket'];

function formatCurrency(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0);
}

export default function SeasonForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [fields, setFields] = useState([]);
  const [defaults, setDefaults] = useState(null);
  const [inventory, setInventory] = useState([]);
  
  const [fieldId, setFieldId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [seasonPeriod, setSeasonPeriod] = useState('Yaz');
  const [inputs, setInputs] = useState([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/fields'),
      api.get('/seasons/defaults/inputs'),
      api.get('/inventory').catch(() => ({ data: { data: [] } })), // Depoyu getir
      isEdit ? api.get(`/seasons/${id}`) : Promise.resolve(null),
    ]).then(([fieldsRes, defaultsRes, inventoryRes, seasonRes]) => {
      setFields(fieldsRes.data.data);
      setDefaults(defaultsRes.data.data);
      setInventory(inventoryRes.data.data || []);
      
      if (seasonRes) {
        const s = seasonRes.data.data;
        setFieldId(s.fieldId._id || s.fieldId);
        setYear(s.year);
        setSeasonPeriod(s.seasonPeriod);
        setInputs(s.inputs);
        setNotes(s.notes || '');
      } else {
        setInputs(defaultsRes.data.data.defaults.map((d) => ({ ...d, amount: 0, unitPrice: 0 })));
      }
    }).finally(() => setLoading(false));
  }, [id, isEdit]);

  const selectedField = fields.find((f) => f._id === fieldId);
  const previewTotal = inputs.reduce((s, i) => s + (Number(i.amount) || 0) * (Number(i.unitPrice) || 0), 0);
  const previewPerDecare = selectedField?.areaDecare ? previewTotal / selectedField.areaDecare : 0;

  const updateInput = (index, key, value) => {
    setInputs((prev) => prev.map((inp, i) => (i === index ? { ...inp, [key]: value } : inp)));
  };

  const addCustomInput = () => {
    setInputs((prev) => [
      ...prev,
      { name: '', category: 'Diğer', unit: 'adet', amount: 0, unitPrice: 0 },
    ]);
  };

  const addInventoryInput = (e) => {
    const invId = e.target.value;
    if (!invId) return;
    
    const item = inventory.find(i => i._id === invId);
    if (!item) return;

    setInputs((prev) => [
      ...prev,
      { 
        name: item.itemName, 
        category: item.category, 
        unit: item.unit, 
        amount: 0, 
        unitPrice: item.unitPrice,
        inventoryItemId: item._id
      },
    ]);
    
    // Select kutusunu sıfırla
    e.target.value = '';
  };

  const removeInput = (index) => {
    setInputs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      fieldId,
      year: Number(year),
      seasonPeriod,
      inputs: inputs
        .filter((i) => i.amount > 0 || i.unitPrice > 0)
        .map((i) => ({
          name: i.name,
          category: i.category,
          amount: Number(i.amount),
          unit: i.unit,
          unitPrice: Number(i.unitPrice),
          inventoryItemId: i.inventoryItemId || null
        })),
      notes,
    };
    try {
      if (isEdit) {
        await api.put(`/seasons/${id}`, payload);
      } else {
        await api.post('/seasons', payload);
      }
      navigate('/seasons');
    } catch (err) {
      setError(err.response?.data?.error || 'Kayıt başarısız');
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

  if (!fields.length) {
    return (
      <div className="card text-center">
        <p className="text-earth-600">Önce bir tarla eklemeniz gerekiyor.</p>
        <button onClick={() => navigate('/fields')} className="btn-primary mt-4">
          Tarla Ekle
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-earth-500 hover:text-earth-900 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Geri Dön
        </button>
        <h1 className="text-2xl font-bold text-earth-900">
          {isEdit ? 'Sezon Kaydını Düzenle' : 'Yeni Sezon Kaydı'}
        </h1>
        <p className="mt-1 text-earth-600">
          Girdi maliyetlerini girin — isterseniz deponuzdan kullanın, isterseniz manuel maliyet girin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card">
            <h2 className="font-semibold text-earth-900">Sezon Bilgileri</h2>
            {error && <div className="mt-2 rounded bg-red-50 p-2 text-sm text-red-600 font-medium">{error}</div>}
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="label">Tarla</label>
                <select className="input" value={fieldId} onChange={(e) => setFieldId(e.target.value)} required disabled={isEdit}>
                  <option value="">Seçin</option>
                  {fields.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.fieldName} ({f.cropType}, {f.areaDecare} dkr)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Yıl</label>
                <input type="number" className="input" value={year} onChange={(e) => setYear(e.target.value)} min="2000" max="2100" required />
              </div>
              <div>
                <label className="label">Dönem</label>
                <select className="input" value={seasonPeriod} onChange={(e) => setSeasonPeriod(e.target.value)} required>
                  {defaults?.seasonPeriods?.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h2 className="font-semibold text-earth-900">Girdi Kalemleri</h2>
              <div className="flex items-center gap-2">
                <select 
                  className="input text-xs py-1.5 bg-primary-50 text-primary-700 border-primary-200" 
                  onChange={addInventoryInput}
                  defaultValue=""
                >
                  <option value="" disabled>📦 Depodan Kullan</option>
                  {inventory.filter(i => i.totalQuantity > 0).map(inv => (
                    <option key={inv._id} value={inv._id}>
                      {inv.itemName} (Kalan: {inv.totalQuantity} {inv.unit})
                    </option>
                  ))}
                </select>
                <button type="button" onClick={addCustomInput} className="btn-secondary text-xs py-1.5">
                  + Yeni Satın Alım
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {inputs.map((inp, idx) => {
                const isFromInventory = Boolean(inp.inventoryItemId);
                
                return (
                  <div key={idx} className={`rounded-lg border p-4 ${isFromInventory ? 'border-primary-200 bg-primary-50/30' : 'border-earth-100 bg-earth-50/50'}`}>
                    <div className="grid gap-3 sm:grid-cols-6">
                      <div className="sm:col-span-2">
                        <label className="label text-xs">Girdi Adı</label>
                        <div className="relative">
                          {isFromInventory && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs">📦</span>}
                          <input 
                            className={`input ${isFromInventory ? 'pl-6 bg-earth-100 text-earth-500' : ''}`} 
                            value={inp.name} 
                            onChange={(e) => updateInput(idx, 'name', e.target.value)} 
                            required 
                            disabled={isFromInventory}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="label text-xs">Kategori</label>
                        <select 
                          className={`input ${isFromInventory ? 'bg-earth-100 text-earth-500' : ''}`} 
                          value={inp.category} 
                          onChange={(e) => updateInput(idx, 'category', e.target.value)}
                          disabled={isFromInventory}
                        >
                          {defaults?.categories?.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label text-xs">Miktar</label>
                        <input 
                          type="number" min="0" step="0.01" 
                          className="input border-primary-300" 
                          value={inp.amount} 
                          onChange={(e) => updateInput(idx, 'amount', e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="label text-xs">Birim</label>
                        <select 
                          className={`input ${isFromInventory ? 'bg-earth-100 text-earth-500' : ''}`} 
                          value={inp.unit} 
                          onChange={(e) => updateInput(idx, 'unit', e.target.value)}
                          disabled={isFromInventory}
                        >
                          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label text-xs">Birim Fiyat (₺)</label>
                        <input 
                          type="number" min="0" step="0.01" 
                          className={`input ${isFromInventory ? 'bg-earth-100 text-earth-500' : ''}`} 
                          value={inp.unitPrice} 
                          onChange={(e) => updateInput(idx, 'unitPrice', e.target.value)} 
                          disabled={isFromInventory}
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-earth-500">
                        {isFromInventory ? 'Maliyet Depodan Düşülecek' : 'Satır toplamı'}: 
                        <strong className="ml-1 text-earth-900">{formatCurrency((inp.amount || 0) * (inp.unitPrice || 0))}</strong>
                      </span>
                      {inputs.length > 1 && (
                        <button type="button" onClick={() => removeInput(idx)} className="text-red-600 text-xs hover:underline">
                          Kaldır
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <label className="label">Notlar</label>
            <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Sezon hakkında ek bilgiler..." />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card sticky top-8 bg-primary-50 border-primary-100">
            <h2 className="font-semibold text-earth-900">Maliyet Önizleme</h2>
            <p className="mt-1 text-xs text-earth-500">
              Maliyetlere depodan düşülen kalemler dahildir.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm text-earth-500">Toplam Maliyet</p>
                <p className="text-2xl font-bold text-earth-900">{formatCurrency(previewTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-earth-500">Dekar Başı Maliyet</p>
                <p className="text-2xl font-bold text-primary-700">{formatCurrency(previewPerDecare)}</p>
              </div>
              {selectedField && (
                <p className="text-xs text-earth-500">
                  {selectedField.areaDecare} dekar · {selectedField.cropType}
                </p>
              )}
            </div>
            <button type="submit" className="btn-primary mt-6 w-full" disabled={saving}>
              {saving ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
