# Attendance Dashboard — Phase 1 Design Spec
**Date:** 2026-03-28
**Status:** Approved

---

## Overview

A React attendance dashboard at `/dashboard` (replacing the existing empty `DashboardPage`) that displays 4 KPI summary cards with period-over-period deltas and a full-width stacked bar chart of daily attendance counts broken down by status. Date range is user-configurable (default: last 14 days). Data is sourced from `attendance_entry` joined to `attendance_session`.

---

## Scope — Phase 1 Only

This spec covers:
- 4 KPI cards (Overall Rate, Total Absent, Late Cases, Excused) with ▲▼ delta vs previous equivalent period
- Stacked bar chart: Present / Absent / Late / Excused / On Leave per calendar day
- Date range picker (From / To inputs, 14-day default, 90-day max)

Out of scope (Phase 2+):
- Level group breakdown
- Class drill-down and comparison
- Heatmap / calendar view
- Student detail table and risk flags

---

## Architecture & Data Flow

```
DashboardPage
  └── useAttendanceDashboard(from, to)
        └── GET /api/attendance/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD
              └── attendanceDashboardController
                    └── attendanceDashboardModel
                          ├── Query 1: current period — daily status counts
                          └── Query 2: previous period — totals only (for deltas)
```

- `from`/`to` state lives in `DashboardPage`; default = `(today − 14 days)` to `today`
- Date changes trigger automatic refetch via `useAttendanceDashboard`
- All data (KPIs + chart series) returned in a single API response
- No Redux or global context required

---

## API Contract

### Endpoint

```
GET /api/attendance/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD
```

### Response

```json
{
  "kpi": {
    "overallRate":   94.8,
    "totalAbsent":   186,
    "lateCases":      41,
    "excused":        23,
    "deltaRate":      0.9,
    "deltaAbsent":   -12,
    "deltaLate":      -5,
    "deltaExcused":    3
  },
  "chart": [
    {
      "date":     "2026-03-15",
      "present":  312,
      "absent":    18,
      "late":       7,
      "excused":    4,
      "onLeave":    2
    }
  ]
}
```

### SQL Logic

**Current period query** — joined `attendance_entry` → `attendance_session`, filtered by `attendance_date BETWEEN :from AND :to`, grouped by `attendance_date + status`. Returns per-day status counts.

**Previous period query** — same join, range = `(:from − N days)` to `(:from − 1 day)` where `N = DATEDIFF(:to, :from) + 1`. Grouped by `status` only (totals, no date breakdown). Used exclusively for delta computation.

**Derived values:**
- `overallRate` = `present / (present + absent + late + excused + on_leave) × 100`, rounded 1 decimal
- `deltaRate` = `currentRate − previousRate` (signed float, 1 decimal)
- All other deltas = `currentTotal − previousTotal` (signed integer)

### New Server Files

| File | Purpose |
|------|---------|
| `server/src/routes/attendanceRoutes.js` | Route definition, mounted at `/api/attendance` |
| `server/src/controllers/attendanceDashboardController.js` | Thin controller — validates query params, calls model, returns response |
| `server/src/models/attendanceDashboardModel.js` | Two SQL queries, data transformation |

The route must be registered in `server/src/routes/index.js`.

---

## Frontend Components

### File Map

| File | Purpose |
|------|---------|
| `client/src/pages/DashboardPage.jsx` | Page shell — owns date state, renders KPIs + chart |
| `client/src/hooks/useAttendanceDashboard.js` | Fetch hook — returns `{ data, isLoading, error }` |
| `client/src/components/dashboard/KpiCard.jsx` | Single KPI card — value + delta |
| `client/src/components/dashboard/AttendanceChart.jsx` | Recharts stacked bar chart wrapper |
| `client/src/components/dashboard/DateRangePicker.jsx` | Two date inputs with validation |

### KpiCard

Props: `label`, `value`, `delta`, `color`, `isLoading`

- Renders `value` large, `delta` below with ▲ (green) or ▼ (red) arrow
- Positive delta = green for Rate, red for Absent/Late/Excused (higher absence = worse)
- Shows shadcn `Skeleton` when `isLoading` is true

### AttendanceChart

Props: `data` (chart array), `isLoading`

- Recharts `BarChart` with `layout="vertical"` set to false (standard vertical bars)
- Each `Bar` has `stackId="attendance"` and `isAnimationActive={false}` for performance
- Bar order (bottom to top in stack): Present → Absent → Late → Excused → On Leave
- Colours: Present `#3b82f6` · Absent `#f43f5e` · Late `#f59e0b` · Excused `#10b981` · On Leave `#6366f1`
- X-axis: `attendance_date` formatted as `MMM DD` (e.g. `Mar 15`)
- Y-axis: count (auto-scaled)
- Custom `Tooltip` shows all 5 status counts on hover
- Shows shimmer `Skeleton` when `isLoading`
- Shows `"No attendance data for this period."` centred message when `data` is empty

### DateRangePicker

Props: `from`, `to`, `onChange(from, to)`

- Two shadcn `Input` fields (type=`date`)
- Validates: `from` must be before `to`, range cannot exceed 90 days
- Inline error message shown below inputs on validation failure
- Does not call `onChange` while either field is invalid

### useAttendanceDashboard

```js
useAttendanceDashboard(from, to)
// Returns: { data: { kpi, chart } | null, isLoading, error }
```

- Uses `api.get('/attendance/dashboard', { params: { from, to } })`
- Re-fetches when `from` or `to` changes (via `useEffect` dependency array)
- Returns `{ data: null, isLoading: true, error: null }` on initial load

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| API error | `react-hot-toast` error toast; previous data stays visible |
| Empty date range (no sessions) | Chart shows empty state message; KPI cards show `—` |
| `from > to` | Date picker shows inline error; fetch blocked |
| Range > 90 days | Date picker shows inline error; fetch blocked |
| `excused`/`on_leave` = 0 (no data yet) | Renders as 0-height bar segment — invisible, no error |

---

## Colour Palette

| Status | Colour | Hex |
|--------|--------|-----|
| Present | Blue | `#3b82f6` |
| Absent | Rose | `#f43f5e` |
| Late | Amber | `#f59e0b` |
| Excused | Emerald | `#10b981` |
| On Leave | Indigo | `#6366f1` |

---

## KPI Delta Direction

A positive delta is **good** for Overall Rate, **bad** for Absent / Late / Excused.

| KPI | Positive delta colour | Negative delta colour |
|-----|-----------------------|-----------------------|
| Overall Rate | Green | Red |
| Total Absent | Red | Green |
| Late Cases | Red | Green |
| Excused | Red | Green |

---

## Routing

- Route: `/dashboard` (existing, already in `routes.jsx`)
- No new route needed — `DashboardPage` is replaced in place
- No new sidebar entry needed — "Dashboard" link already exists
