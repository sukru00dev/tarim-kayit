import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { to: '/dashboard', label: 'Gösterge Paneli', icon: '📊' },
  { to: '/fields', label: 'Tarlalarım', icon: '🌾' },
  { to: '/seasons', label: 'Sezon Kayıtları', icon: '📅' },
  { to: '/assets', label: 'Demirbaşlarım', icon: '🚜' },
  { to: '/analytics', label: 'Karar Destek', icon: '💡' },
  { to: '/report', label: 'Rapor', icon: '📄' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex min-h-screen bg-earth-50">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-earth-100 bg-white shadow-sm transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-earth-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-xl">
              🌱
            </div>
            <div>
              <p className="text-sm font-bold text-earth-900">Tarımsal Maliyet</p>
              <p className="text-xs text-earth-500">Girdi Yönetim Sistemi</p>
            </div>
          </div>
          <button className="md:hidden text-earth-500" onClick={closeMobileMenu}>
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-earth-600 hover:bg-earth-50 hover:text-earth-900'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-earth-600 hover:bg-earth-50 hover:text-earth-900'
                }`
              }
            >
              <span>⚙️</span>
              Yönetim Paneli
            </NavLink>
          )}
        </nav>

        <div className="border-t border-earth-100 p-4">
          <div className="mb-3 rounded-lg bg-earth-50 px-3 py-2">
            <p className="text-sm font-medium text-earth-900 truncate">{user?.fullName}</p>
            <p className="text-xs text-earth-500 truncate">@{user?.username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 md:ml-64 overflow-hidden">
        <div className="flex items-center justify-between border-b border-earth-100 bg-white px-4 md:px-8 py-4 no-print shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-earth-600 hover:text-earth-900 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-bold text-earth-900">Menü</span>
          </div>
          <p className="hidden md:block text-xs font-medium uppercase tracking-wider text-primary-600">
            Harran Üniversitesi · Çok Disiplinli Mühendislik Projesi
          </p>
        </div>
        <div className="p-4 md:p-8 flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
