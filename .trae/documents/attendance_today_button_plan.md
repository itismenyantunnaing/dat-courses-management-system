# Attendance Tab - "Today" Button Scroll Implementation Plan

## 1. Repo Research Conclusion

Reviewed the current implementation in [AttendanceTab.tsx](file:///Users/nyantunnaing/Desktop/Projects/DAT%20intern/dat-courses-management-system/frontend/components/drawers/course/tabs/AttendanceTab.tsx):

**Existing Infrastructure (already present in the file):**
- `SESSION_DATES` array (line 188): 30 dynamically generated dates with `fullDate` for comparison
- `isTodaySession()` helper (lines 218-241): Compares session date to today
- `todayIndex` computed value (lines 699-701): Finds array index of today's column
- `scrollToToday()` function (lines 704-742): Contains scroll logic with sticky column offset
- `tableContainerRef` (line 573): Refs the scrollable table wrapper div
- `data-date-key` attribute on header cells (line 1003): DOM marker for column lookup
- Keyboard shortcut `Ctrl+T` handler (lines 745-770): Calls scrollToToday
- Today button UI (lines 780-800): Blue themed button with CalendarDays icon beside "Attendance Overview" heading
- Today's column visual highlight (lines 1007, 1033, 1087): `bg-blue-100/50 text-blue-600` styling

**Potential Issues in existing code:**
1. The `scrollToToday` function uses `targetTh.offsetLeft` which may not correctly account for all preceding cells' widths when calculating scroll position
2. The scroll centering math could over-scroll or under-scroll due to not accounting for the "Group" column width (second non-date column after sticky Employee)
3. Scroll calculation uses `offsetLeft` on a `th` inside a potentially multi-row header, which may report unexpected values in some browsers

## 2. Files and Modules to be Edited

**Single file edit:**
- [AttendanceTab.tsx](file:///Users/nyantunnaing/Desktop/Projects/DAT%20intern/dat-courses-management-system/frontend/components/drawers/course/tabs/AttendanceTab.tsx)

## 3. Steps for Modifications

### Step 3.1: Refine `scrollToToday` scroll position calculation
- Replace `offsetLeft`-based positioning with `getBoundingClientRect()`-based calculation for accuracy
- Account for BOTH non-date columns (sticky Employee column + Group column) when computing target scroll offset
- Ensure today's column appears fully visible, positioned just right of the pinned Employee column with optimal centering
- Formula approach:
  ```
  targetScrollLeft = 
    (todayCellLeftInViewport - containerLeftInViewport) 
    + container.scrollLeft 
    - pinnedEmployeeWidth 
    - groupColumnWidth 
    - centeringOffset
  ```

### Step 3.2: Fix the DOM query robustness
- The `th[data-date-key="${todayDateObj.key}"]` selector currently targets only the first header row (date row `th`). Ensure the lookup is robust and works with the current two-row `<TableHeader>` structure.
- If querying the date-row `th`, use its bounding rect for calculations (it's the topmost cell in the column group)

### Step 3.3: Verify button placement and UI consistency
- Confirm the "Today" button at lines 780-800 sits directly beside the "Attendance Overview" heading in the flex row
- Confirm tooltip text, `Ctrl+T` keyboard hint, and blue-50 themed styling match project conventions
- Button currently uses `CalendarDays` from lucide-react — confirm icon size, spacing, and text are visually balanced

### Step 3.4: Edge-case handling in `scrollToToday`
- **If today's date is not in SESSION_DATES** (edge case where today falls outside the generated 30-day window): already falls back to scrolling to the rightmost (newest) column — confirm this fallback works
- **If container has no horizontal overflow** (all dates visible without scrolling): gracefully no-op
- **If sticky Employee column selector misses** (`thead th.sticky.left-0` returns null): use the hardcoded fallback width of 250px as backup

### Step 3.5: Highlight animation (optional polish)
- After scrolling completes (roughly 500-800ms after smooth scroll starts), briefly pulse the today column's `bg-blue-100/50` highlight to draw visual attention
- Can be done via a transient `useState` flag (`justScrolledToToday`) that toggles an extra class, then clears after ~1.2s

## 4. Potential Dependencies or Considerations

- **No new npm dependencies**: All logic uses existing React hooks (`useRef`, `useState`, `useEffect`) and native DOM APIs
- **Tailwind classes**: Uses existing project theme classes (`bg-blue-50`, `text-blue-600`, etc.) — no new CSS required
- **shadcn/ui components**: Reuses existing `Button`, `Tooltip`, `TooltipTrigger`, `TooltipContent` already imported
- **lucide-react**: `CalendarDays` icon already imported at line 72

## 5. Risk Handling

| Risk | Mitigation |
|------|-----------|
| `getBoundingClientRect()` values change during smooth scroll animation | Calculate the static target offset ONCE at the start of `scrollToToday` using the pre-scroll geometry, then pass that static value to `scrollTo()` — don't recalculate mid-animation |
| Sticky column width mismatch between `<thead>` and `<tbody>` | Measure the actual sticky `th` width at runtime; keep 250px hardcoded fallback |
| `querySelector` fails to find today's header cell | Add guards: `if (!targetTh) { fallbackScroll(); return; }` — current code already does this |
| Ctrl+T conflicts with browser "new tab" | We already call `e.preventDefault()` — this works in most browsers when the page is focused. Document in tooltip if needed. |
| iOS Safari smooth-scroll quirks | `scroll-smooth` Tailwind class is already on the container; native smooth scroll is sufficient. No polyfill needed. |
