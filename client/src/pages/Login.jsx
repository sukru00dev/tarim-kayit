import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, navigate]);

  if (user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(username, password);
      navigate(u.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('ahmet_ciftci');
      setPassword('ciftci123');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-earth-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🌱</span>
            <span className="text-xl font-bold text-earth-900">Tarımsal Maliyet</span>
          </Link>
          <p className="mt-2 text-sm text-earth-600">Karar Destek Sistemi — Giriş</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <h1 className="text-xl font-bold text-earth-900">Hoş geldiniz</h1>
          <p className="mt-1 text-sm text-earth-500">Kullanıcı adı ve şifrenizle giriş yapın</p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="username">
                Kullanıcı adı
              </label>
              <input
                id="username"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Şifre
              </label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary mt-6 w-full" disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>

          <div className="mt-6 border-t border-earth-100 pt-4">
            <p className="text-center text-xs text-earth-500">Demo hesapları (sunum için)</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => fillDemo('farmer')}
                className="btn-secondary flex-1 text-xs"
              >
                Çiftçi demo
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="btn-secondary flex-1 text-xs"
              >
                Admin demo
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
