import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useVisitCounter() {
  const [allTime, setAllTime] = useState<number | null>(null);
  const [today, setToday] = useState<number | null>(null);

  useEffect(() => {
    const track = async () => {
      // Record this visit
      await supabase.from('page_visits').insert({});

      // Fetch all-time count
      const { count: totalCount } = await supabase
        .from('page_visits')
        .select('*', { count: 'exact', head: true });

      // Fetch today's count
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from('page_visits')
        .select('*', { count: 'exact', head: true })
        .gte('visited_at', startOfDay.toISOString());

      setAllTime(totalCount ?? 0);
      setToday(todayCount ?? 0);
    };

    track();
  }, []);

  return { allTime, today };
}
