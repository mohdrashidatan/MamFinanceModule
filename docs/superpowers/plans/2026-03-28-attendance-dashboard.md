# Attendance Dashboard — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an attendance dashboard at `/dashboard` with 4 KPI cards (with period-over-period deltas) and a stacked bar chart of daily attendance counts by status, backed by a single Express API endpoint.

**Architecture:** A single `GET /api/attendance/dashboard` endpoint queries `attendance_entry` joined to `attendance_session` for both the current and previous equivalent period, returning KPI totals, deltas, and per-day chart data in one response. The frontend uses a custom hook to fetch and a set of focused presentational components to render.

**Tech Stack:** Node.js/Express (CommonJS), mysql2/promise, React 18, Recharts 3, shadcn/ui (Card, Input, Skeleton), Tailwind CSS, react-hot-toast.

---

## File Map

### Backend — New Files

| File | Purpose |
|------|---------|
| `server/src/models/attendanceDashboardModel.js` | Two SQL queries + `buildResponse` transformer |
| `server/src/controllers/attendanceDashboardController.js` | Validates query params, calls model, returns JSON |
| `server/src/routes/attendanceRoutes.js` | `GET /` → controller, protected by `authenticateToken` |

### Backend — Modified Files

| File | Change |
|------|--------|
| `server/src/routes/index.js` | Add `Router.use('/attendance', attendanceRoute)` |

### Frontend — New Files

| File | Purpose |
|------|---------|
| `client/src/hooks/useAttendanceDashboard.js` | Fetch hook — returns `{ data, isLoading, error }` |
| `client/src/components/dashboard/KpiCard.jsx` | Single KPI card with value + delta |
| `client/src/components/dashboard/DateRangePicker.jsx` | Two date inputs with validation |
| `client/src/components/dashboard/AttendanceChart.jsx` | Recharts stacked bar chart |

### Frontend — Modified Files

| File | Change |
|------|--------|
| `client/src/pages/DashboardPage.jsx` | Replace placeholder with full dashboard layout |

---

### Task 1: Backend model — SQL queries and data transformer

**Files:**
- Create: `server/src/models/attendanceDashboardModel.js`
- Create: `server/src/models/attendanceDashboardModel.test.js`

- [ ] **Step 1: Create the test file**

```js
// server/src/models/attendanceDashboardModel.test.js
'use strict';

const assert = require('assert');
const { buildResponse } = require('./attendanceDashboardModel');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}: ${e.message}`); failed++; }
}

// ── buildResponse ─────────────────────────────────────────────────────────────

const currentRows = [
  { date: '2026-03-15', status: 'present',  count: 30 },
  { date: '2026-03-15', status: 'absent',   count: 3  },
  { date: '2026-03-15', status: 'late',     count: 2  },
  { date: '2026-03-16', status: 'present',  count: 28 },
  { date: '2026-03-16', status: 'absent',   count: 5  },
  { date: '2026-03-16', status: 'on_leave', count: 1  },
];

const previousRows = [
  { status: 'present', count: 25 },
  { status: 'absent',  count: 6  },
  { status: 'late',    count: 4  },
];

test('buildResponse: chart has one entry per unique date', () => {
  const { chart } = buildResponse(currentRows, previousRows);
  assert.strictEqual(chart.length, 2);
});

test('buildResponse: chart entries are sorted by date', () => {
  const { chart } = buildResponse(currentRows, previousRows);
  assert.strictEqual(chart[0].date, '2026-03-15');
  assert.strictEqual(chart[1].date, '2026-03-16');
});

test('buildResponse: chart entry has all 5 status keys', () => {
  const { chart } = buildResponse(currentRows, previousRows);
  const keys = ['present', 'absent', 'late', 'excused', 'onLeave'];
  for (const key of keys) assert.ok(key in chart[0], `missing key: ${key}`);
});

test('buildResponse: on_leave maps to onLeave in chart', () => {
  const { chart } = buildResponse(currentRows, previousRows);
  assert.strictEqual(chart[1].onLeave, 1);
});

