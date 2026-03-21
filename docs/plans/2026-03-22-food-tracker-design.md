# Food Tracker App — Design Doc
**Date:** 2026-03-22

## Overview

A simple web-based food tracker that lets the user increment/decrement pre-loaded meals and see real-time macro totals against daily targets. Daily logs are persisted to a SQLite database.

## Architecture

Single HTML file frontend served by a Node.js/Express backend with SQLite storage.

```
FoodTracker/
├── server.js        # Express server + SQLite API
├── public/
│   └── index.html   # Full UI (vanilla JS, no framework)
└── data/
    └── tracker.db   # SQLite database (auto-created)
```

## Backend (server.js)

- **Runtime:** Node.js with Express and better-sqlite3
- **Endpoints:**
  - `GET /api/log?date=YYYY-MM-DD` — returns meal counts for the given date
  - `POST /api/log` — upserts a `(date, meal_name, count)` record
  - `GET /api/history` — returns all logged days (for future review)
- **Database schema:**
  ```sql
  CREATE TABLE logs (
    date TEXT,
    meal_name TEXT,
    count INTEGER DEFAULT 0,
    PRIMARY KEY (date, meal_name)
  );
  ```

## Frontend (public/index.html)

- Vanilla JS, no framework, no build step
- **Macro summary bar at top:** shows current totals for Protein, Carbs, Fat, Fiber, Cals — updates in real time on every +/- tap
- **Target row:** hardcoded targets (Protein 155, Carbs 180, Fat 50, Fiber 30, Cals 1790)
- **Gap row:** target minus current, color-coded (green when met, red when over)
- **Meal sections:** Breakfast, Lunch, Dinner, Post Gym — each with + and - buttons and current count
- On load: fetches today's counts from API and restores state
- On +/-: updates local state → recalculates macros → POSTs to API

## Meal Data (hardcoded)

| Meal | Section | Protein | Carbs | Fat | Fiber | Cals |
|------|---------|---------|-------|-----|-------|------|
| Scrambled Egg with Bacon & Asparagus - RR01 | Breakfast | 26.1 | 1.6 | 27.1 | 0.9 | 355 |
| Juice | Breakfast | 2.2 | 36.5 | 0.4 | 0 | 158 |
| Meiji High Protein | Breakfast | 28.0 | 10.0 | 2.0 | 0.0 | 170 |
| Beef Tenderloin Teriyaki with Sweet Mash – B03 | Lunch | 26.5 | 36.4 | 7.5 | 5.4 | 319 |
| Meiji High Protein | Lunch | 28.0 | 10.0 | 2.0 | 0.0 | 170 |
| Beef Bolognese with Wholegrain Pasta – B04 | Dinner | 33.2 | 52.4 | 10.2 | 7.2 | 434 |
| Juice | Dinner | 2.2 | 36.5 | 0.4 | 0 | 158 |
| Peanut Butter Sandwich | Post Gym | 14.0 | 30.0 | 18.0 | 6.0 | 338 |
| Meiji High Protein | Post Gym | 28.0 | 10.0 | 2.0 | 0.0 | 170 |

## Daily Targets

| Protein | Carbs | Fat | Fiber | Cals |
|---------|-------|-----|-------|------|
| 155 | 180 | 50 | 30 | 1790 |

## Data Persistence

- Each +/- tap fires a `POST /api/log` with `{ date, meal_name, count }`
- On page load, `GET /api/log?date=today` restores all meal counts
- SQLite file lives in `data/tracker.db` (auto-created on first run)

## Running the App

```bash
npm install
node server.js
# Open http://localhost:3000
```
