import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { to: '/dashboard', label: 'Gösterge Paneli', icon: '📊' },
  { to: '/fields', label: 'Tarlalarım', icon: '🌾' },
  { to: '/seasons', label: 'Sezon Kayıtları', icon: '📅' },
  { to: '/analytics', label: 'Karar Destek', icon: '💡' },
  { to: '/report', label: 'Rapor', icon: '📄' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-earth-50">
      <aside className="no-print fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-earth-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-earth-100 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-xl">
            🌱
          </div>
          <div>
            <p className="text-sm font-bold text-earth-900">Tarımsal Maliyet</p>
            <p className="text-xs text-earth-500">Girdi Yönetim Sistemi</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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
            <p className="text-sm font-medium text-earth-900">{user?.fullName}</p>
            <p className="text-xs text-earth-500">@{user?.username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Çıkış Yap
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <div className="border-b border-earth-100 bg-white px-8 py-4 no-print">
          <p className="text-xs font-medium uppercase tracking-wider text-primary-600">
            Harran Üniversitesi · Çok Disiplinli Mühendislik Projesi
          </p>
        </div>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
