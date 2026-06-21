import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import api from '../api/client.js';
import KpiCard, { InsightCard, EmptyState } from '../components/KpiCard.jsx';
import WeatherWidget from '../components/WeatherWidget.jsx';

const COLORS = ['#16a34a', '#a6713d', '#2563eb', '#dc2626', '#9333ea', '#0891b2'];

function formatCurrency(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0);
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/analytics/dashboard'), api.get('/analytics/insights')])
      .then(([dash, ins]) => {
        setData(dash.data.data);
        setInsights(ins.data.data.flatMap((f) => f.insights.slice(0, 2)));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!data?.summary?.fieldCount) {
    return (
      <EmptyState
        title="Henüz tarla kaydı yok"
        description="Maliyet takibine başlamak için önce bir tarla ekleyin, ardından sezon kaydı oluşturun."
        actionLabel="Tarla Ekle"
        actionTo="/fields"
      />
    );
  }

  const { summary, costBreakdown, trend, recentSeasons } = data;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">Gösterge Paneli</h1>
          <p className="mt-1 text-earth-600">Tarla ve sezon maliyetlerinizin genel görünümü</p>
        </div>
        <Link to="/seasons/new" className="btn-primary">
          + Sezon Kaydı Ekle
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard title="Toplam Tarla" value={summary.fieldCount} icon="🌾" />
        <KpiCard title="Toplam Maliyet" value={formatCurrency(summary.totalCost)} icon="💸" />
        <KpiCard title="Toplam Gelir" value={formatCurrency(summary.totalIncome)} icon="💰" />
        <KpiCard title="Net Kar / Zarar" value={formatCurrency(summary.totalNetProfit)} icon={summary.totalNetProfit >= 0 ? "📈" : "📉"} />
        <KpiCard
          title="Yıllık Amortisman"
          value={formatCurrency(summary.totalAnnualDepreciation)}
          subtitle="Tüm traktör ve ekipman yıpranma payı"
          icon="🚜"
        />
      </div>

      {insights.length > 0 && (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-earth-900">Karar Destek Önerileri</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {insights.slice(0, 4).map((ins, i) => (
                <InsightCard key={i} insight={ins} />
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-4 text-lg font-semibold text-earth-900 opacity-0 hidden lg:block">Hava Durumu</h2>
            <WeatherWidget />
          </div>
        </div>
      )}

      {insights.length === 0 && (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-start-3">
            <WeatherWidget />
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold text-earth-900">Maliyet Dağılımı (Girdi Türü)</h2>
          {costBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={costBreakdown}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                >
                  {costBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-earth-500">Henüz veri yok</p>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold text-earth-900">Sezon Maliyet Trendi</h2>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0ccad" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="costPerDecare" name="Dekar Başı (₺)" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-earth-500">Henüz veri yok</p>
          )}
        </div>
      </div>

      <div className="card mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-earth-900">Son Sezon Kayıtları</h2>
          <Link to="/seasons" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            Tümünü gör →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-earth-100 text-left text-earth-500">
                <th className="pb-3 pr-4">Sezon</th>
                <th className="pb-3 pr-4">Tarla</th>
                <th className="pb-3 pr-4">Mahsul</th>
                <th className="pb-3 pr-4 text-right">Toplam</th>
                <th className="pb-3 text-right">Dekar Başı</th>
              </tr>
            </thead>
            <tbody>
              {recentSeasons.map((s) => (
                <tr key={s._id} className="border-b border-earth-50">
                  <td className="py-3 pr-4 font-medium">{s.seasonLabel}</td>
                  <td className="py-3 pr-4">{s.fieldId?.fieldName}</td>
                  <td className="py-3 pr-4">{s.fieldId?.cropType}</td>
                  <td className="py-3 pr-4 text-right">{formatCurrency(s.totalCost)}</td>
                  <td className="py-3 text-right font-medium text-primary-700">
                    {formatCurrency(s.costPerDecare)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
