# Fix Table Overflow Plan

## Problem
The horizontal overflow is happening on the main parent containers instead of being contained only within the table scroll areas. This causes the entire page/drawer to scroll horizontally when only the wide table should scroll.

## Solution Approach
Use `overflow-x-hidden` on parent containers to block ONLY horizontal overflow propagation, while preserving natural vertical scrolling (which `overflow-hidden` would incorrectly break).

## Root Cause Analysis

### 1. dashboard-client.tsx
- **Issue (Line 478)**: `<SidebarInset className="overflow-x-auto">` — The main content container has horizontal auto-scroll enabled. When a child table (like attendance) is wide, this entire main viewport scrolls horizontally instead of the table scrolling within its own wrapper.
- **Fix**: Change to `overflow-x-hidden` — blocks horizontal overflow at this level so children with `overflow-x-auto` (the table wrappers) handle scrolling independently, while vertical scroll still works naturally.
- Additionally: wrap the inner `Tabs` area in a container with `h-full overflow-y-auto min-h-0` to ensure we still get reliable vertical page scrolling within the constrained viewport.

### 2. course-detail.tsx
- **Issue (Line 800)**: Root container is `<div className="flex flex-col gap-4">` with no width constraints. When the AttendanceTab table exceeds width, overflow bubbles up to the drawer/page causing the whole drawer to scroll horizontally.
- **Fix**: Add `w-full overflow-x-hidden min-w-0` to the root flex div, and ensure the `Tabs` / tabs content area also constrains width with `min-w-0 w-full`.

### 3. AttendanceTab.tsx
- **Current (Line 538)**: Table wrapper has `overflow-x-auto rounded-md border` — this is correct (the table itself scrolls horizontally here).
- **Clean up / solidify**: Ensure `TabsContent` (`<TabsContent value="attendance">`) has `w-full min-w-0 overflow-x-hidden` so its children (the Card/table wrapper) are the ones that get the overflow, not this level. Keep the table scroll wrapper as `w-full overflow-x-auto`.

## Files to Edit

1. `/Users/nyantunnaing/Desktop/Projects/DAT intern/dat-courses-management-system/frontend/app/dashboard/dashboard-client.tsx`
2. `/Users/nyantunnaing/Desktop/Projects/DAT intern/dat-courses-management-system/frontend/components/drawers/course/course-detail.tsx`
3. `/Users/nyantunnaing/Desktop/Projects/DAT intern/dat-courses-management-system/frontend/components/drawers/course/tabs/AttendanceTab.tsx`

## Specific Changes

### Step 1: dashboard-client.tsx
- Change `<SidebarInset>` class from `"overflow-x-auto"` → `"overflow-x-hidden"`
- Wrap the `<Tabs>` (lines 538-544) or the direct children inside `SidebarInset` below the header in a `<div className="h-[calc(100dvh-var(--header-height,4rem))] overflow-y-auto min-h-0">` (or equivalent), to keep vertical scrolling smooth for long content. The key is horizontal stays clipped, vertical stays scrollable.

### Step 2: course-detail.tsx
- Change root container: `<div className="flex flex-col gap-4">` → `<div className="flex w-full min-w-0 flex-col gap-4 overflow-x-hidden">`
- Ensure the `Tabs` (line 804) and the tab contents wrapper have `w-full min-w-0` so they respect the drawer width.

### Step 3: AttendanceTab.tsx
- Change `TabsContent` opening tag (line 448): add `w-full min-w-0 overflow-x-hidden`
- The inner table scroll wrapper (line 538) stays `w-full overflow-x-auto rounded-md border` (replacing `max-w-full` with `w-full` for clarity).

## Considerations / Risk Handling

- **Vertical scroll safety**: Using `overflow-x-hidden` (NOT `overflow-hidden`) means vertical scrolling is untouched, so long pages still work.
- **Other dashboard tabs (Employees / Courses / etc.)**: The SidebarInset change is global. Each tab's table/wide components MUST use their own `overflow-x-auto` wrapper. Since this is the standard pattern in the project (already used in AttendanceTab and others), this should work correctly. If any tab lacks a horizontal scroll wrapper on its wide table, that component may need to be patched separately.
- **Drawer width constraint**: course-detail.tsx sits inside a drawer with a fixed width; adding `overflow-x-hidden` there ensures the attendance table (which is wider than the drawer) scrolls only inside its wrapper, not the entire drawer content.
