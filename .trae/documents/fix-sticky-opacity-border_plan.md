# Fix Sticky Column See-through + Invisible Right Border

## Problem
1. **Sticky Employee header cell ("Employee" text) is see-through**: When you scroll horizontally, the date cells (Mar 04, Mar 05, etc.) are visible **behind** the sticky "Employee" header cell. Root cause: the sticky cell uses `bg-muted/50` — the `/50` means 50% opacity, so it's not fully opaque.
2. **Right border of the sticky column is not visible**: Even though BorderedTableHead / BorderedTableCell have generic `border-r` applied, the color is the default (too light / blending in) so you can't visually distinguish where the pinned Employee column ends and the scrolling date columns begin.

## Root Cause Analysis
- `bg-muted/50` (used in sticky header) has alpha channel transparency — it inherits the header row background but at 50% opacity, so what's drawn behind it shows through. We must use a **fully opaque color** for sticky cells.
- Generic `border-r` without an explicit width or contrast color is not visible (e.g., `#ffffff` cells + `border-border` default color is too subtle). The common pattern for pinned/sticky table columns: add both an **explicit border** + a **subtle right drop shadow** (so even if border blends, the shadow always provides visual separation).

## Files to Edit
- `/Users/nyantunnaing/Desktop/Projects/DAT intern/dat-courses-management-system/frontend/components/drawers/course/tabs/AttendanceTab.tsx`

## Specific Changes

### Step 1: Fix Sticky Header Cell ("Employee" rowSpan=2 th)
- Change `bg-muted/50` → **fully opaque `bg-background` or solid `bg-muted`**. We use `bg-background` (100% opaque, matches the overall layout background) so it never shows anything through.
- Add explicit stronger right separation:
  - Keep `border-r` (already there)
  - Add `border-r-2 border-r-border` OR better: `shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]` — a subtle right drop-shadow to visually separate the sticky column
  - `z-20` is already correct (stays above date cells)
- Final class snippet: `"sticky left-0 z-20 align-middle whitespace-nowrap font-medium bg-background border-r-2 border-r-border shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]"`

### Step 2: Fix Sticky Body Cells (Employee info row td)
- Already uses `bg-background` (opaque) — that's good. Keep it.
- But also add the same explicit right border + shadow so there's a visible line between Employee column and date columns for BODY rows too (currently the `border-r` is invisible):
  - Add: `border-r-2 border-r-border shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]`
  - Keep the rest: `sticky left-0 z-10 min-w-[180px] bg-background`

## Key Notes
- Using `bg-background` for the header might look slightly different than the original muted header (if you want to preserve the "muted" visual style of the header **but without transparency**, we can use `bg-muted` (without the `/50`), which is the 100% opaque version of the header's original `bg-muted/50` background. Option A: `bg-background` (clean, matches body sticky cell, always opaque). Option B: `bg-muted` (header retains original muted appearance, fully opaque). In this plan, we go with **`bg-muted` opaque** for header so header style stays consistent visually but doesn't let dates show through.
  - Correction: use `bg-muted` (not /50) for header sticky cell.
- `border-r-2 border-r-border` provides a visible 2px solid border (explicit color `border` from shadcn tokens).
- A light right shadow adds depth so even if the border blends with nearby colors you still see a clear visual separation line.
- This fixes both the "see-through / visible underlayer" problem AND the missing right border.

## Risk / Considerations
- No hover classes are present anymore so no bleed-through hover artifacts possible.
- Shadow + double border is safe — works on all browsers (sticky positioning works inside `overflow-x-auto` table wrappers as long as the scrolling container has `position: relative` default — which `<div className="overflow-x-auto">` already has (static positioning is fine for sticky, only needs positioned ancestor for z-index stacking context, which this has).
- Colors: `bg-muted` (for header) and `bg-background` (for body) are both shadcn standard tokens so they work in dark mode automatically, no manual dark: overrides needed.