test('buildResponse: kpi.overallRate is correct (1 decimal)', () => {
  const { kpi } = buildResponse(currentRows, previousRows);
  // present = 30+28 = 58, total = 30+3+2+28+5+1 = 69
  assert.strictEqual(kpi.overallRate, Math.round((58 / 69) * 1000) / 10);
});

test('buildResponse: kpi.totalAbsent sums absent entries', () => {
  const { kpi } = buildResponse(currentRows, previousRows);
  assert.strictEqual(kpi.totalAbsent, 8); // 3+5
});

test('buildResponse: deltaAbsent is current minus previous', () => {
  const { kpi } = buildResponse(currentRows, previousRows);
  assert.strictEqual(kpi.deltaAbsent, 8 - 6); // cur=8, prev=6
});

test('buildResponse: returns zero kpi when both row arrays empty', () => {
  const { kpi, chart } = buildResponse([], []);
  assert.strictEqual(kpi.overallRate, 0);
  assert.strictEqual(kpi.totalAbsent, 0);
  assert.strictEqual(chart.length, 0);
});

console.log('');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: Run tests — confirm they all fail**

```bash
cd "D:\System Projects\MAM\FeeFolio Finance\server" && node src/models/attendanceDashboardModel.test.js
```

Expected: all 8 tests fail with `Cannot find module './attendanceDashboardModel'`

- [ ] **Step 3: Create the model**

```js
// server/src/models/attendanceDashboardModel.js
'use strict';

const pool = require('../config/db');

/**
 * Transforms raw query rows into the API response shape.
 * Exported for unit testing.
 *
 * @param {{ date: string, status: string, count: number|string }[]} currentRows
 * @param {{ status: string, count: number|string }[]} previousRows
 * @returns {{ kpi: object, chart: object[] }}
 */
function buildResponse(currentRows, previousRows) {
  // ── Chart: group by date, pivot status ──────────────────────────────────────
  const dateMap = {};
  for (const row of currentRows) {
    // attendance_date may come back as a Date object or string
    const d = row.date instanceof Date
      ? row.date.toISOString().slice(0, 10)
      : String(row.date).slice(0, 10);
    if (!dateMap[d]) {
      dateMap[d] = { date: d, present: 0, absent: 0, late: 0, excused: 0, onLeave: 0 };
    }
    const key = row.status === 'on_leave' ? 'onLeave' : row.status;
    dateMap[d][key] = (dateMap[d][key] || 0) + Number(row.count);
  }
  const chart = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

  // ── KPI: current period totals ───────────────────────────────────────────────
  const cur = { present: 0, absent: 0, late: 0, excused: 0, on_leave: 0 };
  for (const row of currentRows) {
    cur[row.status] = (cur[row.status] || 0) + Number(row.count);
  }
  const curTotal = Object.values(cur).reduce((a, b) => a + b, 0);
  const curRate  = curTotal > 0 ? Math.round((cur.present / curTotal) * 1000) / 10 : 0;

  // ── KPI: previous period totals ──────────────────────────────────────────────
  const prev = { present: 0, absent: 0, late: 0, excused: 0, on_leave: 0 };
  for (const row of previousRows) {
    prev[row.status] = (prev[row.status] || 0) + Number(row.count);
  }
  const prevTotal = Object.values(prev).reduce((a, b) => a + b, 0);
  const prevRate  = prevTotal > 0 ? Math.round((prev.present / prevTotal) * 1000) / 10 : 0;

  return {
    kpi: {
      overallRate:  curRate,
      totalAbsent:  cur.absent,
      lateCases:    cur.late,
      excused:      cur.excused,
      deltaRate:    Math.round((curRate - prevRate) * 10) / 10,
      deltaAbsent:  cur.absent  - prev.absent,
      deltaLate:    cur.late    - prev.late,
      deltaExcused: cur.excused - prev.excused,
    },
    chart,
  };
}

/**
 * Fetch attendance data for a date range plus the equivalent previous period.
 * @param {string} from  YYYY-MM-DD
 * @param {string} to    YYYY-MM-DD
 */
async function getAttendanceDashboard(from, to) {
  const periodSql = `
    SELECT
      DATE(s.attendance_date)  AS date,
      e.status                 AS status,
      COUNT(*)                 AS count
    FROM attendance_entry e
    JOIN attendance_session s
      ON s.attendance_session_id = e.attendance_session_id
    WHERE s.attendance_date BETWEEN ? AND ?
      AND e.active = 1
      AND s.active = 1
    GROUP BY DATE(s.attendance_date), e.status
    ORDER BY DATE(s.attendance_date)
  `;

  const totalsSql = `
    SELECT
      e.status  AS status,
      COUNT(*)  AS count
    FROM attendance_entry e
    JOIN attendance_session s
      ON s.attendance_session_id = e.attendance_session_id
    WHERE s.attendance_date BETWEEN ? AND ?
      AND e.active = 1
      AND s.active = 1
    GROUP BY e.status
  `;

  // Previous period: same length, immediately before `from`
  const fromDate = new Date(from + 'T00:00:00');
  const toDate   = new Date(to   + 'T00:00:00');
  const n        = Math.round((toDate - fromDate) / 86400000) + 1; // days inclusive
  const prevTo   = new Date(fromDate); prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);   prevFrom.setDate(prevFrom.getDate() - (n - 1));

  const prevFromStr = prevFrom.toISOString().slice(0, 10);
  const prevToStr   = prevTo.toISOString().slice(0, 10);

  const [[currentRows], [previousRows]] = await Promise.all([
    pool.execute(periodSql, [from, to]),
    pool.execute(totalsSql, [prevFromStr, prevToStr]),
  ]);

  return buildResponse(currentRows, previousRows);
}

module.exports = { getAttendanceDashboard, buildResponse };
```

