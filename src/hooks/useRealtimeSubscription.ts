import { useEffect } from 'react';
import { supabase } from '@/src/utils/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

type SubscriptionCallback = (payload: any) => void;

export function useRealtimeSubscription(
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: SubscriptionCallback,
  filter?: { column: string; value: any }
) {
  useEffect(() => {
    let subscription: RealtimeChannel;

    const setupSubscription = async () => {
      let query = supabase
        .channel('table_db_changes')
        .on(
          'postgres_changes',
          {
            event,
            schema: 'public',
            table,
            ...(filter && { filter: `${filter.column}=eq.${filter.value}` })
          },
          callback
        );

      subscription = query.subscribe();
    };

    setupSubscription();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [table, event, callback, filter]);
}