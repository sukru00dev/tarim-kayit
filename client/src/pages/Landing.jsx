import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, BarChart3, BellRing, FileDown, ShieldCheck, Smartphone } from 'lucide-react';
import api from '../api/client.js';

export default function Landing() {
  const [marketPrices, setMarketPrices] = useState([]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await api.get('/market/latest');
        if (res.data && res.data.success) {
          setMarketPrices(res.data.data.slice(0, 5));
        }
      } catch (error) {
        console.error('Market prices fetch error:', error);
      }
    };
    fetchPrices();
  }, []);
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-20">
        {/* Market Ticker */}
        {marketPrices.length > 0 && (
          <div className="mb-12 border border-earth-200 bg-white rounded-2xl shadow-sm p-4 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2 pr-4 sm:border-r border-earth-200">
                <span className="text-xl">📈</span>
                <span className="font-bold text-earth-900 text-sm">Canlı Borsa</span>
              </div>
              <div className="flex flex-wrap items-center gap-6 flex-1 justify-center sm:justify-start">
                {marketPrices.map((item, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="text-xs font-semibold text-earth-500 uppercase tracking-wider">{item.commodity}</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-earth-900">{item.price} <span className="text-xs font-normal">{item.unit}</span></span>
                      <span className={`text-xs font-bold ${item.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.changePercent >= 0 ? '▲' : '▼'} {Math.abs(item.changePercent)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="animate-fade-in-up">
            <span className="badge bg-primary-100 text-primary-800 px-3 py-1 text-sm font-semibold mb-4 inline-block shadow-sm">
              🚀 Yeni Nesil Karar Destek Platformu
            </span>
            <h1 className="mt-2 text-5xl font-extrabold leading-tight text-earth-900 lg:text-6xl tracking-tight">
              Tarlanızın maliyetini <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-earth-600">tam kontrol</span> altına alın.
            </h1>
            <p className="mt-6 text-xl text-earth-600 leading-relaxed font-medium">
              Geleneksel defterleri bir kenara bırakın. Tohum, gübre, yakıt ve işçilik giderlerinizi dijital ortamda yönetin; dekar başına maliyetinizi kuruşu kuruşuna hesaplayın.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/login" className="btn-primary px-8 py-4 text-lg shadow-xl shadow-primary-500/30 hover:-translate-y-1 transition-transform">
                Hemen Ücretsiz Başla
              </Link>
              <Link to="/features" className="btn-secondary px-8 py-4 text-lg hover:-translate-y-1 transition-transform">
                Özellikleri Keşfet
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -translate-x-4 translate-y-4 rounded-2xl bg-earth-200/50 blur-xl"></div>
            <div className="relative border border-earth-200 rounded-2xl shadow-2xl overflow-hidden bg-white">
              {/* Fake Browser Top Bar */}
              <div className="bg-earth-100 border-b border-earth-200 px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="mx-auto bg-white text-earth-400 text-xs px-24 py-1 rounded-md">app.tarimkayit.com</div>
              </div>
              <img src="/mockup.png" alt="TarımKayıt Dashboard" className="w-full object-cover" />
            </div>
          </div>
        </div>

        <div className="mt-32">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-earth-900 sm:text-4xl">Neden TarımKayıt?</h2>
            <p className="mt-4 text-lg text-earth-600">
              Modern çiftçiliğin gereksinimlerine uygun olarak tasarlanmış özelliklerle verimliliğinizi artırın.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <BarChart3 size={32} className="text-earth-700" />,
                title: 'Detaylı Dashboard',
                desc: 'Tüm tarlalarınızı ve dönemlerinizi tek bir ekrandan yönetin. KPI kartları ile finansal durumunuzu anlık takip edin.',
              },
              {
                icon: <ShieldCheck size={32} className="text-earth-700" />,
                title: 'Güvenli ve Bulut Tabanlı',
                desc: 'Verileriniz kaybolmaz. Defteriniz yanmaz, ıslanmaz. Tüm kayıtlarınız bulutta yüksek güvenlik standartlarıyla korunur.',
              },
              {
                icon: <Smartphone size={32} className="text-earth-700" />,
                title: 'Mobil Uyumlu',
                desc: 'İster tarlada traktörün üstünde, ister evinizde... Sistem tüm telefon ve tabletlerde kusursuz çalışır.',
              },
            ].map((f) => (
              <div key={f.title} className="card text-center p-8 hover:-translate-y-2 transition-transform duration-300">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-earth-100 to-earth-50 shadow-inner mb-6">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-earth-900 mb-3">{f.title}</h3>
                <p className="text-earth-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-32 mb-16 text-center">
           <div className="bg-primary-600 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-10">
               <LineChart size={300} color="white" />
             </div>
             <h2 className="text-3xl font-bold text-white mb-6 relative z-10">Artık Maliyetlerinizi Tahmin Etmeyin, Bilin!</h2>
             <p className="text-primary-100 text-lg max-w-2xl mx-auto mb-8 relative z-10">Uygulamamızı hemen denemek için demo hesabımızla sisteme giriş yapın. Kayıt veya kurulum gerekmez.</p>
             <Link to="/login" className="inline-block bg-white text-primary-700 font-bold px-8 py-4 rounded-xl shadow-lg hover:bg-earth-50 hover:scale-105 transition-all relative z-10">
                Hemen Ücretsiz Deneyin
             </Link>
           </div>
        </div>
      </section>
    </div>
  );
}
