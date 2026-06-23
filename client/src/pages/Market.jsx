import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/client.js';

function StatCard({ title, price, unit, changePercent }) {
  const isPositive = changePercent >= 0;
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
  const bgColorClass = isPositive ? 'bg-green-50' : 'bg-red-50';
  const arrow = isPositive ? '↑' : '↓';

  return (
    <div className="card border-l-4 border-earth-500">
      <h3 className="text-earth-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900">{price} {unit}</span>
      </div>
      <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${bgColorClass} ${colorClass}`}>
        {arrow} {Math.abs(changePercent)}% (Günlük)
      </div>
    </div>
  );
}

export default function Market() {
  const [latestPrices, setLatestPrices] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState('Buğday');
  const [historyData, setHistoryData] = useState([]);
  const [historyUnit, setHistoryUnit] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatest();
  }, []);

  useEffect(() => {
    if (selectedCommodity) {
      fetchHistory(selectedCommodity);
    }
  }, [selectedCommodity]);

  const fetchLatest = async () => {
    try {
      const res = await api.get('/market/latest');
      if (res.data.success) {
        setLatestPrices(res.data.data);
        if (res.data.data.length > 0 && !selectedCommodity) {
          setSelectedCommodity(res.data.data[0].commodity);
        }
      }
    } catch (error) {
      console.error('Latest prices fetch error:', error);
    }
  };

  const fetchHistory = async (commodity) => {
    setLoading(true);
    try {
      const res = await api.get(`/market/history/${encodeURIComponent(commodity)}`);
      if (res.data.success) {
        setHistoryData(res.data.data);
        setHistoryUnit(res.data.unit);
      }
    } catch (error) {
      console.error('History fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const topItems = latestPrices.slice(0, 4); // Display first 4 as summary cards

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📈 Piyasa & Borsa</h1>
          <p className="mt-1 text-sm text-gray-500">Güncel tarımsal emtia ve girdi fiyatları</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topItems.map((item, idx) => (
          <StatCard 
            key={idx}
            title={item.commodity}
            price={item.price}
            unit={item.unit}
            changePercent={item.changePercent}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Son 30 Günlük Fiyat Trendi</h2>
            <select 
              value={selectedCommodity} 
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="input w-48 py-1.5 text-sm"
            >
              {latestPrices.map((item, i) => (
                <option key={i} value={item.commodity}>{item.commodity}</option>
              ))}
            </select>
          </div>

          <div className="h-80 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">Yükleniyor...</div>
            ) : historyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">Veri bulunamadı</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    tick={{ fontSize: 12, fill: '#6b7280' }} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value} ${historyUnit}`, 'Fiyat']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Fiyat" 
                    stroke="#16a34a" 
                    strokeWidth={3}
                    dot={{ r: 3, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* All Commodities Table */}
        <div className="card overflow-hidden flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tüm Piyasalar</h2>
          <div className="flex-1 overflow-y-auto pr-2">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky top-0 bg-white">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Fiyat</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Değişim</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {latestPrices.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedCommodity(item.commodity)}>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.commodity}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-gray-600">{item.price} {item.unit}</td>
                    <td className={`px-3 py-3 whitespace-nowrap text-sm text-right font-medium ${item.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.changePercent >= 0 ? '+' : ''}{item.changePercent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
