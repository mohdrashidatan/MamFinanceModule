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
