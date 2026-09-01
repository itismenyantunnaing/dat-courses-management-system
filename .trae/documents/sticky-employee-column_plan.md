# Sticky Employee Column for Attendance Table

## Problem
When the user scrolls horizontally in the Attendance table (because there are many date columns), the Employee column scrolls out of view, forcing the user to scroll back to see which row belongs to whom.

## Solution
Use CSS `position: sticky` with `left: 0` on the Employee column cells (both header and body), and set a solid background color + right border + z-index so they properly overlay the scrolling columns behind them.

## Root Cause Analysis
- The table is inside a horizontal scroll wrapper (`overflow-x-auto` on line 541). 
- Currently no cells have `sticky` positioning, so all columns scroll together.
- Employee is the LEFTMOST column, so `left: 0` will pin it correctly.
- The header row has a merged (rowSpan=2) Employee `<th>`. That single cell (not 2 cells) needs the sticky treatment.

## Files to Edit
- `/Users/nyantunnaing/Desktop/Projects/DAT intern/dat-courses-management-system/frontend/components/drawers/course/tabs/AttendanceTab.tsx`

## Specific Changes

### Step 1: Employee Header (TableHeader)
- The single `<BorderedTableHead>` for `Employee` (rowSpan=2) — add these classes:
  - `sticky left-0 z-20 bg-muted/50`
  - Keep existing classes.
  - The `z-20` ensures it's above regular cells AND above sticky body cells (which will be z-10).
  - The `bg-muted/50` must match the header row background so the cell isn't transparent (otherwise scrolled dates show through).
  - Optional: add a subtle right shadow or right border (already present via BorderedTableHead's `border-r`) to visually separate it.

### Step 2: Employee Body (TableBody cells)
- Each `<BorderedTableCell>` for the employee column (the `min-w-[180px]` one) — add these classes:
  - `sticky left-0 z-10 bg-background`
  - Keep the `min-w-[180px]` and existing classes.
  - `bg-background` matches the Table body's row background (or white) so scrolled content doesn't show through.
  - `z-10` keeps sticky body cells above non-sticky cells but below the sticky header (`z-20`).

### Step 3: Ensure hover row doesn't break the sticky look
- Currently TableRow has `hover:bg-muted/50`. With sticky cells having `bg-background`, the sticky Employee cell's background on hover should also adapt. Add `group-hover:bg-muted/50 hover:bg-muted/50` to the body cell, OR (cleaner) use `bg-[var(--table-bg,background)]` with a transparent overlay. To keep it simple, add `group-hover:bg-muted/50` to the sticky body cell, and add `group` to the `TableRow`.

## Considerations / Risk Handling

1. **Background color consistency**: Critical — sticky cells without solid backgrounds are broken. The header row's Employee cell uses `bg-muted/50` which matches the header row. The body cell uses `bg-background` (matches table body). Both are solid so they correctly cover the scrolling cells behind them.
2. **z-index layering**: Header sticky must be > body sticky (to cover overlapping corners when scrolling). z-20 (header) > z-10 (body) is correct.
3. **Left=0**: Since Employee is the first column, `left: 0` is correct. No extra columns before it.
4. **Width**: `min-w-[180px]` is already there; sticky positioning requires the cell to have a known width (180px min-width is sufficient).
5. **Summary column (optional)**: The user did NOT ask for the right-side Summary column to be sticky, only the Employee column. We'll leave the Summary column as non-sticky for now unless requested later.
6. **Row hover + group fix**: Adding `group` to TableRow and `group-hover:bg-muted/50` to the sticky body cell ensures the Employee cell highlights together with the rest of the row on hover, despite the sticky cell having an explicit background.
