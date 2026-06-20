export function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, error: messages.join(', ') });
  }
  if (err.code === 11000) {
    return res.status(409).json({ success: false, error: 'Bu kayıt zaten mevcut' });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: 'Geçersiz kimlik formatı' });
  }
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Sunucu hatası',
  });
}
