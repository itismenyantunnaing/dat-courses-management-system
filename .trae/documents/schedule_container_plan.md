# Schedule Container (Week-View Calendar) Implementation Plan

## 1. Repo Research Conclusion

Target file: [schedule-container.tsx](file:///Users/nyantunnaing/Desktop/Projects/DAT%20intern/dat-courses-management-system/frontend/components/schedule-container.tsx) — **currently empty**. Must be built from scratch.

### Existing codebase patterns & constraints (from project memory + similar containers):

**Design system conventions:**
- Canonical icon system: `HugeiconsIcon` from `@hugeicons/react` + icon-name `XxxIcon` from `@hugeicons/core-free-icons`. `strokeWidth={2}`, `className="h-4 w-4"`. **No lucide-react icons** (not a dep, caused TS error earlier in AttendanceTab).
- Search inputs use `InputGroup` / `InputGroupInput` / `InputGroupAddon` from `@/components/ui/input-group`, with `Kbd` shortcut hint on the right addon.
- Container patterns: `"use client"` directive, exported as a **named function component** (not default), typed props interface, `STROKE_WIDTH = 2` constant, `useState`/`useMemo`/`useEffect`/`useRef` imports.
- shadcn/ui components available & in use: `CardContent` (for the container body section), `Button`, `Tabs`/`TabsList`/`TabsTrigger` (for category + view toggle), `Empty`/`EmptyHeader`/`EmptyMedia`/`EmptyTitle`/`EmptyDescription`, `Tooltip`/`TooltipTrigger`/`TooltipContent`, `DropdownMenu*` family (for Filter + More-options menus), `Badge` (optional for session category chips).

**Data model:**
- The project already defines `CourseSession` in [types/course.ts](file:///Users/nyantunnaing/Desktop/Projects/DAT%20intern/dat-courses-management-system/frontend/types/course.ts#L140-L159) with fields: `id`, `courseId`, `sessionNo`, `date: Date`, `startTime?: string` (e.g. `"09:00"`), `endTime?: string` (e.g. `"11:00"`), `status?`, `courseType?`.
- `BackendSessionDto` already uses `"HH:MM"` string convention for `start_time` / `end_time` and includes `session_no` — perfect match for the dummy data we need.

### Layout required (from reference image):

```
┌───────────────────────────────────────────────────────────────────────────┐
│ CardHeader                                                                │
│  ├─ Left: Title "Schedule" + subtitle / description text                │
│  ├─ Tabs (All Sessions · Trainer · Self-Study · Exams)  ← category tabs │
│  └─ Right: [Search ⌕ Ctrl+K]  [Filter ▾]  [⋯]  [＋ New Session]         │
├───────────────────────────────────────────────────────────────────────────┤
│ CardHeader 2 (navigation bar)                                            │
│  ├─ Left:  ◀  ▶   "September 2026"   [Today]                            │
│  └─ Right: [Day] [Week] [Month]   •   "1 Sep - 7 Sep 2026"              │
├───────────────────────────────────────────────────────────────────────────┤
│ CardContent — Week grid                                                  │
│  ┌──────┬──────────┬──────────┬──────────┬──────────┬──────────┬─────────┐
│  │ Time │ Mon 1    │ Tue 2    │ Wed 3    │ Thu 4    │ Fri 5    │ Sat 6 … │ ← sticky header row
│  │ 8:00 │          │ ▓▓▓▓▓▓▓▓ │          │          │          │         │
│  │ 9:00 │ ▓▓▓▓▓    │ Session  │ ▓▓▓▓▓▓▓▓ │          │ ▓▓▓▓▓▓   │         │
│  │10:00 │ Session  │ 3        │ Session  │ ▓▓▓▓▓▓▓▓ │ Session  │ ……      │   ← colored event cards
│  │11:00 │ 1        │ (9-11am) │ 4        │ Session  │ 5        │         │   with session name + time
│  │ …    │          │          │          │ 6        │          │         │
│  └──────┴──────────┴──────────┴──────────┴──────────┴──────────┴─────────┘
│    ▲                                                                       │
│    └── sticky left time-gutter column                                      │
└───────────────────────────────────────────────────────────────────────────┘
```

Color variants: Match the image's pastel palette — 4 color themes for different session course types (Trainer/Self-Study/Exam/Makeup):
- **Purple/lilac** (`bg-purple-100/80 text-purple-700 border-purple-200` + subtle gradient)
- **Blue/sky** (`bg-sky-100/80 text-sky-700 border-sky-200`)
- **Mint/green** (`bg-emerald-100/80 text-emerald-700 border-emerald-200`)
- **Pink/rose** (`bg-rose-100/80 text-rose-700 border-rose-200`)

## 2. Files and Modules to be Edited

**Single file (empty → fill in):**
- [schedule-container.tsx](file:///Users/nyantunnaing/Desktop/Projects/DAT%20intern/dat-courses-management-system/frontend/components/schedule-container.tsx)

No new types file needed — reuse `CourseSession` from `@/types/course`.

## 3. Steps for Modifications

### Step 3.1: Imports and "use client" directive
- Add `"use client"` at top
- Import React hooks: `useState`, `useMemo`, `useRef`, `useEffect`
- Import shadcn/ui components following [courses-container.tsx](file:///Users/nyantunnaing/Desktop/Projects/DAT%20intern/dat-courses-management-system/frontend/components/courses-container.tsx) patterns:
  - `CardContent`, `CardHeader` (no `Card` — existing containers skip the outer `<Card>` wrapper)
  - `Button`, `Badge`, `Tabs`/`TabsList`/`TabsTrigger`
  - `Empty`/`EmptyHeader`/`EmptyMedia`/`EmptyTitle`/`EmptyDescription`
  - `InputGroup`/`InputGroupAddon`/`InputGroupInput`
  - `Kbd`
  - `Tooltip`/`TooltipTrigger`/`TooltipContent`
  - `DropdownMenu*` (for Filter + More options; use `DropdownMenuCheckboxItem` with filter submenus per project conventions)
- Import `HugeiconsIcon` + icon set: `Search01Icon`, `Calendar01Icon`, `ArrowLeft01Icon`, `ArrowRight01Icon`, `FilterMailIcon`, `MoreHorizontalIcon`, `Plus01Icon`, `UserGroupIcon` (for Empty state)
- Import `cn` from `@/lib/utils`
- Import `CourseSession` from `@/types/course` (for TypeScript shape of sessions)

### Step 3.2: Type interfaces & helper constants

1. `ScheduleContainerProps`:
   - `userRole?: string` (optional, matching other containers)
2. `ScheduleSession` — extend `CourseSession` display-only fields (won't modify `@/types/course`, just a local intersection):
   - `id: string`
   - `title: string` — e.g. `"Session 1: Hiragana Basics"` — synthesized from `sessionNo`
   - `courseTitle?: string` (optional course context)
   - `courseType?: "trainer" | "self_study" | "exam" | "makeup"` (for color theme)
   - `date: Date`
   - `startTime: string` (HH:MM 24h)
   - `endTime: string` (HH:MM 24h)
   - `instructor?: string`
3. **Time grid constants:**
   - `HOUR_START = 8` (8 AM)
   - `HOUR_END = 18` (6 PM, 10 rows)
   - `HOUR_HEIGHT_PX = 64` (each hour row is 64px tall, so 30-min sessions are 32px)
4. **Color theme map** (courseType → Tailwind classes for event card bg, text, border, top-accent-bar).

### Step 3.3: Dummy session data generator
- Build a `generateDummySessions(): ScheduleSession[]` function
- Generate ~12–16 sessions spread across a **7-day week starting Monday of the current week** (use date math: `const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))`)
- Each session:
  - `sessionNo` 1–30
  - `title`: `"Session ${sessionNo}: ${topic}"` (use a list of real-sounding topics: "Hiragana Basics", "Katakana & Vocabulary", "Verb Conjugation I", "JLPT N4 Grammar", "Listening Practice", "Kanji Writing", etc.)
  - Pseudo-random but deterministic start/end times in 30-min increments (30–180 min durations)
  - Spread across different days 0–6 and times 8:00–17:00
  - Assign `courseType` deterministically to exercise all 4 color themes
  - Include a "today" session to highlight
- Export locally as `DUMMY_SCHEDULE_SESSIONS`

### Step 3.4: Week / date math utilities
- `getWeekDates(baseDate: Date): Date[]` — returns 7 dates, Monday–Sunday
- `startOfDay`, `isSameDay` small helpers (no `date-fns` import to keep light; inline math OK)
- `formatDateHeader(date: Date): { dowShort: string; dayNum: string; monthShort: string }`
- `formatRangeLabel(dates: Date[]): string` — like `"1 Sep - 7 Sep 2026"`
- `timeToMinutes("HH:MM"): number` — converts time string to minutes since HOUR_START for grid positioning
- `minutesToHeight(minutes: number): number` — `minutes * (HOUR_HEIGHT_PX / 60)`

### Step 3.5: Header (section 1 — title + category tabs + action bar)
Render pattern (matches [courses-container.tsx](file:///Users/nyantunnaing/Desktop/Projects/DAT%20intern/dat-courses-management-system/frontend/components/courses-container.tsx) + AttendanceTab header):

```
<CardHeader className="px-0">
  <div className="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <HugeiconsIcon icon={Calendar01Icon} /> Schedule
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Stay organized and on track with your personalized learning schedule</p>
      <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="mt-4">
        <TabsList>
          <TabsTrigger value="all">All Sessions</TabsTrigger>
          <TabsTrigger value="trainer">Trainer Courses</TabsTrigger>
          <TabsTrigger value="self_study">Self-Study</TabsTrigger>
          <TabsTrigger value="exam">Exams</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
    <div className="flex items-center gap-2">
      <InputGroup> <InputGroupInput placeholder="Search sessions..." /> + Search icon addon + Kbd Ctrl+K </InputGroup>
      <DropdownMenu for Filter with submenus (Course type, Day, Status)>
      <Tooltip-wrapped Button variant="outline" size="icon"> <HugeiconsIcon MoreHorizontal/> </Tooltip>
      <Button className="bg-primary"> <HugeiconsIcon Plus01/> New Session </Button>
    </div>
  </div>
</CardHeader>
```

### Step 3.6: Navigation bar (section 2 — week nav + view toggle)
Second `CardHeader` or div within:
- Prev/Next week buttons (increment/decrement `weekOffset` state)
- `"Month Year"` label (e.g., "September 2026")
- `[Today]` button (reset `weekOffset = 0` → jumps to current week; styled like AttendanceTab today button)
- View toggle: `TabsList` with `Day` / `Week` / `Month` (only Week actually renders content for now; Day/Month can be disabled placeholders with Tooltip "Coming soon")
- Date range badge on right: `"Mon 1 – Sun 7 Sep 2026"`

### Step 3.7: Week grid + event cards rendering (section 3, core)

This is the biggest part. Structure in `<CardContent className="px-0 pt-4">`:

```
<div className="overflow-hidden rounded-md border bg-background">
  <div className="grid">
    <!-- Header row (sticky top) -->
    <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] border-b bg-muted/40">
      <div className="sticky left-0 z-20 h-16 border-r bg-muted/60 px-2 flex items-end justify-start text-xs text-muted-foreground">Local Time</div>
      {weekDates.map(d => <DayHeaderCell date={d} isToday={isSameDay(d, today)}/>)}
    </div>

    <!-- Scrollable grid body -->
    <div className="relative max-h-[620px] overflow-y-auto overflow-x-hidden">
      <!-- Hour rows (absolutely positioned hour labels + horizontal grid lines) -->
      {hours.map(h => (
        <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))]" style={{ height: HOUR_HEIGHT_PX }}>
          <div className="sticky left-0 z-10 -mt-2 border-r bg-background px-2 pt-0 text-xs font-medium text-muted-foreground">
            {formatHourLabel(h)}
          </div>
          {[0..6].map(d => <div className="border-b border-r h-full"/>)}
        </div>
      ))}

      <!-- Event cards overlay (absolute, positioned by top + height + grid-col offset) -->
      <div className="absolute inset-0 pointer-events-none">
        {filteredSessions.map(s => (
          <div
            key={s.id}
            className="pointer-events-auto absolute mx-1 overflow-hidden rounded-lg border shadow-sm transition-transform hover:shadow-md hover:-translate-y-[1px] cursor-default"
            style={{
              top: minutesToHeight(startOffset(s)),
              height: Math.max(28, minutesToHeight(durationMinutes(s))),
              left: `calc(80px + (${dayIndex(s)} * (100% - 80px) / 7) + 4px)`,
              width: `calc((100% - 80px) / 7 - 8px)`,
              ...theme(s.courseType).styles,
            }}
          >
            <div className={`h-1 w-full ${theme.topAccent}`} />
            <div className="p-1.5">
              <div className="text-[10px] font-medium opacity-80">{s.startTime} – {s.endTime}</div>
              <div className="truncate text-sm font-semibold leading-tight">{s.title}</div>
              {s.instructor && <div className="mt-0.5 truncate text-[10px] opacity-70">{s.instructor}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
```

Key details:
- **Sticky left gutter (80px)**: Time column uses `sticky left-0` on every row's first cell with opaque `bg-background` (per project convention: sticky columns need opaque bg to prevent bleed)
- **Today's column highlight**: Light `bg-blue-50/50` + 1px left/right `border-blue-200` on the today column cells (header + all body cells)
- **"Today" header cell**: Bold number, `bg-primary/10 text-primary` rounded badge for the day number
- **Filter by category tabs**: `useMemo` filters `DUMMY_SCHEDULE_SESSIONS` by `courseType` + text search
- **Empty state**: If filtered array is empty after search/filter, render `<Empty>` with `UserGroupIcon` and message "No sessions found for this week"

### Step 3.8: Scroll-to-today on mount / Today-button click
- Like AttendanceTab, compute today's column index, then on "Today" click, scroll the grid body container vertically to approximately the current hour of the day (if today is within the visible week), so user lands in the right area
- Wrap in smooth `scrollTo({ behavior: "smooth" })`

### Step 3.9: Edge-case styling
- Session cards shorter than 30 min get clamped to `min-h-[28px]` so text stays visible
- Overflow: `truncate` all session titles (per user's project preference: "highly values text truncation with ellipsis and tooltips for long content") — if card height < 48px, only show the title, not the instructor line
- `Tooltip` wrapper on each event card shows full title, time range, course type badge, instructor on hover (for truncated content)
- Ensure container never triggers page-wide horizontal scroll: outer wrapper uses `min-w-0`, grid uses `minmax(0,1fr)` on columns (per project convention from AttendanceTab's hard constraint)

## 4. Potential Dependencies or Considerations

**No new npm packages needed.** Everything uses existing deps:
- React hooks (already used everywhere)
- Tailwind CSS + arbitrary `calc()` values in `style` (works via Tailwind 4 in project)
- `Hugeicons` (core-free + React wrapper already in `package.json`)
- All shadcn/ui components (`Tabs`, `InputGroup`, `Tooltip`, `DropdownMenu`, `Empty`, `Kbd`, `Button`, `CardHeader`/`CardContent`) already exist in the project

## 5. Risk Handling

| Risk | Mitigation |
|---|---|
| Absolute-positioned event cards overflow the grid or overlap day boundaries | Clamp `dayIndex` to 0–6; clamp `startOffset` to `[0, (HOUR_END - HOUR_START) * 60]`; clamp `duration` so `endOffset ≤ (HOUR_END - HOUR_START) * 60` (if session runs past 6PM, crop height, show tooltip for full end time) |
| Sticky time-gutter header bleeds content on scroll | Apply opaque `bg-muted/60` on header cell + `bg-background` on body cells with explicit `z-10`/`z-20` order per project sticky-column conventions |
| `grid-cols-[80px_repeat(7,...)]` doesn't align between header, body rows, and absolute card overlay | Use the **exact same** `left: calc(80px + (dayIdx * (100% - 80px) / 7) + 4px)` formula for absolute cards; include 4px horizontal padding inside each column so cards don't touch borders |
| Horizontal scroll on page parent | Apply `min-w-0` to the TabsContent wrapper (if placed inside one) + `overflow-hidden` on the rounded border container — matches AttendanceTab's `overflow-x-hidden` hard constraint for parents |
| Session end < start (bad dummy data) | In data generator, ensure `end > start` by at least 30 min; in rendering, swap if necessary |
| Long titles cause cards to blow out of their sized box | All text lines use `truncate`; max 3 lines inside card; height driven solely by duration math (no content-based auto height inside absolute wrapper) |
| Color theme classes get purged by Tailwind JIT | Include all 4 theme color classes in the `cn(...)` call unconditionally (use a map/lookup object with literal strings so Tailwind detects them during scan) — never use dynamic string concatenation for color names |
