const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const db = new Database(path.join(__dirname, 'data', 'tracker.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS logs (
    date TEXT NOT NULL,
    meal_name TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (date, meal_name)
  )
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET /api/log?date=YYYY-MM-DD
app.get('/api/log', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date required' });
  const rows = db.prepare('SELECT meal_name, count FROM logs WHERE date = ?').all(date);
  const result = {};
  for (const row of rows) result[row.meal_name] = row.count;
  res.json(result);
});

// POST /api/log  body: { date, meal_name, count }
app.post('/api/log', (req, res) => {
  const { date, meal_name, count } = req.body;
  if (!date || !meal_name || count == null) return res.status(400).json({ error: 'date, meal_name, count required' });
  db.prepare(`
    INSERT INTO logs (date, meal_name, count) VALUES (?, ?, ?)
    ON CONFLICT(date, meal_name) DO UPDATE SET count = excluded.count
  `).run(date, meal_name, count);
  res.json({ ok: true });
});

// GET /api/history — all days that have been logged
app.get('/api/history', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT date FROM logs ORDER BY date DESC').all();
  res.json(rows.map(r => r.date));
});

app.listen(PORT, () => console.log(`Food Tracker running at http://localhost:${PORT}`));
