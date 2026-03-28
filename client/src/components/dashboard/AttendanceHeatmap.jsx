import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Single source of truth for colour bands — used by both the legend and the cells.
const BANDS = [
  { label: 'Excellent', bg: 'bg-green-100', text: 'text-green-800', min: 95 },
  { label: 'Good',      bg: 'bg-blue-100',  text: 'text-blue-800',  min: 90 },
  { label: 'Watch',     bg: 'bg-amber-100', text: 'text-amber-800', min: 85 },
  { label: 'Concern',   bg: 'bg-rose-100',  text: 'text-rose-800',  min: 0  },
];

/**
 * Returns the colour band for a given attendance percentage.
 * @param {number} pct
 * @returns {{ label: string, bg: string, text: string }}
 */
function getAttendanceBand(pct) {
  return BANDS.find((b) => pct >= b.min) ?? BANDS[BANDS.length - 1];
}

const WEEKDAYS_DISPLAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WEEKDAYS_KEY     = ['mon', 'tue', 'wed', 'thu', 'fri'];

// Shared grid template — single definition for both header and data rows.
const GRID_COLS = 'grid grid-cols-[160px_repeat(5,1fr)]';

/**
 * CSS-grid heatmap showing attendance % by class (rows) × weekday (columns).
 *
 * @param {{ classId: number|string, className: string, classCode: string,
 *           mon: {pct:number,total:number}|null, tue: {pct:number,total:number}|null,
 *           wed: {pct:number,total:number}|null, thu: {pct:number,total:number}|null,
 *           fri: {pct:number,total:number}|null }[]} data
 * @param {boolean} isLoading
 */
export function AttendanceHeatmap({ data = [], isLoading = false }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-56 mb-1" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Pattern Heatmap</CardTitle>
        <CardDescription>Compare average attendance percentages across classes and weekdays</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            No attendance data for this period.
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 mb-4">
              {BANDS.map(({ label, bg, text }) => (
                <span
                  key={label}
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    bg,
                    text,
                  )}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="overflow-x-auto">
              <div style={{ minWidth: '480px' }}>

                {/* Header row */}
                <div className={cn(GRID_COLS, 'mb-1')}>
                  <div /> {/* empty corner */}
                  {WEEKDAYS_DISPLAY.map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Data rows */}
                {data.map((row) => (
                  <div key={row.classId} className={cn(GRID_COLS, 'mb-1')}>

                    {/* Class code cell — full name shown on hover via title */}
                    <div
                      title={row.className}
                      className="flex items-center px-3 py-2 bg-muted rounded-lg text-sm font-medium text-foreground truncate cursor-default"
                    >
                      {row.classCode}
                    </div>

                    {/* Weekday cells */}
                    {WEEKDAYS_KEY.map((day, idx) => {
                      const cell = row[day];
                      if (!cell) {
                        return (
                          <div
                            key={day}
                            title="No data"
                            className="mx-0.5 flex items-center justify-center rounded-lg bg-muted/40 text-xs text-muted-foreground py-2 cursor-default"
                          >
                            —
                          </div>
                        );
                      }
                      const displayPct = Math.round(cell.pct * 10) / 10;
                      const { bg, text, label } = getAttendanceBand(displayPct);
                      return (
                        <div
                          key={day}
                          title={`${row.className} · ${WEEKDAYS_DISPLAY[idx]} · ${displayPct}% · ${label}`}
                          className={cn(
                            'mx-0.5 flex items-center justify-center rounded-lg text-xs font-semibold py-2 cursor-default transition-opacity hover:opacity-80',
                            bg,
                            text,
                          )}
                        >
                          {displayPct}%
                        </div>
                      );
                    })}
                  </div>
                ))}

              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
