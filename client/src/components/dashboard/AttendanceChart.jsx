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

const STATUS_ORDER = ['present', 'absent', 'late', 'excused', 'onLeave'];

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
          <span style={{ color: entry.color }}>{LABELS[entry.dataKey] ?? entry.dataKey}</span>
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
        {STATUS_ORDER.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="attendance"
            fill={COLORS[key]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
