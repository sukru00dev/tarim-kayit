import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import api from '../api/client.js';
import { InsightCard } from '../components/KpiCard.jsx';

function formatCurrency(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0);
}

export default function Analytics() {
  const [fields, setFields] = useState([]);
  const [insights, setInsights] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [compare, setCompare] = useState(null);
  const [fieldId, setFieldId] = useState('');
  const [year1, setYear1] = useState('2024');
  const [period1, setPeriod1] = useState('Yaz');
  const [year2, setYear2] = useState('2025');
  const [period2, setPeriod2] = useState('Yaz');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/fields'), api.get('/analytics/insights'), api.get('/seasons')])
      .then(([f, i, s]) => {
        setFields(f.data.data);
        setInsights(i.data.data);
        setSeasons(s.data.data);
        if (f.data.data.length) setFieldId(f.data.data[0]._id);
      })
      .finally(() => setLoading(false));
  }, []);

  const runCompare = async () => {
    if (!fieldId) return;
    const res = await api.get('/analytics/compare', {
      params: { fieldId, year1, period1, year2, period2 },
    });
    setCompare(res.data.data);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  const compareChart = compare
    ? [
        { name: compare.season1.label, toplam: compare.season1.totalCost, dekar: compare.season1.costPerDecare },
        { name: compare.season2.label, toplam: compare.season2.totalCost, dekar: compare.season2.costPerDecare },
      ]
    : [];

  const radarData = compare ? (() => {
    const categories = ['Tohum', 'Gübre', 'Yakıt', 'İlaç', 'İşçilik', 'Diğer'];
    return categories.map(cat => {
      const s1Input = compare.season1.inputs.find(i => i.category === cat) || { total: 0 };
      const s2Input = compare.season2.inputs.find(i => i.category === cat) || { total: 0 };
      return {
        subject: cat,
        season1: s1Input.total,
        season2: s2Input.total,
      };
    });
  })() : [];

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button onClick={() => window.history.back()} className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-earth-500 hover:text-earth-900 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Geri Dön
          </button>
          <h1 className="text-2xl font-bold text-earth-900">Karar Destek Analizi</h1>
          <p className="mt-1 text-earth-600">
          Ziraat bilgisine dayalı kural tabanlı öneriler ve sezon karşılaştırması
        </p>
      </div>

      <div className="mb-8 grid gap-6">
        {insights.map((field) => (
          <div key={field.fieldId} className="card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-earth-900">{field.fieldName}</h2>
                <p className="text-sm text-earth-500">{field.cropType}</p>
              </div>
              {field.benchmark && (
                <div className="rounded-lg bg-earth-50 px-4 py-2 text-sm">
                  <span className="text-earth-500">Bölge ortalaması: </span>
                  <span className="font-semibold">
                    {formatCurrency(field.benchmark.regionAvgCostPerDecare)}/dekar
                  </span>
                  <p className="text-xs text-earth-400">{field.benchmark.sourceNote}</p>
                </div>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {field.insights.map((ins, i) => (
                <InsightCard key={i} insight={ins} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-lg font-bold text-earth-900">Sezon Karşılaştırma</h2>
        <p className="mt-1 text-sm text-earth-500">İki dönem arasında maliyet farkını analiz edin</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="label">Tarla</label>
            <select className="input" value={fieldId} onChange={(e) => setFieldId(e.target.value)}>
              {fields.map((f) => (
                <option key={f._id} value={f._id}>{f.fieldName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Dönem 1 — Yıl</label>
            <input className="input" value={year1} onChange={(e) => setYear1(e.target.value)} />
          </div>
          <div>
            <label className="label">Dönem 1</label>
            <select className="input" value={period1} onChange={(e) => setPeriod1(e.target.value)}>
              {['İlkbahar', 'Yaz', 'Sonbahar', 'Kış'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Dönem 2 — Yıl</label>
            <input className="input" value={year2} onChange={(e) => setYear2(e.target.value)} />
          </div>
          <div>
            <label className="label">Dönem 2</label>
            <select className="input" value={period2} onChange={(e) => setPeriod2(e.target.value)}>
              {['İlkbahar', 'Yaz', 'Sonbahar', 'Kış'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={runCompare} className="btn-primary mt-4">
          Karşılaştır
        </button>

        {compare && (
          <div className="mt-6">
            <div className="mb-4 rounded-lg bg-earth-50 p-4">
              <p className="text-sm text-earth-600">
                <strong>{compare.season1.label}</strong> → <strong>{compare.season2.label}</strong>
              </p>
              <p className={`mt-1 text-lg font-bold ${compare.costChangePercent > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                Maliyet değişimi: {compare.costChangePercent > 0 ? '+' : ''}{compare.costChangePercent}%
              </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={compareChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="toplam" name="Toplam Maliyet" fill="#a6713d" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dekar" name="Dekar Başı" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-8 pt-8 border-t border-earth-100">
              <h3 className="text-md font-bold text-earth-900 mb-4">Girdi Dağılımı Karşılaştırması</h3>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis />
                  <Radar name={compare.season1.label} dataKey="season1" stroke="#a6713d" fill="#a6713d" fillOpacity={0.6} />
                  <Radar name={compare.season2.label} dataKey="season2" stroke="#16a34a" fill="#16a34a" fillOpacity={0.6} />
                  <Legend />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {seasons.length > 0 && (
        <div className="card mt-8">
          <h2 className="font-semibold text-earth-900">Mevcut Sezon Kayıtları</h2>
          <p className="mt-1 text-xs text-earth-500">Karşılaştırma için yukarıdaki alanları doldurun</p>
          <ul className="mt-3 space-y-1 text-sm text-earth-600">
            {seasons.slice(0, 6).map((s) => (
              <li key={s._id}>• {s.fieldId?.fieldName} — {s.seasonLabel} ({formatCurrency(s.costPerDecare)}/dkr)</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
