---
title: Macro Over-Target Red Threshold
date: 2026-03-29
status: approved
---

## Summary

Add a red color state to macro metric values in the macro bar when a macro exceeds its target by more than 10%.

## Color States

| Condition | Color | CSS Class |
|-----------|-------|-----------|
| Within ±10% of target | Green `#4caf50` | `near-target` (existing) |
| Over target by >10% | Red `#f44336` | `over-target` (new) |
| Under target by >10% | White `#ffffff` | (default, no class) |

## Changes

**File:** `public/index.html`

1. Add CSS rule alongside existing `.near-target`:
   ```css
   .macro-cell .value.over-target { color: #f44336; }
   ```

2. Update class assignment logic in `renderMacroBar()`:
   ```js
   // Before:
   Math.abs(val - target) <= target * 0.1 ? ' near-target' : ''

   // After:
   val > target * 1.1 ? ' over-target' : Math.abs(val - target) <= target * 0.1 ? ' near-target' : ''
   ```
