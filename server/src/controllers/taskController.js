import Task from '../models/Task.js';
import { asyncHandler } from '../middleware/auth.js';

export const getTasks = asyncHandler(async (req, res) => {
  const userId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user._id;
  const tasks = await Task.find({ userId }).sort({ dueDate: 1 });
  res.json({ success: true, data: tasks });
});

export const createTask = asyncHandler(async (req, res) => {
  const { title, description, dueDate } = req.body;
  const userId = req.user.role === 'admin' && req.body.userId ? req.body.userId : req.user._id;

  const task = await Task.create({
    userId,
    title,
    description,
    dueDate,
  });

  res.status(201).json({ success: true, data: task });
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, error: 'Görev bulunamadı' });
  }

  if (req.user.role !== 'admin' && !task.userId.equals(req.user._id)) {
    return res.status(403).json({ success: false, error: 'Erişim engellendi' });
  }

  const { title, description, dueDate, isCompleted } = req.body;
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (isCompleted !== undefined) task.isCompleted = isCompleted;

  await task.save();
  res.json({ success: true, data: task });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, error: 'Görev bulunamadı' });
  }

  if (req.user.role !== 'admin' && !task.userId.equals(req.user._id)) {
    return res.status(403).json({ success: false, error: 'Erişim engellendi' });
  }

  await task.deleteOne();
  res.json({ success: true, message: 'Görev silindi' });
});
