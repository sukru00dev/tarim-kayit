import User from '../models/User.js';
import { signToken, asyncHandler } from '../middleware/auth.js';
import { sendActivationEmail } from '../utils/email.js';
import crypto from 'crypto';

export const register = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;
  if (!username || !email || !password || !fullName) {
    return res.status(400).json({ success: false, error: 'Tüm alanları doldurmanız gereklidir.' });
  }

  const existingUser = await User.findOne({ 
    $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase().trim() }] 
  });

  if (existingUser) {
    return res.status(400).json({ success: false, error: 'Bu kullanıcı adı veya e-posta adresi zaten kullanımda.' });
  }

  const passwordHash = await User.hashPassword(password);
  
  // 6 haneli aktivasyon kodu oluştur
  const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const activationCodeExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 saat geçerli

  const newUser = await User.create({
    username,
    email,
    passwordHash,
    fullName,
    role: 'farmer',
    isVerified: false,
    activationCode,
    activationCodeExpires
  });

  // E-posta Gönder
  const emailSent = await sendActivationEmail(email, activationCode);
  
  if (!emailSent) {
    // E-posta gönderilemezse kullanıcıyı sil (Gerçek hayatta silmek yerine tekrar gönderme mekanizması kurulabilir)
    await User.findByIdAndDelete(newUser._id);
    return res.status(500).json({ success: false, error: 'E-posta gönderilemedi. Girdiğiniz e-posta adresini kontrol edip tekrar deneyin.' });
  }

  res.status(201).json({
    success: true,
    message: 'Kayıt başarılı. Lütfen e-posta adresinize gelen aktivasyon kodunu girin.'
  });
});

export const verify = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  
  if (!email || !code) {
    return res.status(400).json({ success: false, error: 'E-posta ve aktivasyon kodu gereklidir.' });
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
    activationCode: code,
    activationCodeExpires: { $gt: Date.now() } // Kodun süresi dolmamış olmalı
  });

  if (!user) {
    return res.status(400).json({ success: false, error: 'Geçersiz veya süresi dolmuş aktivasyon kodu.' });
  }

  user.isVerified = true;
  user.activationCode = undefined;
  user.activationCodeExpires = undefined;
  await user.save();

  res.json({ success: true, message: 'Hesabınız başarıyla doğrulandı! Şimdi giriş yapabilirsiniz.' });
});

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Kullanıcı adı ve şifre gerekli' });
  }
  const user = await User.findOne({ username: username.toLowerCase().trim() });
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, error: 'Geçersiz kullanıcı adı veya şifre' });
  }

  // Adminler isVerified kuralına takılmamalı (Eğer önceden eklendiyse)
  if (!user.isVerified && user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Lütfen e-posta adresinize gelen doğrulama kodunu girerek hesabınızı aktifleştirin.' });
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    return res.status(401).json({ success: false, error: 'Geçersiz kullanıcı adı veya şifre' });
  }
  const token = signToken(user);
  res.json({
    success: true,
    data: { token, user: { id: user._id, username: user.username, fullName: user.fullName, role: user.role } },
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user._id,
      username: req.user.username,
      fullName: req.user.fullName,
      role: req.user.role,
    },
  });
});
