import { useEffect, useState } from 'react';
import api from '../api/client.js';

export default function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    _id: '', title: '', description: '', dueDate: '', isCompleted: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data.data);
    } catch (error) {
      console.error('Görevler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      _id: '', title: '', description: '', dueDate: today, isCompleted: false
    });
    setIsEdit(false);
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setFormData({
      _id: task._id,
      title: task.title,
      description: task.description || '',
      dueDate: new Date(task.dueDate).toISOString().split('T')[0],
      isCompleted: task.isCompleted
    });
    setIsEdit(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const saveTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        isCompleted: formData.isCompleted
      };

      if (isEdit) {
        await api.put(`/tasks/${formData._id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      
      await loadTasks();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Kayıt sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const toggleComplete = async (task) => {
    try {
      await api.put(`/tasks/${task._id}`, { isCompleted: !task.isCompleted });
      await loadTasks();
    } catch (error) {
      console.error('Güncelleme hatası', error);
    }
  };

  const deleteTask = async (id) => {
    if (window.confirm('Bu görevi silmek istediğinize emin misiniz?')) {
      try {
        await api.delete(`/tasks/${id}`);
        await loadTasks();
      } catch (error) {
        alert('Silinemedi');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  const upcomingTasks = tasks.filter(t => !t.isCompleted).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const completedTasks = tasks.filter(t => t.isCompleted).sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">Zirai Takvim ve Görevler</h1>
          <p className="mt-1 text-earth-600">İlaçlama, gübreleme ve hasat işlemlerini planlayın</p>
        </div>
        <button onClick={openNewModal} className="btn-primary flex items-center gap-2">
          <span>+</span> Yeni Görev
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Yaklaşan Görevler */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-earth-900 flex items-center gap-2">
            <span>📅</span> Yaklaşan Görevler
          </h2>
          {upcomingTasks.length === 0 ? (
            <p className="text-earth-500 text-sm">Bekleyen görev bulunmuyor.</p>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map(task => {
                const isOverdue = new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0));
                
                return (
                  <div key={task._id} className={`flex items-start gap-4 rounded-lg border p-4 transition hover:shadow-md ${isOverdue ? 'border-red-200 bg-red-50' : 'border-earth-100 bg-white'}`}>
                    <input 
                      type="checkbox" 
                      className="mt-1 h-5 w-5 rounded border-earth-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      checked={task.isCompleted}
                      onChange={() => toggleComplete(task)}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className={`font-semibold ${isOverdue ? 'text-red-800' : 'text-earth-900'}`}>{task.title}</h3>
                        <div className="flex gap-2">
                          <button onClick={() => openEditModal(task)} className="text-xs text-primary-600 hover:underline">Düzenle</button>
                          <button onClick={() => deleteTask(task._id)} className="text-xs text-red-600 hover:underline">Sil</button>
                        </div>
                      </div>
                      <p className="text-sm text-earth-600 mt-1">{task.description}</p>
                      <p className={`text-xs mt-2 font-medium ${isOverdue ? 'text-red-600' : 'text-earth-500'}`}>
                        Tarih: {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                        {isOverdue && ' (Gecikti!)'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tamamlanan Görevler */}
        <div className="card opacity-70">
          <h2 className="mb-4 text-lg font-semibold text-earth-900 flex items-center gap-2">
            <span>✅</span> Tamamlananlar
          </h2>
          {completedTasks.length === 0 ? (
            <p className="text-earth-500 text-sm">Henüz tamamlanan görev yok.</p>
          ) : (
            <div className="space-y-3">
              {completedTasks.slice(0, 5).map(task => (
                <div key={task._id} className="flex items-start gap-4 rounded-lg border border-earth-100 bg-earth-50 p-3">
                  <input 
                    type="checkbox" 
                    className="mt-1 h-5 w-5 rounded border-earth-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    checked={task.isCompleted}
                    onChange={() => toggleComplete(task)}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-earth-500 line-through">{task.title}</h3>
                    <p className="text-xs mt-1 text-earth-400">
                      Tarih: {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))}
              {completedTasks.length > 5 && (
                <p className="text-xs text-earth-500 text-center mt-2">+ {completedTasks.length - 5} daha fazla</p>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-earth-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-earth-900 mb-6">
              {isEdit ? 'Görevi Düzenle' : 'Yeni Görev Planla'}
            </h3>
            
            <form onSubmit={saveTask} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-earth-700">Görev Adı</label>
                <input 
                  type="text" required 
                  className="input" placeholder="Örn: 2. Kat Gübreleme Yapılacak"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-earth-700">Açıklama / Notlar</label>
                <textarea 
                  className="input" rows="3" placeholder="Hangi tarlaya ne kadar atılacak vs."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-earth-700">Hedef Tarih</label>
                <input 
                  type="date" required 
                  className="input"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  İptal
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
