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
          const msg = err.response?.data?.error?.message ?? 'Failed to load attendance data';
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
