import { ShieldCheck, CloudLightning, LineChart, FileDown, TrendingUp, Smartphone } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: <LineChart size={40} className="text-primary-600" />,
      title: 'Hassas Maliyet Analizi',
      desc: 'Tohumdan hasada kadar tüm gider kalemlerinizi sisteme girin, dekar başına maliyetinizi kuruşu kuruşuna öğrenin. Zararı daha oluşmadan engelleyin.',
    },
    {
      icon: <TrendingUp size={40} className="text-primary-600" />,
      title: 'Sezon Karşılaştırması',
      desc: 'Geçen yılki yaz sezonu ile bu sezon arasındaki girdi farklarını, gübre fiyat artışlarını ve genel enflasyon etkisini detaylı grafiklerle karşılaştırın.',
    },
    {
      icon: <CloudLightning size={40} className="text-primary-600" />,
      title: 'Akıllı Uyarı Sistemi',
      desc: 'Ziraat Mühendisliği veritabanımıza dayalı bölgesel ortalamaları kullanarak, gereğinden fazla gübre veya yakıt kullandığınızda sistem sizi otomatik uyarır.',
    },
    {
      icon: <FileDown size={40} className="text-primary-600" />,
      title: 'Toplu Veri Aktarımı (Excel)',
      desc: 'Eski defterlerinize veya Excel dosyalarınıza sıkışıp kalmayın. Geçmiş yıllara ait verilerinizi tek tıkla sisteme yükleyip hemen analiz etmeye başlayın.',
    },
    {
      icon: <ShieldCheck size={40} className="text-primary-600" />,
      title: 'Yüksek Bulut Güvenliği',
      desc: 'Verileriniz şifrelenmiş olarak güvenli bulut sunucularında tutulur. Telefonunuz bozulsa veya bilgisayarınız çökse bile hiçbir kaydınız kaybolmaz.',
    },
    {
      icon: <Smartphone size={40} className="text-primary-600" />,
      title: 'Her Cihazda Çalışır',
      desc: 'Tarlada traktör üzerindeyken telefondan girdi ekleyin, akşam evde bilgisayarınızdan raporları inceleyin. TarımKayıt tüm cihazlara tam uyumludur.',
    },
  ];

  return (
    <div className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h1 className="text-4xl font-extrabold text-earth-900 md:text-5xl tracking-tight mb-6">
          Çiftliğinizi Yönetmenin En Akıllı Yolu
        </h1>
        <p className="text-lg text-earth-600 max-w-3xl mx-auto mb-16">
          Geleneksel tarımdan dijital tarıma geçişinizi kolaylaştıran modern araçlar. 
          Sadece kayıt tutmakla kalmayın, verilerinizden kâr üreten anlamlı sonuçlar çıkarın.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="card text-left hover:shadow-xl transition-shadow border border-earth-100 bg-white">
              <div className="mb-4 bg-primary-50 w-16 h-16 flex items-center justify-center rounded-2xl">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-earth-900 mb-3">{f.title}</h3>
              <p className="text-earth-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
