# Food Tracker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a single-page web food tracker with pre-loaded meals, +/- counters, real-time macro totals vs targets, and SQLite-backed daily log persistence.

**Architecture:** Node.js/Express serves a single `index.html` and two REST endpoints. SQLite stores one row per `(date, meal_name)` with a count. The frontend is vanilla JS — no framework, no build step.

**Tech Stack:** Node.js, Express 4, better-sqlite3, vanilla HTML/CSS/JS

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `server.js`
- Create: `public/index.html`
- Create: `data/` (directory, gitkeep)
- Create: `.gitignore`

**Step 1: Initialize npm project**

```bash
cd /Users/rparame/CursorWorkspaces/FoodTracker
npm init -y
```

Expected: `package.json` created with default values.

**Step 2: Install dependencies**

```bash
npm install express better-sqlite3
```

Expected: `node_modules/` created, `package.json` updated with dependencies.

**Step 3: Create .gitignore**

```
node_modules/
data/*.db
```

**Step 4: Create the data directory placeholder**

```bash
mkdir -p data public
touch data/.gitkeep
```

**Step 5: Commit**

```bash
git init
git add package.json package-lock.json .gitignore data/.gitkeep
git commit -m "chore: init project with dependencies"
```

---

### Task 2: Backend — Express Server + SQLite API

**Files:**
- Create: `server.js`

**Step 1: Write server.js**

```js
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
```

**Step 2: Verify server starts**

```bash
node server.js
```

Expected: `Food Tracker running at http://localhost:3000`

Stop with Ctrl+C.

**Step 3: Test API manually**

```bash
# In a second terminal while server is running:
curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-03-22","meal_name":"Juice","count":1}'

curl "http://localhost:3000/api/log?date=2026-03-22"
```

Expected first call: `{"ok":true}`
Expected second call: `{"Juice":1}`

**Step 4: Commit**

```bash
git add server.js
git commit -m "feat: add express server with SQLite log API"
```

---

### Task 3: Frontend — HTML Structure + Meal Data

**Files:**
- Create: `public/index.html`

**Step 1: Write the full index.html**

