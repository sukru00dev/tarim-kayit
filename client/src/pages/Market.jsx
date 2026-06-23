import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import { Activity, TrendingUp, TrendingDown, Globe, RefreshCw, BarChart2, DollarSign, Sprout } from 'lucide-react';
import api from '../api/client.js';

function StatCard({ title, price, unit, changePercent, onClick, isSelected }) {
  const isPositive = changePercent >= 0;
  const colorClass = isPositive ? 'text-emerald-400' : 'text-rose-400';
  const bgColorClass = isPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10';
  const borderClass = isSelected ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-slate-800 hover:border-slate-600';
  
  // Ürüne göre ikon belirleme
  const getIcon = (name) => {
    if (['Buğday', 'Mısır', 'Yulaf', 'Pirinç'].includes(name)) return '🌾';
    if (['Kahve', 'Kakao'].includes(name)) return '☕';
    if (['Pamuk'].includes(name)) return '☁️';
    if (['Şeker'].includes(name)) return '🧊';
    return '🌱';
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-slate-900 rounded-xl p-5 border cursor-pointer transition-all duration-300 relative overflow-hidden group ${borderClass}`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <span className="text-6xl grayscale group-hover:grayscale-0">{getIcon(title)}</span>
      </div>
      
      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
        {title}
      </h3>
      
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-black text-white tracking-tight">{price}</span>
        <span className="text-sm font-bold text-slate-500">{unit}</span>
      </div>
      
      <div className={`mt-3 inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black tracking-wider ${bgColorClass} ${colorClass}`}>
        {isPositive ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
        {Math.abs(changePercent)}%
      </div>
    </div>
  );
}

export default function Market() {
  const [latestPrices, setLatestPrices] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState('Buğday');
  const [selectedSource, setSelectedSource] = useState('TURIB');
  const [historyData, setHistoryData] = useState([]);
  const [historyUnit, setHistoryUnit] = useState('');
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetchLatest(selectedSource);
  }, [selectedSource]);

  useEffect(() => {
    if (selectedCommodity) {
      fetchHistory(selectedCommodity, selectedSource);
    }
  }, [selectedCommodity, selectedSource]);

  const fetchLatest = async (source) => {
    setLoadingLatest(true);
    try {
      const res = await api.get(`/market/latest?source=${source}`);
      if (res.data.success) {
        setLatestPrices(res.data.data);
        if (res.data.data.length > 0 && !res.data.data.find(d => d.commodity === selectedCommodity)) {
          setSelectedCommodity(res.data.data[0].commodity);
        }
      }
    } catch (error) {
      console.error('Latest prices fetch error:', error);
    } finally {
      setLoadingLatest(false);
    }
  };

  const fetchHistory = async (commodity, source) => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/market/history/${encodeURIComponent(commodity)}?source=${source}`);
      if (res.data.success) {
        setHistoryData(res.data.data);
        setHistoryUnit(res.data.unit);
      }
    } catch (error) {
      console.error('History fetch error:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const forceSync = async () => {
    setLoadingLatest(true);
    setLoadingHistory(true);
    try {
      await api.post('/market/sync');
      await fetchLatest(selectedSource);
      await fetchHistory(selectedCommodity, selectedSource);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-80px)] -m-8 p-4 sm:p-8 font-sans text-slate-300">
      
      {/* Header Alanı */}
      <div className="max-w-[1400px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-800 pb-6 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Activity className="text-white w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Canlı Piyasa Terminali</h1>
          </div>
          <p className="text-slate-400 font-medium tracking-wide">
            Dünya borsalarından (CBOT/ICE) 9 farklı tarımsal emtia için gerçek zamanlı analiz.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Piyasalar Tabı */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner flex-1 md:flex-none">
            <button
              onClick={() => setSelectedSource('TURIB')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                selectedSource === 'TURIB' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sprout size={16} /> TÜRİB (TL/kg)
            </button>
            <button
              onClick={() => setSelectedSource('CME')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                selectedSource === 'CME' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Globe size={16} /> CME/ICE (Global)
            </button>
          </div>
          
          <button 
            onClick={forceSync}
            className="h-[42px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-2 font-bold transition-all"
            title="Verileri Zorla Yenile"
          >
            <RefreshCw size={16} className={loadingLatest ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Senkronize Et</span>
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto">
        
        {/* Üst Kartlar (Grid) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          {loadingLatest ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="bg-slate-900 rounded-xl h-[130px] border border-slate-800 animate-pulse"></div>
            ))
          ) : (
            latestPrices.map((item, idx) => (
              <StatCard 
                key={idx}
                title={item.commodity}
                price={item.price}
                unit={item.unit}
                changePercent={item.changePercent}
                isSelected={selectedCommodity === item.commodity}
                onClick={() => setSelectedCommodity(item.commodity)}
              />
            ))
          )}
        </div>

        {/* Alt Kısım: Grafik ve Tablo */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Sol Kısım: Ana Grafik */}
          <div className="xl:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl flex flex-col relative overflow-hidden">
            {/* Arka plan ışıltısı */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="p-6 border-b border-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <BarChart2 className="text-blue-500" /> 
                  {selectedCommodity} 30 Günlük Teknik Analizi
                </h2>
                <p className="text-sm text-slate-400 font-medium mt-1">Veri Kaynağı: Yahoo Finance Canlı Verileri (Smart Fallback Korumalı)</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Piyasa Açık</span>
              </div>
            </div>

            <div className="flex-1 min-h-[400px] p-6 z-10">
              {loadingHistory ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="font-bold tracking-widest text-xs uppercase">Borsa Verisi İşleniyor...</span>
                </div>
              ) : historyData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 font-medium">Veri bulunamadı</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10} 
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                      tickLine={false} 
                      axisLine={false}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                      itemStyle={{ color: '#60a5fa', fontWeight: '900', fontSize: '1.1rem' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '4px' }}
                      formatter={(value) => [`${value} ${historyUnit}`, 'Kapanış Fiyatı']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Fiyat" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                      activeDot={{ r: 6, fill: '#60a5fa', stroke: '#020617', strokeWidth: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Sağ Kısım: Piyasalar Tablosu */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <DollarSign className="text-indigo-500" /> Piyasalar Özet
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-950/50 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Emtia</th>
                    <th className="px-5 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Son Fiyat</th>
                    <th className="px-5 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Fark (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {latestPrices.map((item, idx) => {
                    const isPositive = item.changePercent >= 0;
                    return (
                      <tr 
                        key={idx} 
                        className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${selectedCommodity === item.commodity ? 'bg-slate-800/80 border-l-2 border-blue-500' : 'border-l-2 border-transparent'}`}
                        onClick={() => setSelectedCommodity(item.commodity)}
                      >
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-white">
                          {item.commodity}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-right font-black text-slate-300">
                          {item.price} <span className="text-slate-600 text-xs ml-1 font-semibold">{item.unit.split('/')[0]}</span>
                        </td>
                        <td className={`px-5 py-4 whitespace-nowrap text-sm text-right font-black tracking-wide ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? '+' : ''}{item.changePercent}%
                        </td>
                      </tr>
                    );
                  })}
                  {latestPrices.length === 0 && !loadingLatest && (
                    <tr>
                      <td colSpan="3" className="px-5 py-8 text-center text-slate-500 font-medium">Veri yüklenemedi.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
