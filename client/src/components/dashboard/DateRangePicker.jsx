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

  useEffect(() => { setLocalFrom(from); }, [from]);
  useEffect(() => { setLocalTo(to); },   [to]);

  function validate(f, t) {
    if (!f || !t) return '';
    if (f > t)  return '"From" must be before or equal to "To"';
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
