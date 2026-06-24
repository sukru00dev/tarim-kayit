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
  
  // Faz 5 Yeni State'ler
  const [weatherAdvice, setWeatherAdvice] = useState([]);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [iotData, setIotData] = useState(null);
  
  const [year1, setYear1] = useState('2024');
  const [period1, setPeriod1] = useState('Yaz');
  const [year2, setYear2] = useState('2025');
  const [period2, setPeriod2] = useState('Yaz');
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/fields'), 
      api.get('/analytics/insights'), 
      api.get('/seasons')
    ])
      .then(([f, i, s]) => {
        setFields(f.data.data);
        setInsights(i.data.data);
        setSeasons(s.data.data);
        
        if (f.data.data.length > 0) {
          setFieldId(f.data.data[0]._id);
          fetchAiData(f.data.data[0]._id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Seçili tarla değiştiğinde AI ve IoT verisini getir
  useEffect(() => {
    if (fieldId) {
      fetchAiData(fieldId);
    }
  }, [fieldId]);

  const fetchAiData = async (id) => {
    setAiLoading(true);
    try {
      const [aiRes, iotRes, wRes] = await Promise.all([
        api.get(`/analytics/ai/predict-yield?fieldId=${id}`),
        api.get(`/analytics/iot/telemetry?fieldId=${id}`),
        api.get(`/analytics/smart-weather/advice?fieldId=${id}`)
      ]);
      if (aiRes.data.success) setAiPrediction(aiRes.data.data);
      if (iotRes.data.success) setIotData(iotRes.data.data);
      if (wRes.data.success) setWeatherAdvice(wRes.data.data);
    } catch (err) {
      console.error('AI Data error', err);
    } finally {
      setAiLoading(false);
    }
  };

  const runCompare = async () => {
    if (!fieldId) return;
    const res = await api.get('/analytics/compare', {
      params: { fieldId, year1, period1, year2, period2 },
    });
    setCompare(res.data.data);
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 shadow-lg" />
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
    <div className="bg-slate-50 min-h-screen pb-12 -mx-4 sm:-mx-8 px-4 sm:px-8 pt-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <span className="text-blue-600">🧠</span> Akıllı Tarım & Analitik
            </h1>
            <p className="mt-1 text-slate-500 font-medium">
              Yapay Zeka (AI), IoT Telemetri ve Karar Destek Sistemleri
            </p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm font-bold text-slate-700">TÜBİTAK Modülü Aktif</span>
          </div>
        </div>

        {/* Akıllı Hava Durumu Uyarıları */}
        {weatherAdvice && weatherAdvice.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weatherAdvice.map((adv, idx) => (
              <div key={idx} className={`p-4 rounded-xl shadow-md border flex gap-4 ${
                adv.type === 'WARNING' ? 'bg-red-50 border-red-200' : 
                adv.type === 'IoT_SENSOR' ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className={`text-2xl mt-1 ${
                  adv.type === 'WARNING' ? 'text-red-500' : 
                  adv.type === 'IoT_SENSOR' ? 'text-blue-500' : 'text-emerald-500'
                }`}>
                  {adv.type === 'WARNING' ? '⚠️' : adv.type === 'IoT_SENSOR' ? '📡' : '✅'}
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${
                    adv.type === 'WARNING' ? 'text-red-900' : 
                    adv.type === 'IoT_SENSOR' ? 'text-blue-900' : 'text-emerald-900'
                  }`}>{adv.title}</h3>
                  <p className={`text-sm mt-1 font-medium ${
                    adv.type === 'WARNING' ? 'text-red-700' : 
                    adv.type === 'IoT_SENSOR' ? 'text-blue-700' : 'text-emerald-700'
                  }`}>{adv.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI ve IoT Kontrol Paneli */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🤖 Tarlaya Özel Yapay Zeka Analizi
            </h2>
            <select 
              className="w-full sm:w-auto bg-slate-800 text-white border-slate-700 rounded-lg px-4 py-2 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              value={fieldId} 
              onChange={(e) => setFieldId(e.target.value)}
            >
              {fields.map((f) => (
                <option key={f._id} value={f._id}>{f.fieldName}</option>
              ))}
            </select>
          </div>

          <div className="p-4 sm:p-6 bg-slate-50 relative min-h-[300px]">
            {aiLoading ? (
              <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-blue-800 font-bold animate-pulse">Yapay Zeka Modelleri Hesaplanıyor...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Sol Taraf: AI Rekolte */}
                {aiPrediction && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Makine Öğrenmesi</h3>
                      <h2 className="text-2xl font-black text-slate-800 mb-6">Rekolte Tahmini (Yield Prediction)</h2>
                      
                      <div className="flex items-end gap-3 mb-6">
                        <span className="text-5xl font-black text-blue-600">{aiPrediction.estimatedYieldKg}</span>
                        <span className="text-xl font-bold text-slate-400 mb-1">KG</span>
                      </div>
                      
                      <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
                        <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${aiPrediction.confidenceScore}%` }}></div>
                      </div>
                      <p className="text-xs font-bold text-slate-400 mb-6 flex justify-between">
                        <span>Güven Skoru (R² Skoru)</span>
                        <span className="text-blue-600">% {aiPrediction.confidenceScore}</span>
                      </p>
                    </div>

                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                      <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
                        💡 AI Tavsiyeleri
                      </h4>
                      <ul className="space-y-2">
                        {aiPrediction.aiRecommendations.map((rec, i) => (
                          <li key={i} className="text-sm text-amber-800 font-medium flex items-start gap-2">
                            <span className="mt-0.5">•</span> <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Sağ Taraf: IoT Telemetri */}
                {iotData && iotData.sensors && (
                  <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl p-6 text-white">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">IoT Sensör Ağı (Canlı)</h3>
                      <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Bağlı
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full pb-6">
                      
                      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors"></div>
                        <span className="text-3xl mb-2">💧</span>
                        <span className="text-xs font-bold text-slate-400 mb-1">Toprak Nemi</span>
                        <span className={`text-2xl font-black ${iotData.sensors.soilMoisture.status === 'LOW' ? 'text-red-400' : 'text-white'}`}>
                          {iotData.sensors.soilMoisture.value}{iotData.sensors.soilMoisture.unit}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-2">İdeal: {iotData.sensors.soilMoisture.optimalRange}</span>
                      </div>

                      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors"></div>
                        <span className="text-3xl mb-2">🌡️</span>
                        <span className="text-xs font-bold text-slate-400 mb-1">Toprak Sıcaklığı</span>
                        <span className="text-2xl font-black text-white">
                          {iotData.sensors.soilTemperature.value}{iotData.sensors.soilTemperature.unit}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-2">İdeal: {iotData.sensors.soilTemperature.optimalRange}</span>
                      </div>

                      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors"></div>
                        <span className="text-3xl mb-2">🧪</span>
                        <span className="text-xs font-bold text-slate-400 mb-1">pH Seviyesi</span>
                        <span className="text-2xl font-black text-white">
                          {iotData.sensors.phLevel.value}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-2">İdeal: {iotData.sensors.phLevel.optimalRange}</span>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Klasik Kural Tabanlı İçgörüler (Eski Kod) */}
        <div className="grid gap-6">
          {insights.map((field) => (
            <div key={field.fieldId} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{field.fieldName}</h2>
                  <p className="text-sm font-medium text-slate-500">{field.cropType} — Geleneksel İçgörüler</p>
                </div>
                {field.benchmark && (
                  <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm border border-blue-100">
                    <span className="text-blue-700 font-medium">Bölge ortalaması: </span>
                    <span className="font-black text-blue-900 text-lg">
                      {formatCurrency(field.benchmark.regionAvgCostPerDecare)}/dkr
                    </span>
                    <p className="text-[11px] text-blue-500 mt-1 font-semibold">{field.benchmark.sourceNote}</p>
                  </div>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {field.insights.map((ins, i) => (
                  <InsightCard key={i} insight={ins} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Karşılaştırma Grafikleri */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Sezon Karşılaştırma</h2>
          <p className="text-sm font-medium text-slate-500 mb-6">İki dönem arasında maliyet farkını grafiksel olarak analiz edin</p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Tarla</label>
              <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={fieldId} onChange={(e) => setFieldId(e.target.value)}>
                {fields.map((f) => (
                  <option key={f._id} value={f._id}>{f.fieldName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Dönem 1 (Yıl)</label>
              <input className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={year1} onChange={(e) => setYear1(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Dönem 1</label>
              <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={period1} onChange={(e) => setPeriod1(e.target.value)}>
                {['İlkbahar', 'Yaz', 'Sonbahar', 'Kış'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Dönem 2 (Yıl)</label>
              <input className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={year2} onChange={(e) => setYear2(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Dönem 2</label>
              <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={period2} onChange={(e) => setPeriod2(e.target.value)}>
                {['İlkbahar', 'Yaz', 'Sonbahar', 'Kış'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-5 flex justify-end mt-2">
              <button onClick={runCompare} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all">
                Karşılaştır
              </button>
            </div>
          </div>

          {compare && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 rounded-xl bg-slate-50 border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <span className="font-bold text-slate-800 bg-white px-3 py-1 rounded border shadow-sm">{compare.season1.label}</span> 
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  <span className="font-bold text-slate-800 bg-white px-3 py-1 rounded border shadow-sm">{compare.season2.label}</span>
                </p>
                <div className={`px-4 py-2 rounded-lg font-black text-lg shadow-sm border ${compare.costChangePercent > 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                  Maliyet Değişimi: {compare.costChangePercent > 0 ? '↗' : '↘'} {Math.abs(compare.costChangePercent)}%
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 text-center">Maliyet Karşılaştırması</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={compareChart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(v) => formatCurrency(v)} cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Legend iconType="circle" />
                      <Bar dataKey="toplam" name="Toplam Maliyet" fill="#334155" radius={[4, 4, 0, 0]} maxBarSize={50} />
                      <Bar dataKey="dekar" name="Dekar Başı" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 text-center">Girdi Dağılımı (Radar)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={30} domain={['auto', 'auto']} tick={false} />
                      <Radar name={compare.season1.label} dataKey="season1" stroke="#334155" fill="#334155" fillOpacity={0.3} strokeWidth={2} />
                      <Radar name={compare.season2.label} dataKey="season2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} strokeWidth={2} />
                      <Legend iconType="circle" />
                      <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
