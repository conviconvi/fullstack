import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import { buildCoachAdvice } from './aiService.js';

const app = express();
app.use(cors());
app.use(express.json());

const db = await initDb();

app.get('/api/health', (_, res) => {
  res.json({ ok: true });
});

app.post('/api/expenses', async (req, res) => {
  const { amount, category, notes = '', spentAt } = req.body;

  if (!amount || !category || !spentAt) {
    return res.status(400).json({ error: 'amount, category, spentAt обязательны' });
  }

  const result = await db.run(
    'INSERT INTO expenses (amount, category, notes, spentAt) VALUES (?, ?, ?, ?)',
    [Number(amount), category.trim(), notes.trim(), spentAt],
  );

  const created = await db.get('SELECT * FROM expenses WHERE id = ?', [result.lastID]);
  return res.status(201).json(created);
});

app.get('/api/expenses', async (req, res) => {
  const items = await db.all('SELECT * FROM expenses ORDER BY spentAt DESC, id DESC');
  return res.json(items);
});

app.get('/api/analytics', async (req, res) => {
  const rows = await db.all('SELECT * FROM expenses ORDER BY spentAt DESC');

  const now = new Date();
  const monthPrefix = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const monthlyRows = rows.filter((row) => row.spentAt.startsWith(monthPrefix));

  const monthlyTotal = monthlyRows.reduce((sum, row) => sum + Number(row.amount), 0);

  const byCategory = monthlyRows.reduce((acc, row) => {
    acc[row.category] = (acc[row.category] || 0) + Number(row.amount);
    return acc;
  }, {});

  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0] || null;

  const coach = await buildCoachAdvice({
    expenses: monthlyRows,
    monthlyTotal,
    byCategory,
  });

  return res.json({
    month: monthPrefix,
    monthlyTotal,
    byCategory,
    topCategory,
    transactions: monthlyRows,
    coach,
  });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`API started on http://localhost:${port}`);
});
