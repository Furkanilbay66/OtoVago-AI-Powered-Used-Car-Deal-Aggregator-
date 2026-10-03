import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import listingsRouter from './routes/listings.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'OtoVago API', timestamp: new Date().toISOString() });
});

app.use('/api', listingsRouter);

app.listen(PORT, () => {
  console.log(`\n🚗 OtoVago API sunucusu başlatıldı`);
  console.log(`   ➜  http://localhost:${PORT}/api/health`);
  console.log(`   ➜  http://localhost:${PORT}/api/models`);
  console.log(`   ➜  http://localhost:${PORT}/api/deals?model=kia-sportage\n`);
});
