import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard }          from '@/components/dashboard/KpiCard';
import { AttendanceChart }  from '@/components/dashboard/AttendanceChart';
import { DateRangePicker }  from '@/components/dashboard/DateRangePicker';
import { useAttendanceDashboard } from '@/hooks/useAttendanceDashboard';
import { useAttendanceHeatmap }   from '@/hooks/useAttendanceHeatmap';
import { AttendanceHeatmap }      from '@/components/dashboard/AttendanceHeatmap';

/** Format a Date as YYYY-MM-DD using local timezone */
function localYMD(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Returns YYYY-MM-DD string for a date N days before today (local timezone) */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localYMD(d);
}

function today() {
  return localYMD();
}

export default function DashboardPage() {
  const [from, setFrom] = useState(() => daysAgo(14));
  const [to,   setTo]   = useState(() => today());

  const { data, isLoading }             = useAttendanceDashboard(from, to);
  const { data: heatmapData,
          isLoading: heatmapLoading }   = useAttendanceHeatmap(from, to);

  const kpi = data?.kpi ?? null;
  const isEmpty = data !== null && (data.chart?.length === 0);
  const kpiDisplay = isEmpty ? null : kpi;

  function handleRangeChange(newFrom, newTo) {
    setFrom(newFrom);
    setTo(newTo);
  }

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Attendance Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            School-wide attendance summary
          </p>
        </div>
        <DateRangePicker from={from} to={to} onChange={handleRangeChange} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Overall Rate"
          value={kpiDisplay ? `${kpiDisplay.overallRate}%` : '—'}
          delta={kpiDisplay?.deltaRate ?? 0}
          deltaLabel="%"
          higherIsBetter={true}
          color="text-blue-500"
          isLoading={isLoading}
        />
        <KpiCard
          label="Total Absent"
          value={kpiDisplay ? String(kpiDisplay.totalAbsent) : '—'}
          delta={kpiDisplay?.deltaAbsent ?? 0}
          deltaLabel=""
          higherIsBetter={false}
          color="text-rose-500"
          isLoading={isLoading}
        />
        <KpiCard
          label="Late Cases"
          value={kpiDisplay ? String(kpiDisplay.lateCases) : '—'}
          delta={kpiDisplay?.deltaLate ?? 0}
          deltaLabel=""
          higherIsBetter={false}
          color="text-amber-500"
          isLoading={isLoading}
        />
        <KpiCard
          label="Excused"
          value={kpiDisplay ? String(kpiDisplay.excused) : '—'}
          delta={kpiDisplay?.deltaExcused ?? 0}
          deltaLabel=""
          higherIsBetter={false}
          color="text-emerald-500"
          isLoading={isLoading}
        />
      </div>

      {/* Attendance chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            Attendance Trend — Stacked by Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceChart data={data?.chart ?? []} isLoading={isLoading} />
        </CardContent>
      </Card>

      {/* Attendance heatmap */}
      <AttendanceHeatmap data={heatmapData ?? []} isLoading={heatmapLoading} />

    </div>
  );
}