- [ ] **Step 4: Run tests — confirm all pass**

```bash
cd "D:\System Projects\MAM\FeeFolio Finance\server" && node src/models/attendanceDashboardModel.test.js
```

Expected:
```
  ✓ buildResponse: chart has one entry per unique date
  ✓ buildResponse: chart entries are sorted by date
  ✓ buildResponse: chart entry has all 5 status keys
  ✓ buildResponse: on_leave maps to onLeave in chart
  ✓ buildResponse: kpi.overallRate is correct (1 decimal)
  ✓ buildResponse: kpi.totalAbsent sums absent entries
  ✓ buildResponse: deltaAbsent is current minus previous
  ✓ buildResponse: returns zero kpi when both row arrays empty

Results: 8 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
cd "D:\System Projects\MAM\FeeFolio Finance" && git add server/src/models/attendanceDashboardModel.js server/src/models/attendanceDashboardModel.test.js && git commit -m "feat: add attendance dashboard model with SQL queries and transformer"
```

---

### Task 2: Backend controller, route, and registration

**Files:**
- Create: `server/src/controllers/attendanceDashboardController.js`
- Create: `server/src/routes/attendanceRoutes.js`
- Modify: `server/src/routes/index.js`

- [ ] **Step 1: Create the controller**

```js
// server/src/controllers/attendanceDashboardController.js
'use strict';

const { getAttendanceDashboard } = require('../models/attendanceDashboardModel');

const getDashboard = async (req, res) => {
  try {
    const { from, to } = req.query;

    // Validate presence
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Query params "from" and "to" are required (YYYY-MM-DD)',
      });
    }

    // Validate format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(from) || !dateRegex.test(to)) {
      return res.status(400).json({
        success: false,
        message: '"from" and "to" must be in YYYY-MM-DD format',
      });
    }

    // Validate range order
    if (from >= to) {
      return res.status(400).json({
        success: false,
        message: '"from" must be before "to"',
      });
    }

    // Validate max range (90 days)
    const diffMs   = new Date(to + 'T00:00:00') - new Date(from + 'T00:00:00');
    const diffDays = Math.round(diffMs / 86400000);
    if (diffDays > 90) {
      return res.status(400).json({
        success: false,
        message: 'Date range cannot exceed 90 days',
      });
    }

    const data = await getAttendanceDashboard(from, to);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Attendance dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = { getDashboard };
```

