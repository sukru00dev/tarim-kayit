import { Link, Outlet } from 'react-router-dom';
import { Leaf } from 'lucide-react';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 via-earth-50 to-white">
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-earth-100 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 text-white shadow-md transition-transform group-hover:scale-105">
              <Leaf size={24} />
            </div>
            <div>
              <p className="text-xl font-extrabold text-earth-900 tracking-tight leading-none">TarımKayıt</p>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 font-medium text-earth-600">
            <Link to="/features" className="hover:text-primary-600 transition-colors">Özellikler</Link>
            <Link to="/pricing" className="hover:text-primary-600 transition-colors">Fiyatlandırma</Link>
            <Link to="/contact" className="hover:text-primary-600 transition-colors">İletişim</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:inline-flex text-earth-700 hover:text-primary-600 font-semibold">
              Giriş Yap
            </Link>
            <Link to="/login" className="btn-primary">
              Ücretsiz Deneyin
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-earth-200 bg-white py-12 text-center text-sm text-earth-500">
        <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-4 gap-8 text-left mb-8">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
                <Leaf size={18} />
              </div>
              <span className="text-lg font-bold text-earth-900">TarımKayıt</span>
            </Link>
            <p className="text-earth-600 max-w-sm">
              Modern çiftçiliğin dijital karar destek asistanı. Maliyetlerinizi şeffaflaştırın, kârınızı maksimize edin.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-earth-900 mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/features" className="hover:text-primary-600">Özellikler</Link></li>
              <li><Link to="/pricing" className="hover:text-primary-600">Fiyatlandırma</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-earth-900 mb-4">Şirket</h4>
            <ul className="space-y-2">
              <li><Link to="/contact" className="hover:text-primary-600">İletişim</Link></li>
              <li><a href="#" className="hover:text-primary-600">Gizlilik Politikası</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-earth-100 pt-8">
          <p className="font-medium text-earth-700">TarımKayıt © {new Date().getFullYear()} Tüm Hakları Saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
