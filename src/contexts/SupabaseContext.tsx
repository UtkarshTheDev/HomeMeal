import { createContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseShared';

// Create SupabaseContext for the useSupabase hook
export const SupabaseContext = createContext<{
  supabase: typeof supabase;
  session: Session | null;
}>({
  supabase,
  session: null,
});

export default SupabaseContext;