- [ ] **Step 2: Create the route**

```js
// server/src/routes/attendanceRoutes.js
'use strict';

const express = require('express');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { getDashboard } = require('../controllers/attendanceDashboardController');

const router = express.Router();

router.get('/dashboard', authenticateToken, getDashboard);

module.exports = router;
```

- [ ] **Step 3: Register the route in index.js**

In `server/src/routes/index.js`, add after the existing profile route:

```js
const express = require("express");
const authRoute = require("./authRoutes");
const profileRoute = require("./profileRoutes");
const attendanceRoute = require("./attendanceRoutes");

const Router = express.Router();

Router.use("/auth", authRoute);
Router.use("/profile", profileRoute);
Router.use("/attendance", attendanceRoute);

module.exports = Router;
```

- [ ] **Step 4: Start the server and smoke-test the endpoint**

Start the server (in a separate terminal):
```bash
cd "D:\System Projects\MAM\FeeFolio Finance\server" && npm run dev
```

Then test with curl or browser. Using Node:
```bash
cd "D:\System Projects\MAM\FeeFolio Finance\server" && node -e "
const http = require('http');
// Get a token first — using the existing admin account
const https = require('https');
const req = http.request({
  hostname: 'localhost', port: 3055, path: '/api/auth/login',
  method: 'POST', headers: { 'Content-Type': 'application/json' }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const token = JSON.parse(body).token;
    console.log('token:', token ? 'obtained' : 'FAILED');
    const req2 = http.request({
      hostname: 'localhost', port: 3055,
      path: '/api/attendance/dashboard?from=2026-03-01&to=2026-03-28',
      headers: { Authorization: 'Bearer ' + token }
    }, res2 => {
      let b = '';
      res2.on('data', d => b += d);
      res2.on('end', () => console.log(JSON.parse(b)));
    });
    req2.end();
  });
});
req.write(JSON.stringify({ emailAddress: 'admin@admin.com', password: 'admin' }));
req.end();
"
```

Expected: `{ success: true, data: { kpi: { ... }, chart: [...] } }` — chart may be empty if no sessions exist in that range, which is fine.

- [ ] **Step 5: Commit**

```bash
cd "D:\System Projects\MAM\FeeFolio Finance" && git add server/src/controllers/attendanceDashboardController.js server/src/routes/attendanceRoutes.js server/src/routes/index.js && git commit -m "feat: add attendance dashboard controller and route"
```

---

### Task 3: Frontend hook — useAttendanceDashboard

**Files:**
- Create: `client/src/hooks/useAttendanceDashboard.js`

- [ ] **Step 1: Create the hook**

```js
// client/src/hooks/useAttendanceDashboard.js
import { useState, useEffect } from 'react';
import api from '@/utils/api';
import toast from 'react-hot-toast';

/**
 * Fetches attendance dashboard data for the given date range.
 * Re-fetches automatically when from or to changes.
 *
 * @param {string} from  YYYY-MM-DD
 * @param {string} to    YYYY-MM-DD
 * @returns {{ data: { kpi: object, chart: object[] } | null, isLoading: boolean, error: string | null }}
 */
export function useAttendanceDashboard(from, to) {
  const [data, setData]           = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    if (!from || !to) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    api.get('/attendance/dashboard', { params: { from, to } })
      .then((res) => {
        if (!cancelled) setData(res.data.data);
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err.response?.data?.message ?? 'Failed to load attendance data';
          setError(msg);
          toast.error(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [from, to]);

  return { data, isLoading, error };
}
```

- [ ] **Step 2: Verify the hook file was created**

```bash
ls "D:\System Projects\MAM\FeeFolio Finance\client\src\hooks"
```

Expected: `useAttendanceDashboard.js` appears alongside `usePageTitle.jsx` and `useSelectionRows.jsx`

- [ ] **Step 3: Commit**

```bash
cd "D:\System Projects\MAM\FeeFolio Finance" && git add client/src/hooks/useAttendanceDashboard.js && git commit -m "feat: add useAttendanceDashboard hook"
```

---

### Task 4: Frontend — KpiCard component

