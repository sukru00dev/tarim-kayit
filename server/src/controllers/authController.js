import User from '../models/User.js';
import { signToken, asyncHandler } from '../middleware/auth.js';

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Kullanıcı adı ve şifre gerekli' });
  }
  const user = await User.findOne({ username: username.toLowerCase().trim() });
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, error: 'Geçersiz kullanıcı adı veya şifre' });
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
