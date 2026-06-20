import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { InsightCard } from '../components/KpiCard.jsx';

function formatCurrency(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0);
}

export default function Report() {
  const [fields, setFields] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [fieldId, setFieldId] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/fields'), api.get('/seasons')]).then(([f, s]) => {
      setFields(f.data.data);
      setSeasons(s.data.data);
      if (f.data.data.length) setFieldId(f.data.data[0]._id);
      if (s.data.data.length) setSeasonId(s.data.data[0]._id);
    });
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/report', {
        params: { fieldId, seasonId },
      });
      setReport(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fieldId && seasonId) generateReport();
  }, [fieldId, seasonId]);

  const filteredSeasons = seasons.filter((s) => s.fieldId?._id === fieldId || s.fieldId === fieldId);

  return (
    <div>
      <div className="no-print mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">Sezon Maliyet Raporu</h1>
          <p className="mt-1 text-earth-600">Yazdırılabilir maliyet analiz raporu</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="label">Tarla</label>
            <select
              className="input w-48"
              value={fieldId}
              onChange={(e) => {
                setFieldId(e.target.value);
                const first = seasons.find((s) => (s.fieldId?._id || s.fieldId) === e.target.value);
                if (first) setSeasonId(first._id);
              }}
            >
              {fields.map((f) => (
                <option key={f._id} value={f._id}>{f.fieldName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Sezon</label>
            <select className="input w-40" value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
              {filteredSeasons.map((s) => (
                <option key={s._id} value={s._id}>{s.seasonLabel}</option>
              ))}
            </select>
          </div>
          <button onClick={() => window.print()} className="btn-primary self-end">
            Yazdır / PDF
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      )}

      {report && !loading && (
        <div className="card mx-auto max-w-4xl print:shadow-none print:border-none">
          <div className="border-b border-earth-200 pb-6 text-center">
            <p className="text-xs uppercase tracking-widest text-primary-600">
              Harran Üniversitesi · Tarımsal Maliyet Yönetim Sistemi
            </p>
            <h1 className="mt-2 text-2xl font-bold text-earth-900">Sezon Maliyet Raporu</h1>
            <p className="mt-1 text-earth-600">{report.season.label}</p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-earth-500">Üretici</p>
              <p className="font-semibold">{report.farmer}</p>
            </div>
            <div>
              <p className="text-sm text-earth-500">Rapor Tarihi</p>
              <p className="font-semibold">{new Date(report.generatedAt).toLocaleDateString('tr-TR')}</p>
            </div>
            <div>
              <p className="text-sm text-earth-500">Tarla</p>
              <p className="font-semibold">{report.field.fieldName}</p>
            </div>
            <div>
              <p className="text-sm text-earth-500">Mahsul / Alan</p>
              <p className="font-semibold">{report.field.cropType} · {report.field.areaDecare} dekar</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-primary-50 p-4 text-center">
              <p className="text-sm text-earth-600">Toplam Maliyet</p>
              <p className="text-2xl font-bold text-earth-900">{formatCurrency(report.season.totalCost)}</p>
            </div>
            <div className="rounded-lg bg-earth-100 p-4 text-center">
              <p className="text-sm text-earth-600">Dekar Başı Maliyet</p>
              <p className="text-2xl font-bold text-primary-700">{formatCurrency(report.season.costPerDecare)}</p>
            </div>
          </div>

          {report.benchmark && (
            <div className="mt-6 rounded-lg border border-earth-200 bg-earth-50 p-4">
              <p className="text-sm font-semibold text-earth-800">Bölgesel Kıyas ({report.benchmark.region})</p>
              <p className="mt-1 text-sm text-earth-600">
                Bölge ortalaması: {formatCurrency(report.benchmark.regionAvgCostPerDecare)}/dekar
              </p>
              <p className="text-xs text-earth-400">{report.benchmark.sourceNote}</p>
            </div>
          )}

          <div className="mt-8">
            <h2 className="font-semibold text-earth-900">Girdi Detayları</h2>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="border-b border-earth-200 text-left text-earth-500">
                  <th className="pb-2">Girdi</th>
                  <th className="pb-2">Kategori</th>
                  <th className="pb-2 text-right">Miktar</th>
                  <th className="pb-2 text-right">Birim Fiyat</th>
                  <th className="pb-2 text-right">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {report.season.inputs.map((inp, i) => (
                  <tr key={i} className="border-b border-earth-100">
                    <td className="py-2">{inp.name}</td>
                    <td className="py-2">{inp.category}</td>
                    <td className="py-2 text-right">{inp.amount} {inp.unit}</td>
                    <td className="py-2 text-right">{formatCurrency(inp.unitPrice)}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(inp.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {report.insights?.length > 0 && (
            <div className="mt-8 no-print">
              <h2 className="font-semibold text-earth-900">Karar Destek Notları</h2>
              <div className="mt-3 space-y-3">
                {report.insights.map((ins, i) => (
                  <InsightCard key={i} insight={ins} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 border-t border-earth-200 pt-4 text-center text-xs text-earth-400">
            Web Tabanlı Tarımsal Maliyet ve Girdi Yönetim Sistemi — Çok Disiplinli Mühendislik Projesi
          </div>
        </div>
      )}
    </div>
  );
}