**Files:**
- Create: `client/src/components/dashboard/KpiCard.jsx`

- [ ] **Step 1: Create the component**

```jsx
// client/src/components/dashboard/KpiCard.jsx
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * KPI summary card with value and period-over-period delta.
 *
 * @param {string}  label        - Card title (e.g. "Overall Rate")
 * @param {string}  value        - Formatted value to display large (e.g. "94.8%" or "186")
 * @param {number}  delta        - Signed change vs previous period
 * @param {string}  deltaLabel   - Units for delta display (e.g. "%" or "")
 * @param {boolean} higherIsBetter - true = positive delta is green; false = positive delta is red
 * @param {string}  color        - Tailwind text colour class for the value (e.g. "text-blue-500")
 * @param {boolean} isLoading    - Shows skeleton when true
 */
export function KpiCard({ label, value, delta, deltaLabel = '', higherIsBetter = true, color = 'text-foreground', isLoading = false }) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-16" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = delta > 0;
  const isNeutral  = delta === 0;

  // Positive is green for "higher is better" (rate), red for "lower is better" (absences)
  const deltaColor = isNeutral
    ? 'text-muted-foreground'
    : (isPositive === higherIsBetter ? 'text-emerald-500' : 'text-rose-500');

  const DeltaIcon = isNeutral ? Minus : (isPositive ? TrendingUp : TrendingDown);

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className={`text-3xl font-bold mb-2 ${color}`}>{value}</p>
        <div className={`flex items-center gap-1 text-sm ${deltaColor}`}>
          <DeltaIcon className="h-4 w-4" />
          <span>
            {isPositive ? '+' : ''}{delta}{deltaLabel} vs prev period
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd "D:\System Projects\MAM\FeeFolio Finance" && git add client/src/components/dashboard/KpiCard.jsx && git commit -m "feat: add KpiCard component"
```

---

### Task 5: Frontend — DateRangePicker component

**Files:**
- Create: `client/src/components/dashboard/DateRangePicker.jsx`

- [ ] **Step 1: Create the component**

```jsx
// client/src/components/dashboard/DateRangePicker.jsx
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MAX_RANGE_DAYS = 90;

/**
 * Two date inputs (From / To) with inline validation.
 *
 * @param {string}   from       - Current from value (YYYY-MM-DD)
 * @param {string}   to         - Current to value (YYYY-MM-DD)
 * @param {Function} onChange   - Called with (from, to) when both dates are valid
 */
export function DateRangePicker({ from, to, onChange }) {
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo,   setLocalTo]   = useState(to);
  const [error,     setError]     = useState('');

  // Sync external changes (e.g. initial defaults)
  useEffect(() => { setLocalFrom(from); }, [from]);
  useEffect(() => { setLocalTo(to); },   [to]);

  function validate(f, t) {
    if (!f || !t) return '';
    if (f >= t)  return '"From" must be before "To"';
    const diffDays = Math.round((new Date(t + 'T00:00:00') - new Date(f + 'T00:00:00')) / 86400000);
    if (diffDays > MAX_RANGE_DAYS) return `Range cannot exceed ${MAX_RANGE_DAYS} days`;
    return '';
  }

  function handleFromChange(e) {
    const val = e.target.value;
    setLocalFrom(val);
    const err = validate(val, localTo);
    setError(err);
    if (!err && val && localTo) onChange(val, localTo);
  }

  function handleToChange(e) {
    const val = e.target.value;
    setLocalTo(val);
    const err = validate(localFrom, val);
    setError(err);
    if (!err && localFrom && val) onChange(localFrom, val);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="date-from" className="text-sm text-muted-foreground whitespace-nowrap">From</Label>
          <Input
            id="date-from"
            type="date"
            value={localFrom}
            onChange={handleFromChange}
            className="w-36 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="date-to" className="text-sm text-muted-foreground whitespace-nowrap">To</Label>
          <Input
            id="date-to"
            type="date"
            value={localTo}
            onChange={handleToChange}
            className="w-36 text-sm"
          />
        </div>
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd "D:\System Projects\MAM\FeeFolio Finance" && git add client/src/components/dashboard/DateRangePicker.jsx && git commit -m "feat: add DateRangePicker component"
```

