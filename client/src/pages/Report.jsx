import { useEffect, useState, useRef } from 'react';
import api from '../api/client.js';
import { Printer, ArrowLeft, Loader2, FileSpreadsheet, Sprout } from 'lucide-react';
import { InsightCard } from '../components/KpiCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function formatCurrency(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0);
}

export default function Report() {
  const { user } = useAuth();
  const [fields, setFields] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [fieldId, setFieldId] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/assets?type=Land'), api.get('/assets?type=PlantingSeason')]).then(([f, s]) => {
      // Asset mapping
      const mappedFields = f.data.data.map(asset => ({...asset, fieldName: asset.name}));
      const mappedSeasons = s.data.data.map(asset => ({
        ...asset, 
        seasonLabel: asset.name,
        fieldId: asset.fieldId?._id || asset.fieldId
      }));
      
      setFields(mappedFields);
      setSeasons(mappedSeasons);
      
      if (mappedFields.length) setFieldId(mappedFields[0]._id);
      if (mappedSeasons.length) setSeasonId(mappedSeasons[0]._id);
    }).catch(err => console.error("Rapor verisi alınamadı:", err));
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/report', {
        params: { fieldId, seasonId },
      });
      setReport(res.data.data);
    } catch (error) {
      console.error("Rapor oluşturulamadı", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fieldId && seasonId) generateReport();
  }, [fieldId, seasonId]);

  const filteredSeasons = seasons.filter((s) => s.fieldId === fieldId);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 -m-8 p-4 sm:p-8 font-sans">
      
      {/* Üst Kontrol Paneli (Yazdırıldığında gizlenir) */}
      <div className="print:hidden max-w-5xl mx-auto mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <button onClick={() => window.history.back()} className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={16} /> Geri Dön
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="text-blue-600" />
            Finansal Maliyet Raporu
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Seçili tarla ve sezon için detaylı maliyet analiz belgesi.</p>
        </div>
        
        <div className="flex flex-wrap items-end gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-48">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Tarla Seçimi</label>
            <select
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold transition-all"
              value={fieldId}
              onChange={(e) => {
                setFieldId(e.target.value);
                const first = seasons.find((s) => s.fieldId === e.target.value);
                if (first) setSeasonId(first._id);
              }}
            >
              {fields.map((f) => (
                <option key={f._id} value={f._id}>{f.fieldName}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 md:w-48">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Sezon Seçimi</label>
            <select 
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold transition-all" 
              value={seasonId} 
              onChange={(e) => setSeasonId(e.target.value)}
            >
              {filteredSeasons.map((s) => (
                <option key={s._id} value={s._id}>{s.seasonLabel}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => window.print()} 
            className="flex-1 md:flex-none h-[42px] inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-md active:scale-95"
          >
            <Printer size={18} />
            PDF / Yazdır
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      )}

      {/* Rapor Kağıdı */}
      {report && !loading && (
        <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0">
          
          {/* Fatura/Rapor Başlığı */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-8">
            <div>
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Sprout size={28} strokeWidth={2.5} />
                <span className="text-xl font-black tracking-tight text-slate-900">TarımKayıt</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Tarımsal Maliyet Yönetim Sistemi</p>
              <p className="text-sm text-slate-500 mt-1">Akıllı Karar Destek Raporu</p>
            </div>
            <div className="mt-6 sm:mt-0 text-left sm:text-right">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Maliyet Raporu</h1>
              <p className="text-lg font-semibold text-slate-600 mt-1">{report.season.label}</p>
              <p className="text-sm text-slate-400 mt-2">Oluşturulma: {new Date(report.generatedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' })}</p>
            </div>
          </div>

          {/* Rapor Özeti Grid */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Üretici</p>
              <p className="text-base font-bold text-slate-900">{report.farmer}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tarla Tanımı</p>
              <p className="text-base font-bold text-slate-900">{report.field.fieldName}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mahsul</p>
              <p className="text-base font-bold text-slate-900">{report.field.cropType}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ekim Alanı</p>
              <p className="text-base font-bold text-slate-900">{report.field.areaDecare} <span className="text-slate-500 text-sm font-medium">dekar</span></p>
            </div>
          </div>

          {/* Finansal Özet Kartları */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 bg-slate-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10">
                <svg className="w-32 h-32 -mr-8 -mt-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              </div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Toplam Sezon Maliyeti</p>
              <p className="text-4xl font-black mt-2">{formatCurrency(report.season.totalCost)}</p>
            </div>
            <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl p-6 relative overflow-hidden">
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Dekar Başı Maliyet</p>
              <p className="text-4xl font-black text-blue-900 mt-2">{formatCurrency(report.season.costPerDecare)}</p>
              <p className="text-xs font-semibold text-blue-500 mt-2">Birim maliyet analiziniz</p>
            </div>
          </div>

          {/* Benchmark (Kıyaslama) */}
          {report.benchmark && (
            <div className="mt-6 border-l-4 border-amber-400 bg-amber-50 p-4 rounded-r-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-amber-900">Bölgesel Kıyaslama ({report.benchmark.region})</p>
                  <p className="mt-1 text-sm font-medium text-amber-800">
                    Bölgenizdeki ortalama maliyet: <span className="font-bold">{formatCurrency(report.benchmark.regionAvgCostPerDecare)} / dekar</span>
                  </p>
                </div>
                <div className="text-right">
                  {report.season.costPerDecare > report.benchmark.regionAvgCostPerDecare ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-100 text-red-700 text-xs font-bold">
                      Ortalamadan Yüksek
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-100 text-green-700 text-xs font-bold">
                      Ortalamadan Düşük
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs font-medium text-amber-600/70 mt-2">{report.benchmark.sourceNote}</p>
            </div>
          )}

          {/* Girdi Detayları Tablosu */}
          <div className="mt-10">
            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
              Harcama ve Girdi Kalemleri
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs font-black tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Girdi Tanımı</th>
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4 text-right">Miktar</th>
                    <th className="px-6 py-4 text-right">Birim Fiyat</th>
                    <th className="px-6 py-4 text-right">Toplam Fiyat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {report.season.inputs.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500 font-medium">Bu sezona ait girdi kaydı bulunmuyor.</td></tr>
                  ) : report.season.inputs.map((inp, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{inp.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">
                          {inp.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-600">{inp.amount} <span className="text-xs text-slate-400">{inp.unit}</span></td>
                      <td className="px-6 py-4 text-right font-medium text-slate-600">{formatCurrency(inp.unitPrice)}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">{formatCurrency(inp.total)}</td>
                    </tr>
                  ))}
                </tbody>
                {report.season.inputs.length > 0 && (
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-right font-bold text-slate-600 uppercase tracking-wider text-xs">Genel Toplam</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 text-base">{formatCurrency(report.season.totalCost)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* AI Yapay Zeka Tavsiyeleri */}
          {report.insights?.length > 0 && (
            <div className="mt-10 print:mt-8 break-inside-avoid">
              <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-purple-600 rounded-full"></div>
                Yapay Zeka Karar Destek Notları
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {report.insights.map((ins, i) => (
                  <InsightCard key={i} insight={ins} />
                ))}
              </div>
            </div>
          )}

          {/* Alt Bilgi */}
          <div className="mt-16 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs font-semibold text-slate-400 print:mt-10">
            <p>Rapor dijital ortamda üretilmiştir, resmi muhasebe belgesi yerine geçmez.</p>
            <p className="mt-2 sm:mt-0 text-slate-300">TarımKayıt v2.0</p>
          </div>
        </div>
      )}
    </div>
  );
}
