# Macro Over-Target Red Threshold Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn macro value text red when the logged value exceeds the target by more than 10%.

**Architecture:** Single-file HTML app — add one CSS rule and update one JS ternary in `renderMacroBar()`. No test framework exists; verify visually via browser.

**Tech Stack:** Vanilla HTML/CSS/JS, single file at `public/index.html`

---

### Task 1: Add CSS rule for over-target state

**Files:**
- Modify: `public/index.html:35`

**Step 1: Add the CSS rule on line 36 (after the existing `.near-target` rule)**

Current line 35:
```css
.macro-cell .value.near-target { color: #4caf50; }
```

Insert after it:
```css
.macro-cell .value.over-target { color: #f44336; }
```

---

### Task 2: Update JS threshold logic in renderMacroBar()

**Files:**
- Modify: `public/index.html:326`

**Step 1: Update the class assignment ternary**

Current (line 326):
```js
<div class="inline-val"><span class="value${Math.abs(val - target) <= target * 0.1 ? ' near-target' : ''}">${displayVal}</span>
```

Replace with:
```js
<div class="inline-val"><span class="value${val > target * 1.1 ? ' over-target' : Math.abs(val - target) <= target * 0.1 ? ' near-target' : ''}">${displayVal}</span>
```

---

### Task 3: Commit and push to master

**Step 1: Stage and commit**

```bash
git add public/index.html docs/plans/2026-03-29-macro-red-threshold-design.md docs/plans/2026-03-29-macro-red-threshold-plan.md
git commit -m "feat: turn macro value red when over target by more than 10%"
```

**Step 2: Push to master**

```bash
git push origin HEAD:master
```
