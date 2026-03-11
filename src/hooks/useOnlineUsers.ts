import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useOnlineUsers() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const channel = supabase.channel('online-users', {
      config: { presence: { key: crypto.randomUUID() } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}
