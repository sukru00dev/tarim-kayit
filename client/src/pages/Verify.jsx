import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/client.js';

export default function Verify() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/verify', { email, code });
      if (response.data.success) {
        setSuccess('Hesabınız başarıyla doğrulandı! Giriş sayfasına yönlendiriliyorsunuz...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Doğrulama başarısız oldu. Kodu yanlış girmiş olabilirsiniz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-earth-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🌱</span>
            <span className="text-xl font-bold text-earth-900">Tarımsal Maliyet</span>
          </Link>
          <p className="mt-2 text-sm text-earth-600">E-posta Doğrulama</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <h1 className="text-xl font-bold text-earth-900">Aktivasyon Kodu</h1>
          <p className="mt-1 text-sm text-earth-500">
            {email ? `${email} adresine gönderdiğimiz 6 haneli kodu giriniz.` : 'E-posta adresinize gönderilen 6 haneli kodu giriniz.'}
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          
          {success && (
            <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
          )}

          <div className="mt-6 space-y-4">
            {!location.state?.email && (
              <div>
                <label className="label" htmlFor="email">
                  E-posta Adresi
                </label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="label" htmlFor="code">
                6 Haneli Kod
              </label>
              <input
                id="code"
                type="text"
                className="input text-center text-2xl font-bold tracking-widest"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary mt-6 w-full" disabled={loading || success}>
            {loading ? 'Doğrulanıyor...' : 'Doğrula'}
          </button>
        </form>
      </div>
    </div>
  );
}
