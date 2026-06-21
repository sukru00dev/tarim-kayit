import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client.js';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/register', formData);
      if (response.data.success) {
        // Doğrulama sayfasına yönlendir, e-postayı taşıyarak
        navigate('/verify', { state: { email: formData.email } });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Kayıt başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-earth-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🌱</span>
            <span className="text-xl font-bold text-earth-900">Tarımsal Maliyet</span>
          </Link>
          <p className="mt-2 text-sm text-earth-600">Yeni Hesap Oluştur</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <h1 className="text-xl font-bold text-earth-900">Kayıt Ol</h1>
          <p className="mt-1 text-sm text-earth-500">Bilgilerinizi eksiksiz doldurun</p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="fullName">
                Ad Soyad
              </label>
              <input
                id="fullName"
                className="input"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="username">
                Kullanıcı Adı
              </label>
              <input
                id="username"
                className="input"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="email">
                E-posta Adresi
              </label>
              <input
                id="email"
                type="email"
                className="input"
                value={formData.email}
                onChange={handleChange}
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
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary mt-6 w-full" disabled={loading}>
            {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-earth-600">
              Zaten hesabınız var mı?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                Giriş Yapın
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
