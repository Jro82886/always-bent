import { supabase } from '@/lib/supabase/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseServer = supabaseUrl && supabaseServiceRoleKey
  ? supabase
  : (null as any);