---

### Task 6: Frontend — AttendanceChart component

**Files:**
- Create: `client/src/components/dashboard/AttendanceChart.jsx`

- [ ] **Step 1: Create the component**

```jsx
// client/src/components/dashboard/AttendanceChart.jsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = {
  present: '#3b82f6',
  absent:  '#f43f5e',
  late:    '#f59e0b',
  excused: '#10b981',
  onLeave: '#6366f1',
};

const LABELS = {
  present: 'Present',
  absent:  'Absent',
  late:    'Late',
  excused: 'Excused',
  onLeave: 'On Leave',
};

/** Format "2026-03-15" → "Mar 15" */
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm min-w-[140px]">
      <p className="font-medium mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex justify-between gap-4">
          <span style={{ color: entry.fill }}>{LABELS[entry.dataKey]}</span>
          <span className="font-mono font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * Stacked bar chart of attendance counts by status per day.
 *
 * @param {{ date: string, present: number, absent: number, late: number, excused: number, onLeave: number }[]} data
 * @param {boolean} isLoading
 */
export function AttendanceChart({ data = [], isLoading = false }) {
  if (isLoading) {
    return <Skeleton className="h-72 w-full rounded-xl" />;
  }

  if (!data.length) {
    return (
      <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">
        No attendance data for this period.
      </div>
    );
  }

  // Add formatted date label for X-axis display
  const chartData = data.map((d) => ({ ...d, label: formatDate(d.date) }));

  return (
    <ResponsiveContainer width="100%" height={288}>
      <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => LABELS[value]}
          wrapperStyle={{ fontSize: 12 }}
        />
        {Object.entries(COLORS).map(([key, color]) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="attendance"
            fill={color}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd "D:\System Projects\MAM\FeeFolio Finance" && git add client/src/components/dashboard/AttendanceChart.jsx && git commit -m "feat: add AttendanceChart component using Recharts"
```

---

### Task 7: Frontend — DashboardPage — wire everything together

**Files:**
- Modify: `client/src/pages/DashboardPage.jsx`

- [ ] **Step 1: Replace the placeholder with the full dashboard**

```jsx
// client/src/pages/DashboardPage.jsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard }          from '@/components/dashboard/KpiCard';
import { AttendanceChart }  from '@/components/dashboard/AttendanceChart';
import { DateRangePicker }  from '@/components/dashboard/DateRangePicker';
import { useAttendanceDashboard } from '@/hooks/useAttendanceDashboard';

/** Returns YYYY-MM-DD string for a date N days before today */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const [from, setFrom] = useState(() => daysAgo(14));
  const [to,   setTo]   = useState(() => today());

  const { data, isLoading } = useAttendanceDashboard(from, to);

  const kpi = data?.kpi ?? null;

  function handleRangeChange(newFrom, newTo) {
    setFrom(newFrom);
    setTo(newTo);
  }

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold">Attendance Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          School-wide attendance summary
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Overall Rate"
          value={kpi ? `${kpi.overallRate}%` : '—'}
          delta={kpi?.deltaRate ?? 0}
          deltaLabel="%"
          higherIsBetter={true}
          color="text-blue-500"
          isLoading={isLoading}
        />
        <KpiCard
          label="Total Absent"
          value={kpi ? String(kpi.totalAbsent) : '—'}
          delta={kpi?.deltaAbsent ?? 0}
          deltaLabel=""
          higherIsBetter={false}
          color="text-rose-500"
          isLoading={isLoading}
        />
        <KpiCard
          label="Late Cases"
          value={kpi ? String(kpi.lateCases) : '—'}
          delta={kpi?.deltaLate ?? 0}
          deltaLabel=""
          higherIsBetter={false}
          color="text-amber-500"
          isLoading={isLoading}
        />
        <KpiCard
          label="Excused"
          value={kpi ? String(kpi.excused) : '—'}
          delta={kpi?.deltaExcused ?? 0}
          deltaLabel=""
          higherIsBetter={false}
          color="text-emerald-500"
          isLoading={isLoading}
        />
      </div>

      {/* Attendance chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-medium">
              Attendance Trend — Stacked by Status
            </CardTitle>
            <DateRangePicker from={from} to={to} onChange={handleRangeChange} />
          </div>
        </CardHeader>
        <CardContent>
          <AttendanceChart data={data?.chart ?? []} isLoading={isLoading} />
        </CardContent>
      </Card>

    </div>
  );
}
```

