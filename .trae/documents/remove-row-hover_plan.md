# Remove Row Hover + Fix Sticky Column Bleed-through

## Problem
Two things:
1. User wants to **remove** the `hover highlighting on table rows.
2. The row hover color is visually "bleeding through" underneath the sticky Employee column cell (visible in screenshot under Lisa Garcia row) — the sticky cell isn't properly covering the row's hover background.

## Root Cause Analysis

### A. Row hover exists currently
- `AttendanceTab.tsx` TableRow line ~587 has `hover:bg-muted/50` + `group`.
- The sticky Employee body cell has `bg-background` + `group-hover:bg-muted/50`.
- **Why it bleeds through**: Even though sticky cells have `bg-background`, a non-sticky cells' row background still shows, because:
  - Either the sticky cell's background is not fully opaque due to layering / border overlap (or) the sticky cell's body has a background. The cell's right edge's `border-r` and the underlying row's `bg-muted/50` on the adjacent cell shows behind the sticky cell's right side.
  - The simplest & most reliable fix: stop the hover **remove the hover entirely (which the user requested).

## Files to Edit
- `/Users/nyantunnaing/Desktop/Projects/DAT intern/dat-courses-management-system/frontend/components/drawers/course/tabs/AttendanceTab.tsx`

## Specific Changes

### Step 1: Remove TableRow hover
- Change `className="group transition-colors hover:bg-muted/50"` → `className="transition-colors"` (remove `group` and the hover class).
- We keep `transition-colors` can stay or be removed — harmless if kept.

### Step 2: Remove Employee body cell's group-hover
- Change: Remove `group-hover:bg-muted/50` → we don't need group hover linkage anymore, since we removed group removed.

### Step 3: Strengthen sticky cells' background + add subtle right "separator" (defense-in-depth for bleed-through)
- **Employee body cell (`sticky left-0 z-10 min-w-[180px]`):
  - Keep `bg-background` (it's opaque and a11y-wise is already there)
  - Optional: add `shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] or simpler `border-r-2 border-r-background no — actually keep current `border-r` is already enough.

## Considerations
- **Other tables in project have row highlights
  - Hover removal: The user didn't ask for it, but removing it means there are rows can look a bit less interactive. That matches the user's explicit request.
  - After hover is fully opaque + Employee header is always solid `bg-background` and z-10 is enough to cover what's behind. So removing row hover eliminates the root of the bleed-through root cause. No need for other tricky overlays.
  - The screenshot clearly shows the bleed-through is on the Lisa Garcia row. The fix is straightforward.
