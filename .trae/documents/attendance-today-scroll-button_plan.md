# Add "Today" Scroll-to-Column Button

## Problem
User wants to add a "Today" button next to the "Attendance Overview" heading. When clicked, the horizontally scrolling Attendance table should automatically scroll horizontally so that today's date column comes into view and is clearly visible.

## Files to Edit
Only one file:
- `/Users/nyantunnaing/Desktop/Projects/DAT intern/dat-courses-management-system/frontend/components/drawers/course/tabs/AttendanceTab.tsx`

## Repo Research Summary (from prior edits)
- Attendance table wrapper: the horizontal scrolling container is the `div` with `className="w-full overflow-x-auto rounded-md border"` (we added `w-full overflow-x-auto` previously, lines ~541) — this is the scrollable element that will be the target of `.scrollTo()`.
- Attendance date columns are dynamically generated via `dateRange.map((date) => ...)`.
- Date state is already normalized using `normalizeDate` — we can compare today's date against the columns using the same `dateKey` (YYYY-MM-DD).
- We already have `formatDate` & `dateKeyOf` utilities used throughout this file.
- shadcn `Button` component is used throughout (already imported, so no new imports needed for Button). Button variant `"secondary"` or `"outline"` will visually fit next to heading/badge.
- Header cell and body cells are rendered in `dateRange.map` with `key={dateKey}`. We add a `ref` or stable `data-date-key={dateKey}` attribute so we can find the column by DOM query selector.

## Specific Implementation Steps

### Step 1: Add a ref for the horizontal scroll wrapper
Inside `AttendanceTab` component top (near the other hooks):
```tsx
const tableScrollRef = React.useRef<HTMLDivElement | null>(null);
```
Assign this ref to the `<div>` that holds className `"w-full overflow-x-auto rounded-md border"` (the outer overflow scroll wrapper div, currently line ~541 / the div that wraps `<Table>` inside it).

### Step 2: Add a way to find today's column cell
For each date column `<th>` header cell (top date cell, the one that shows `Mar 01` etc.), add a data attribute:
```tsx
<BorderedTableHead
  ...
  data-date-key={dateKey}
>
```
(We only need one identifiable element per date. The header `<th>` is perfect because it's rendered once per date in the same `dateRange` loop.)

### Step 3: Create a helper `handleScrollToToday`
Add this function inside the component (before return):
```tsx
const scrollToToday = () => {
  const wrapper = tableScrollRef.current;
  if (!wrapper) return;
  const todayKey = dateKeyOf(new Date());
  const targetTh = wrapper.querySelector<HTMLTableCellElement>(`th[data-date-key="${todayKey}"]`);
  if (targetTh) {
    const targetLeft = targetTh.offsetLeft;
    // Optional: add padding so today column doesn't flush to left edge
    const padding = 80; // account for sticky Employee col width + small buffer
    wrapper.scrollTo({
      left: Math.max(0, targetLeft - padding),
      behavior: "smooth",
    });
  } else {
    // Optional UX: if today not in range, scroll to the END (newest / rightmost)
    wrapper.scrollTo({ left: wrapper.scrollWidth, behavior: "smooth" });
  }
};
```
Why `targetLeft - padding`: we have a **sticky Employee column pinned on left** (~180px wide), so without subtracting padding, the today column would scroll **under** the pinned column and we wouldn't see it. Subtracting padding (≈ sticky Employee column width +  buffer) makes today's column appear to the right of the sticky Employee column.

### Step 4: Render the "Today" button next to "Attendance Overview" heading
Current heading row layout: `<h3 className="text-lg font-semibold">Attendance Overview</h3> <span className="rounded-full bg-primary/10 px-2 py-1 text-xs">10 Learners</span>`.
Wrap them in a flex box, append the Today button:
```tsx
<div className="flex flex-wrap items-center gap-3">
  <h3 className="text-lg font-semibold">Attendance Overview</h3>
  <Badge variant="secondary">10 Learners</Badge>
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={scrollToToday}
  >
    <Calendar className="mr-2 h-3.5 w-3.5" />
    Today
  </Button>
</div>
```
(We can use existing `CalendarDays` or `Calendar` icon if already imported — OR skip icon if not. Icon is nice-to-have. Check existing imports in the file; if CalendarDays already imported, use it. Otherwise we'll import from lucide-react.)

### Step 5: Edge-case fallback (today not in dateRange)
If today is not present in the generated columns (e.g., attendance data starts Mar 01 and today is Sep 01), scroll to the **rightmost** column (most recent date) and show a subtle indicator (optional, but the scrollTo fallback in step 3 handles it silently). The UX still "does something predictable" instead of doing nothing.

## Potential Dependencies / Considerations
- `lucide-react` CalendarDays/Calendar icon: check imports at the top of AttendanceTab.tsx. If not there, import `CalendarDays` (already a widely used icon elsewhere in this project — lucide-react is the project icon library per repo conventions).
- No state/props changes needed to other components. This is a self-contained change inside AttendanceTab.
- SSR: All operations happen in `onClick` so it's client-side only, which Next.js 14+ supports in client components (this tab is already a client drawer tab).

## Risk Handling
- `scrollTo` with smooth behavior falls back to instant on very old browsers automatically.
- Offset padding calculation for sticky column: we approximate padding `80` as a safe minimum buffer. If needed, we can dynamically get Employee column width using the first body sticky cell's `getBoundingClientRect().width` for perfect accuracy (upgrade option if simple padding isn't pixel perfect). The plan uses 80; during implementation we can optionally compute dynamic width for perfect accuracy.
- If `dateKeyOf` util doesn't exist (unlikely — check if in scope): use `date.toISOString().slice(0,10)`. But per previous editing session, dateKeyOf is used, so no issue.

## Verification Steps
1. Build/typecheck passes (`npm run typecheck` or `npx tsc --noEmit`).
2. Open course drawer → Attendance tab.
3. Click the Today button → the horizontal table scrolls smoothly so that today's date column is visible, positioned just to the right of the sticky Employee column.
4. Scrolling manually to left, clicking Today again should consistently scroll back to today.
5. If today date is absent in current date range → scrolls to rightmost column instead of doing nothing (acceptable graceful fallback).
