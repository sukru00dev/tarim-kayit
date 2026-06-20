import { useEffect, useState } from 'react';
import api from '../api/client.js';
import KpiCard from '../components/KpiCard.jsx';

function formatCurrency(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0);
}

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [benchmarks, setBenchmarks] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'farmer',
  });
  const [benchForm, setBenchForm] = useState({
    cropType: '',
    regionAvgCostPerDecare: '',
    region: 'Şanlıurfa',
    sourceNote: 'Ziraat Mühendisliği referans verisi',
  });
  const [error, setError] = useState('');

  const load = () => {
    Promise.all([
      api.get('/users'),
      api.get('/users/stats'),
      api.get('/benchmarks'),
    ]).then(([u, s, b]) => {
      setUsers(u.data.data);
      setStats(s.data.data);
      setBenchmarks(b.data.data);
    });
  };

  useEffect(load, []);

  const createUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', userForm);
      setUserForm({ username: '', password: '', fullName: '', role: 'farmer' });
      setShowUserForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Kullanıcı eklenemedi');
    }
  };

  const toggleUser = async (user) => {
    await api.put(`/users/${user._id}`, { isActive: !user.isActive });
    load();
  };

  const saveBenchmark = async (e) => {
    e.preventDefault();
    await api.post('/benchmarks', {
      ...benchForm,
      regionAvgCostPerDecare: Number(benchForm.regionAvgCostPerDecare),
    });
    setBenchForm({ cropType: '', regionAvgCostPerDecare: '', region: 'Şanlıurfa', sourceNote: 'Ziraat Mühendisliği referans verisi' });
    load();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-earth-900">Yönetim Paneli</h1>
        <p className="mt-1 text-earth-600">Kullanıcı yönetimi, sistem istatistikleri ve referans verileri</p>
      </div>

      {stats && (
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Toplam Kullanıcı" value={stats.userCount} icon="👥" />
          <KpiCard title="Aktif Çiftçi" value={stats.farmerCount} icon="🌾" />
          <KpiCard title="Toplam Tarla" value={stats.fieldCount} icon="📐" />
          <KpiCard title="Toplam Alan" value={`${stats.totalAreaDecare} dkr`} icon="🗺️" />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-earth-900">Kullanıcılar</h2>
            <button onClick={() => setShowUserForm(!showUserForm)} className="btn-secondary text-xs">
              {showUserForm ? 'İptal' : '+ Kullanıcı Ekle'}
            </button>
          </div>

          {showUserForm && (
            <form onSubmit={createUser} className="mb-4 rounded-lg border border-earth-100 bg-earth-50 p-4">
              {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="input" placeholder="Kullanıcı adı" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} required />
                <input className="input" placeholder="Ad Soyad" value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} required />
                <input type="password" className="input" placeholder="Şifre" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required />
                <select className="input" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                  <option value="farmer">Çiftçi</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn-primary mt-3 text-xs">Kaydet</button>
            </form>
          )}

          <div className="space-y-2">
            {users.map((u) => (
              <div key={u._id} className="flex items-center justify-between rounded-lg border border-earth-100 px-4 py-3">
                <div>
                  <p className="font-medium">{u.fullName}</p>
                  <p className="text-xs text-earth-500">@{u.username} · {u.role === 'admin' ? 'Yönetici' : 'Çiftçi'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {u.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                  <button onClick={() => toggleUser(u)} className="text-xs text-primary-600">
                    {u.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold text-earth-900">Bölgesel Referans Maliyetleri</h2>
          <p className="mb-4 text-xs text-earth-500">Ziraat Mühendisliği disiplininden referans dekar maliyetleri</p>

          <form onSubmit={saveBenchmark} className="mb-4 grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="Mahsul (Pamuk)" value={benchForm.cropType} onChange={(e) => setBenchForm({ ...benchForm, cropType: e.target.value })} required />
            <input type="number" className="input" placeholder="₺/dekar" value={benchForm.regionAvgCostPerDecare} onChange={(e) => setBenchForm({ ...benchForm, regionAvgCostPerDecare: e.target.value })} required />
            <input className="input sm:col-span-2" placeholder="Bölge" value={benchForm.region} onChange={(e) => setBenchForm({ ...benchForm, region: e.target.value })} />
            <button type="submit" className="btn-primary sm:col-span-2 text-xs">Referans Kaydet</button>
          </form>

          <div className="space-y-2">
            {benchmarks.map((b) => (
              <div key={b._id} className="flex justify-between rounded-lg bg-earth-50 px-4 py-2 text-sm">
                <span className="font-medium">{b.cropType}</span>
                <span>{formatCurrency(b.regionAvgCostPerDecare)}/dekar</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mt-8">
        <h2 className="font-semibold text-earth-900">API Dokümantasyonu</h2>
        <p className="mt-1 text-sm text-earth-600">
          Swagger UI üzerinden tüm REST API uç noktalarını inceleyebilirsiniz.
        </p>
        <a
          href="http://localhost:5000/api/docs"
          target="_blank"
          rel="noreferrer"
          className="btn-secondary mt-4 inline-flex"
        >
          Swagger UI Aç →
        </a>
      </div>
    </div>
  );
}
