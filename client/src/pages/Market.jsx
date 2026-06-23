import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/client.js';

function StatCard({ title, price, unit, changePercent }) {

  const isPositive = changePercent >= 0;
  const colorClass = isPositive ? 'text-green-400' : 'text-red-400';
  const bgColorClass = isPositive ? 'bg-green-500/10' : 'bg-red-500/10';
  const arrow = isPositive ? '▲' : '▼';

  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        {isPositive ? <span className="text-6xl text-green-500">📈</span> : <span className="text-6xl text-red-500">📉</span>}
      </div>
      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">{title}</h3>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-black text-white">{price}</span>
        <span className="text-sm font-medium text-slate-500">{unit}</span>
      </div>
      <div className={`mt-3 inline-flex items-center px-2.5 py-1 rounded-md text-sm font-bold ${bgColorClass} ${colorClass}`}>
        {arrow} {Math.abs(changePercent)}%
      </div>
    </div>
  );
}

export default function Market() {
  const [latestPrices, setLatestPrices] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState('Buğday');
  const [selectedSource, setSelectedSource] = useState('TURIB'); // Yeni: Kaynak seçimi
  const [historyData, setHistoryData] = useState([]);
  const [historyUnit, setHistoryUnit] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatest(selectedSource);
  }, [selectedSource]);

  useEffect(() => {
    if (selectedCommodity) {
      fetchHistory(selectedCommodity, selectedSource);
    }
  }, [selectedCommodity, selectedSource]);

  const fetchLatest = async (source) => {
    try {
      const res = await api.get(`/market/latest?source=${source}`);
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

  const fetchHistory = async (commodity, source) => {
    setLoading(true);
    try {
      const res = await api.get(`/market/history/${encodeURIComponent(commodity)}?source=${source}`);
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
    <div className="bg-slate-900 min-h-[calc(100vh-80px)] -m-8 p-6 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span className="text-blue-500">📊</span> Canlı Piyasa Terminali
            </h1>
            <p className="mt-2 text-sm text-slate-400 font-medium tracking-wide">Tarımsal Emtia ve Girdi Fiyatları Analiz Ekranı</p>
          </div>
          
          {/* Borsa (Source) Seçici */}
          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700 shadow-inner">
            <button
              onClick={() => setSelectedSource('TURIB')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                selectedSource === 'TURIB' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              TÜRİB (Türkiye)
            </button>
            <button
              onClick={() => setSelectedSource('CME')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                selectedSource === 'CME' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              CME (Global)
            </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-6">
          <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
            <h2 className="text-xl font-bold text-white">30 Günlük Teknik Analiz ({selectedSource})</h2>
            <select 
              value={selectedCommodity} 
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
            >
              {latestPrices.map((item, i) => (
                <option key={i} value={item.commodity}>{item.commodity}</option>
              ))}
            </select>
          </div>

          <div className="h-[400px] w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-medium animate-pulse">Veriler Çekiliyor...</div>
            ) : historyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500">Veri bulunamadı</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} dy={10} />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    tick={{ fontSize: 12, fill: '#94a3b8' }} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                    itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                    formatter={(value) => [`${value} ${historyUnit}`, 'Kapanış Fiyatı']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Fiyat" 
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    dot={{ r: 0 }}
                    activeDot={{ r: 8, fill: '#3b82f6', stroke: '#fff', strokeWidth: 3 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* All Commodities Table */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-700 bg-slate-800/50">
            <h2 className="text-xl font-bold text-white">Canlı Piyasalar ({selectedSource})</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-900/50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Emtia</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Fiyat</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Değişim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {latestPrices.map((item, idx) => (
                  <tr 
                    key={idx} 
                    className="hover:bg-slate-700/50 cursor-pointer transition-colors" 
                    onClick={() => setSelectedCommodity(item.commodity)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">{item.commodity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-300 font-medium">{item.price} <span className="text-slate-500 text-xs">{item.unit}</span></td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${item.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {item.changePercent >= 0 ? '▲' : '▼'} {Math.abs(item.changePercent)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
