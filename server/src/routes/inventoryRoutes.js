import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getInventory,
  createItem,
  updateItem,
  deleteItem,
} from '../controllers/inventoryController.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(getInventory)
  .post(createItem);

router.route('/:id')
  .put(updateItem)
  .delete(deleteItem);

export default router;