This is the complete file. Write it exactly as shown.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Food Tracker</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #222; }

    /* Macro Summary */
    #macro-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #1a1a2e;
      color: white;
      padding: 12px 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    #macro-bar h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; opacity: 0.7; }
    .macro-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 6px;
    }
    .macro-cell { text-align: center; }
    .macro-cell .label { font-size: 10px; text-transform: uppercase; opacity: 0.6; }
    .macro-cell .value { font-size: 18px; font-weight: 700; }
    .macro-cell .target { font-size: 10px; opacity: 0.5; }
    .macro-cell .gap { font-size: 12px; font-weight: 600; margin-top: 2px; }
    .gap-ok { color: #4ade80; }
    .gap-over { color: #f87171; }
    .gap-neutral { color: #94a3b8; }

    /* Date bar */
    #date-bar {
      background: #16213e;
      color: #94a3b8;
      padding: 8px 16px;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #date-bar button {
      background: none;
      border: 1px solid #334155;
      color: #94a3b8;
      padding: 3px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    #date-bar button:hover { background: #334155; }

    /* Meal sections */
    .section { margin: 12px; }
    .section-header {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #64748b;
      padding: 6px 4px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 6px;
    }
    .meal-card {
      background: white;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .meal-info { flex: 1; }
    .meal-name { font-size: 14px; font-weight: 600; margin-bottom: 3px; }
    .meal-macros { font-size: 11px; color: #64748b; }
    .meal-controls { display: flex; align-items: center; gap: 8px; }
    .meal-controls button {
      width: 32px; height: 32px;
      border-radius: 50%;
      border: none;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.1s;
    }
    .btn-minus { background: #fee2e2; color: #dc2626; }
    .btn-plus  { background: #dcfce7; color: #16a34a; }
    .meal-controls button:active { transform: scale(0.9); }
    .meal-controls button:disabled { opacity: 0.3; cursor: not-allowed; }
    .meal-count { font-size: 18px; font-weight: 700; min-width: 24px; text-align: center; }

    /* History modal */
    #history-btn {
      position: fixed;
      bottom: 20px; right: 20px;
      background: #1a1a2e;
      color: white;
      border: none;
      border-radius: 50%;
      width: 48px; height: 48px;
      font-size: 20px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    #history-overlay {
      display: none;
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 200;
    }
    #history-overlay.open { display: flex; align-items: flex-end; }
    #history-panel {
      background: white;
      width: 100%;
      max-height: 70vh;
      border-radius: 16px 16px 0 0;
      padding: 20px;
      overflow-y: auto;
    }
    #history-panel h3 { margin-bottom: 16px; }
    .history-day { padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
    .history-day-date { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    .history-day-macros { font-size: 12px; color: #64748b; }
  </style>
</head>
<body>

<!-- Macro summary sticky bar -->
<div id="macro-bar">
  <h2>Daily Macros</h2>
  <div class="macro-grid" id="macro-grid">
    <!-- filled by JS -->
  </div>
</div>

<!-- Date navigation -->
<div id="date-bar">
  <button id="prev-day">&#8592;</button>
  <span id="current-date-label"></span>
  <button id="next-day">&#8594;</button>
</div>

<!-- Meals -->
<div id="meals-container"></div>

<!-- History button -->
<button id="history-btn" title="View history">&#128203;</button>

<!-- History overlay -->
<div id="history-overlay">
  <div id="history-panel">
    <h3>Log History</h3>
    <div id="history-list">Loading...</div>
    <button onclick="closeHistory()" style="margin-top:16px;padding:10px 20px;border:none;background:#1a1a2e;color:white;border-radius:8px;cursor:pointer;">Close</button>
  </div>
</div>

<script>
// ─── MEAL DATA ───────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    name: 'Breakfast',
    meals: [
      { id: 'scrambled-egg-rr01', name: 'Scrambled Egg with Bacon & Asparagus - RR01', protein: 26.1, carbs: 1.6, fat: 27.1, fiber: 0.9, cals: 355 },
      { id: 'juice-breakfast', name: 'Juice', protein: 2.2, carbs: 36.5, fat: 0.4, fiber: 0, cals: 158 },
      { id: 'meiji-breakfast', name: 'Meiji High Protein', protein: 28.0, carbs: 10.0, fat: 2.0, fiber: 0.0, cals: 170 },
    ]
  },
  {
    name: 'Lunch',
    meals: [
      { id: 'beef-tenderloin-b03', name: 'Beef Tenderloin Teriyaki with Sweet Mash – B03', protein: 26.5, carbs: 36.4, fat: 7.5, fiber: 5.4, cals: 319 },
      { id: 'meiji-lunch', name: 'Meiji High Protein', protein: 28.0, carbs: 10.0, fat: 2.0, fiber: 0.0, cals: 170 },
    ]
  },
  {
    name: 'Dinner',
    meals: [
      { id: 'beef-bolognese-b04', name: 'Beef Bolognese with Wholegrain Pasta – B04', protein: 33.2, carbs: 52.4, fat: 10.2, fiber: 7.2, cals: 434 },
      { id: 'juice-dinner', name: 'Juice', protein: 2.2, carbs: 36.5, fat: 0.4, fiber: 0, cals: 158 },
    ]
  },
  {
    name: 'Post Gym',
    meals: [
      { id: 'peanut-butter-sandwich', name: 'Peanut Butter Sandwich', protein: 14.0, carbs: 30.0, fat: 18.0, fiber: 6.0, cals: 338 },
      { id: 'meiji-postgym', name: 'Meiji High Protein', protein: 28.0, carbs: 10.0, fat: 2.0, fiber: 0.0, cals: 170 },
    ]
  },
];

const TARGETS = { protein: 155, carbs: 180, fat: 50, fiber: 30, cals: 1790 };

// ─── STATE ───────────────────────────────────────────────────────────────────
let counts = {};   // { mealId: number }
let currentDate = todayStr();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function allMeals() {
  return SECTIONS.flatMap(s => s.meals);
}

// ─── MACROS ──────────────────────────────────────────────────────────────────
function computeTotals() {
  const totals = { protein: 0, carbs: 0, fat: 0, fiber: 0, cals: 0 };
  for (const meal of allMeals()) {
    const n = counts[meal.id] || 0;
    totals.protein += meal.protein * n;
    totals.carbs   += meal.carbs * n;
    totals.fat     += meal.fat * n;
    totals.fiber   += meal.fiber * n;
    totals.cals    += meal.cals * n;
  }
  return totals;
}

function renderMacroBar() {
  const t = computeTotals();
  const keys = ['protein', 'carbs', 'fat', 'fiber', 'cals'];
  const labels = ['Protein', 'Carbs', 'Fat', 'Fiber', 'Cals'];
  const grid = document.getElementById('macro-grid');
  grid.innerHTML = keys.map((k, i) => {
    const val = Math.round(t[k] * 10) / 10;
    const target = TARGETS[k];
    const gap = Math.round((target - val) * 10) / 10;
    const gapClass = gap < 0 ? 'gap-over' : gap === 0 ? 'gap-ok' : 'gap-neutral';
    const gapLabel = gap > 0 ? `↑${gap}` : gap < 0 ? `↓${Math.abs(gap)}` : '✓';
    return `
      <div class="macro-cell">
        <div class="label">${labels[i]}</div>
        <div class="value">${val}</div>
        <div class="target">/ ${target}</div>
        <div class="gap ${gapClass}">${gapLabel}</div>
      </div>`;
  }).join('');
}

// ─── MEAL CARDS ──────────────────────────────────────────────────────────────
function renderMeals() {
  const container = document.getElementById('meals-container');
  container.innerHTML = SECTIONS.map(section => `
    <div class="section">
      <div class="section-header">${section.name}</div>
      ${section.meals.map(meal => renderMealCard(meal)).join('')}
    </div>
  `).join('');
}

function renderMealCard(meal) {
  const count = counts[meal.id] || 0;
  return `
    <div class="meal-card" id="card-${meal.id}">
      <div class="meal-info">
        <div class="meal-name">${meal.name}</div>
        <div class="meal-macros">P ${meal.protein}g · C ${meal.carbs}g · F ${meal.fat}g · Fb ${meal.fiber}g · ${meal.cals} kcal</div>
      </div>
      <div class="meal-controls">
        <button class="btn-minus" onclick="changeCount('${meal.id}', -1)" ${count === 0 ? 'disabled' : ''}>−</button>
        <span class="meal-count">${count}</span>
        <button class="btn-plus" onclick="changeCount('${meal.id}', 1)">+</button>
      </div>
    </div>`;
}

function updateMealCard(mealId) {
  const meal = allMeals().find(m => m.id === mealId);
  const card = document.getElementById('card-' + mealId);
  if (!card || !meal) return;
  const count = counts[mealId] || 0;
  card.querySelector('.meal-count').textContent = count;
  card.querySelector('.btn-minus').disabled = count === 0;
}

// ─── INTERACTIONS ────────────────────────────────────────────────────────────
function changeCount(mealId, delta) {
  const current = counts[mealId] || 0;
  const next = Math.max(0, current + delta);
  counts[mealId] = next;
  updateMealCard(mealId);
  renderMacroBar();
  saveCount(mealId, next);
}

// ─── API ─────────────────────────────────────────────────────────────────────
async function loadDay(date) {
  try {
    const res = await fetch(`/api/log?date=${date}`);
    const data = await res.json();
    counts = {};
    for (const meal of allMeals()) {
      counts[meal.id] = data[meal.id] || 0;
    }
  } catch (e) {
    console.error('Failed to load day', e);
    counts = {};
  }
}

async function saveCount(mealId, count) {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: currentDate, meal_name: mealId, count })
    });
  } catch (e) {
    console.error('Failed to save', e);
  }
}

// ─── DATE NAV ────────────────────────────────────────────────────────────────
function offsetDate(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr) {
  const today = todayStr();
  if (dateStr === today) return 'Today — ' + dateStr;
  if (dateStr === offsetDate(today, -1)) return 'Yesterday — ' + dateStr;
  return dateStr;
}

async function navigateToDate(date) {
  currentDate = date;
  document.getElementById('current-date-label').textContent = formatDateLabel(date);
  document.getElementById('next-day').disabled = date === todayStr();
  await loadDay(date);
  renderMeals();
  renderMacroBar();
}

// ─── HISTORY ─────────────────────────────────────────────────────────────────
async function openHistory() {
  document.getElementById('history-overlay').classList.add('open');
  const list = document.getElementById('history-list');
  try {
    const daysRes = await fetch('/api/history');
    const days = await daysRes.json();
    if (!days.length) { list.innerHTML = '<p>No history yet.</p>'; return; }

    const rows = await Promise.all(days.map(async date => {
      const res = await fetch(`/api/log?date=${date}`);
      const data = await res.json();
      let protein = 0, carbs = 0, fat = 0, fiber = 0, cals = 0;
      for (const meal of allMeals()) {
        const n = data[meal.id] || 0;
        protein += meal.protein * n;
        carbs   += meal.carbs * n;
        fat     += meal.fat * n;
        fiber   += meal.fiber * n;
        cals    += meal.cals * n;
      }
      return { date, protein, carbs, fat, fiber, cals };
    }));

    list.innerHTML = rows.map(r => `
      <div class="history-day">
        <div class="history-day-date">${r.date}</div>
        <div class="history-day-macros">
          P ${r.protein.toFixed(1)}g · C ${r.carbs.toFixed(1)}g · F ${r.fat.toFixed(1)}g · Fb ${r.fiber.toFixed(1)}g · ${Math.round(r.cals)} kcal
        </div>
      </div>`).join('');
  } catch (e) {
    list.innerHTML = '<p>Error loading history.</p>';
  }
}

function closeHistory() {
  document.getElementById('history-overlay').classList.remove('open');
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.getElementById('prev-day').addEventListener('click', () => navigateToDate(offsetDate(currentDate, -1)));
document.getElementById('next-day').addEventListener('click', () => navigateToDate(offsetDate(currentDate, 1)));
document.getElementById('history-btn').addEventListener('click', openHistory);
document.getElementById('history-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeHistory(); });

navigateToDate(currentDate);
</script>
</body>
</html>
```

**Step 2: Verify the app works end-to-end**

Start the server:
```bash
node server.js
```

Open `http://localhost:3000` in a browser. Verify:
- Macro bar shows at top with 0s for all values
- All 4 meal sections render with correct names and macros
- Tapping + increases count and updates macro bar in real time
- Tapping − decreases count, disabled at 0
- Refreshing the page restores counts (from SQLite via API)
- Date nav arrows work
- History button shows a bottom sheet with past days

**Step 3: Commit**

```bash
git add public/index.html
git commit -m "feat: add full frontend with real-time macro tracking"
```

---

### Task 4: Final Polish + Run Instructions

**Files:**
- Create: `README.md` (minimal)

**Step 1: Write README**

```markdown
# Food Tracker

A personal food tracker with pre-loaded meals, real-time macro tracking, and daily history.

## Run

```bash
npm install
node server.js
```

Open http://localhost:3000

## Data

Saved to `data/tracker.db` (SQLite). Back this file up to preserve history.
```

**Step 2: Final commit**

```bash
git add README.md
git commit -m "docs: add README with run instructions"
```

---

## Done

App runs at `http://localhost:3000`. All meal data is hardcoded from the March 2026 macro spreadsheet. Daily counts persist to SQLite. History is accessible via the clipboard button.
