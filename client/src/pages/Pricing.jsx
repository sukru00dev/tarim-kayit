import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Pricing() {
  const plans = [
    {
      name: 'Ücretsiz',
      price: '0₺',
      period: '/ay',
      desc: 'Küçük tarlası olan çiftçiler için temel özellikler.',
      features: [
        'Maksimum 2 Tarla',
        'Temel Maliyet Kaydı',
        'Dekar Başına Hesaplama',
        'Topluluk Desteği',
      ],
      cta: 'Hemen Başla',
      highlighted: false,
    },
    {
      name: 'Profesyonel',
      price: '149₺',
      period: '/ay',
      desc: 'Büyüyen tarım işletmeleri için gelişmiş analizler.',
      features: [
        'Sınırsız Tarla Kaydı',
        'Gelişmiş Karar Destek Sistemi',
        'Bölgesel Maliyet Kıyaslama',
        'Excel / CSV Veri Yükleme',
        'Detaylı Sezon Karşılaştırmaları',
        'E-posta Desteği',
      ],
      cta: 'Ücretsiz Dene',
      highlighted: true,
    },
    {
      name: 'Kurumsal',
      price: 'Özel',
      period: '',
      desc: 'Ziraat odaları ve büyük kooperatifler için özel çözümler.',
      features: [
        'Tüm Profesyonel Özellikler',
        'Çoklu Kullanıcı ve Rol Yönetimi',
        'Özel API Entegrasyonu',
        'Özel Ziraat Mühendisi Desteği',
        'SLA Garantili 7/24 Destek',
      ],
      cta: 'Bize Ulaşın',
      highlighted: false,
    },
  ];

  return (
    <div className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold text-earth-900 md:text-5xl tracking-tight mb-6">
            Her Bütçeye Uygun Planlar
          </h1>
          <p className="text-lg text-earth-600">
            İhtiyacınız olan özelliklere göre en uygun paketi seçin. Kredi kartı gerekmeden ücretsiz denemeye başlayın.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, i) => (
            <div key={i} className={`card relative p-8 ${plan.highlighted ? 'border-primary-500 shadow-2xl scale-105 z-10 ring-4 ring-primary-50' : 'border-earth-200 bg-white/80'}`}>
              {plan.highlighted && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                  En Çok Tercih Edilen
                </div>
              )}
              <h3 className="text-2xl font-bold text-earth-900">{plan.name}</h3>
              <p className="text-sm text-earth-600 mt-2 min-h-[40px]">{plan.desc}</p>
              <div className="my-6">
                <span className="text-5xl font-extrabold text-earth-900">{plan.price}</span>
                <span className="text-earth-500 font-medium">{plan.period}</span>
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <Check size={20} className="text-primary-600 shrink-0" />
                    <span className="text-earth-700">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to={plan.name === 'Kurumsal' ? '/contact' : '/login'} className={`w-full block text-center ${plan.highlighted ? 'btn-primary py-3 text-lg' : 'btn-secondary py-3 text-lg'}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
