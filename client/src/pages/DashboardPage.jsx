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
