import { Mail, MapPin, Phone } from 'lucide-react';

export default function Contact() {
  return (
    <div className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <h1 className="text-4xl font-extrabold text-earth-900 tracking-tight mb-6">
              Bizimle İletişime Geçin
            </h1>
            <p className="text-lg text-earth-600 mb-8">
              Sistem hakkında sorularınız, kurumsal entegrasyon talepleriniz veya geri bildirimleriniz için bize ulaşın. Ekibimiz size en kısa sürede dönüş yapacaktır.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary-100 p-3 rounded-xl text-primary-700">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-earth-900">E-Posta</h3>
                  <p className="text-earth-600">destek@tarimkayit.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary-100 p-3 rounded-xl text-primary-700">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-earth-900">Telefon</h3>
                  <p className="text-earth-600">+90 (850) 123 45 67</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary-100 p-3 rounded-xl text-primary-700">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-earth-900">Ofis</h3>
                  <p className="text-earth-600">Harran Üniversitesi Teknokent<br/>Osmanbey Kampüsü, Şanlıurfa</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-white p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-earth-900 mb-6">Mesaj Gönderin</h2>
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); alert('Mesajınız başarıyla gönderildi.'); }}>
              <div>
                <label className="label">Adınız Soyadınız</label>
                <input type="text" className="input" placeholder="Ahmet Yılmaz" required />
              </div>
              <div>
                <label className="label">E-Posta Adresiniz</label>
                <input type="email" className="input" placeholder="ahmet@example.com" required />
              </div>
              <div>
                <label className="label">Mesajınız</label>
                <textarea className="input min-h-[120px] resize-none" placeholder="Size nasıl yardımcı olabiliriz?" required></textarea>
              </div>
              <button type="submit" className="btn-primary w-full py-3 text-lg">
                Gönder
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
