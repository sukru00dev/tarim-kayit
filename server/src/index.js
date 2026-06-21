import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import connectDB from './config/db.js';
import swaggerSpec from './config/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import fieldRoutes from './routes/fieldRoutes.js';
import seasonRoutes from './routes/seasonRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import benchmarkRoutes from './routes/benchmarkRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API çalışıyor', timestamp: new Date().toISOString() });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/seasons', seasonRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/benchmarks', benchmarkRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/inventory', inventoryRoutes);

app.use(errorHandler);

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  // Serve frontend static files
  app.use(express.static(path.join(__dirname, '../../client/dist')));

  // Catch-all to serve index.html for React Router
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
    console.log(`Swagger UI: http://localhost:${PORT}/api/docs`);
  });
}

start().catch((err) => {
  console.error('Sunucu başlatılamadı:', err);
  process.exit(1);
});
