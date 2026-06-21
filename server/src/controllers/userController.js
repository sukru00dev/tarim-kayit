import User from '../models/User.js';
import Field from '../models/Field.js';
import SeasonRecord from '../models/SeasonRecord.js';
import Asset from '../models/Asset.js';
import { asyncHandler } from '../middleware/auth.js';

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});

export const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName, role = 'farmer' } = req.body;
  if (!username || !email || !password || !fullName) {
    return res.status(400).json({ success: false, error: 'Tüm alanlar zorunlu' });
  }
  
  const existingUser = await User.findOne({ 
    $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase().trim() }] 
  });

  if (existingUser) {
    return res.status(400).json({ success: false, error: 'Bu kullanıcı adı veya e-posta zaten kullanımda.' });
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    username: username.toLowerCase().trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    fullName,
    role: role === 'admin' ? 'admin' : 'farmer',
    isVerified: true, // Admin tarafından eklendiği için anında onaylı
  });
  res.status(201).json({
    success: true,
    data: { id: user._id, username: user.username, email: user.email, fullName: user.fullName, role: user.role },
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { fullName, role, isActive, password } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
  }
  if (fullName) user.fullName = fullName;
  if (role) user.role = role === 'admin' ? 'admin' : 'farmer';
  if (typeof isActive === 'boolean') user.isActive = isActive;
  if (password) user.passwordHash = await User.hashPassword(password);
  await user.save();
  res.json({
    success: true,
    data: { id: user._id, username: user.username, fullName: user.fullName, role: user.role, isActive: user.isActive },
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
  }
  if (user._id.equals(req.user._id)) {
    return res.status(400).json({ success: false, error: 'Kendi hesabınızı silemezsiniz' });
  }
  await Field.deleteMany({ userId: user._id });
  await SeasonRecord.deleteMany({ userId: user._id });
  await Asset.deleteMany({ userId: user._id });
  await user.deleteOne();
  res.json({ success: true, message: 'Kullanıcı silindi' });
});

export const systemStats = asyncHandler(async (_req, res) => {
  const [userCount, farmerCount, fieldCount, seasonCount, totalArea] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'farmer', isActive: true }),
    Field.countDocuments(),
    SeasonRecord.countDocuments(),
    Field.aggregate([{ $group: { _id: null, total: { $sum: '$areaDecare' } } }]),
  ]);
  const latestSeasons = await SeasonRecord.find()
    .sort({ year: -1, updatedAt: -1 })
    .limit(5)
    .populate('fieldId', 'fieldName cropType')
    .populate('userId', 'fullName');
  res.json({
    success: true,
    data: {
      userCount,
      farmerCount,
      fieldCount,
      seasonCount,
      totalAreaDecare: totalArea[0]?.total || 0,
      latestSeasons,
    },
  });
});