- [ ] **Step 2: Start the dev servers and open the dashboard**

In one terminal:
```bash
cd "D:\System Projects\MAM\FeeFolio Finance\server" && npm run dev
```

In another:
```bash
cd "D:\System Projects\MAM\FeeFolio Finance\client" && npm run dev
```

Open `http://localhost:5173` (or the port shown), log in, navigate to Dashboard.

Expected: 4 KPI cards + stacked bar chart render. With only 8 attendance entries in the DB the chart will show a few bars; KPI cards will show real totals with deltas.

- [ ] **Step 3: Verify the following manually**

- [ ] KPI cards show skeleton while loading, then real values
- [ ] Chart shows bars for dates that have sessions
- [ ] Empty state message appears if date range has no data (e.g. set range to 2025-01-01 → 2025-01-14)
- [ ] Changing date range triggers a refetch and chart updates
- [ ] Invalid range (from > to) shows inline error and blocks fetch
- [ ] Range > 90 days shows inline error and blocks fetch
- [ ] Delta indicators show ▲ / ▼ arrows with correct green/red colouring

- [ ] **Step 4: Commit**

```bash
cd "D:\System Projects\MAM\FeeFolio Finance" && git add client/src/pages/DashboardPage.jsx && git commit -m "feat: implement attendance dashboard page"
```

---

## Self-Review

**Spec coverage:**
- ✅ 4 KPI cards (Overall Rate, Total Absent, Late Cases, Excused) → Tasks 4 + 7
- ✅ Period-over-period deltas with ▲▼ indicators → KpiCard component, Task 4
- ✅ Delta colour convention (higher-is-better vs lower-is-better) → KpiCard `higherIsBetter` prop
- ✅ Stacked bar chart (Present/Absent/Late/Excused/On Leave per day) → AttendanceChart, Task 6
- ✅ Colour palette (#3b82f6 / #f43f5e / #f59e0b / #10b981 / #6366f1) → COLORS constant, Task 6
- ✅ Date range picker (From/To inputs) → DateRangePicker, Task 5
- ✅ Default 14-day range → `daysAgo(14)` in DashboardPage, Task 7
- ✅ 90-day max validation → DateRangePicker, Task 5
- ✅ `from ≥ to` validation → DateRangePicker, Task 5
- ✅ Loading skeletons → KpiCard + AttendanceChart, Tasks 4 + 6
- ✅ Empty state message → AttendanceChart, Task 6
- ✅ `react-hot-toast` on API error → useAttendanceDashboard hook, Task 3
- ✅ Stale data on error → hook does not clear `data` on error, Task 3
- ✅ Single endpoint `/api/attendance/dashboard` → Tasks 1 + 2
- ✅ Previous period = same-length window immediately before `from` → model, Task 1
- ✅ `on_leave` → `onLeave` mapping → `buildResponse`, Task 1
- ✅ Route registered in index.js → Task 2
- ✅ `authenticateToken` middleware on the route → Task 2
- ✅ Lives at `/dashboard` (no new route) → Task 7

**Placeholder scan:** None found.

**Type consistency:**
- `buildResponse` returns `{ kpi, chart }` → `getAttendanceDashboard` returns same → controller sends `{ success, data: { kpi, chart } }` → hook exposes `data.kpi` and `data.chart` → DashboardPage reads `data?.kpi` and `data?.chart` ✅
- `LABELS` keys in AttendanceChart (`present`, `absent`, `late`, `excused`, `onLeave`) match chart array keys from `buildResponse` ✅
- `KpiCard` props used in DashboardPage all match the component's prop definitions ✅
