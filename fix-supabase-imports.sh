#!/bin/bash

# Fix all direct @supabase imports to use centralized client

echo "Fixing Supabase imports to use centralized client..."

# List of files that need fixing (excluding the client file itself)
files=(
  "src/app/api/fleet/online/route.ts"
  "src/hooks/useInletChat.ts"
  "src/app/api/fleet/trail/route.ts"
  "src/lib/vessels/vesselDataService.ts"
  "src/app/api/tracking/tracks/route.ts"
  "src/app/api/tracking/position/route.ts"
  "src/app/api/tracking/activity/route.ts"
  "src/app/api/tracking/fleet/route.ts"
  "src/lib/supabaseServer.ts"
  "src/lib/services/dm.ts"
  "src/app/api/test-supabase/route.ts"
  "src/lib/services/chat.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    
    # Replace the import
    sed -i '' "s|import { createClient } from '@supabase/supabase-js';|import { supabase } from '@/lib/supabase/client';|g" "$file"
    sed -i '' "s|import { createClient, SupabaseClient, RealtimeChannel } from \"@supabase/supabase-js\";|import { supabase } from '@/lib/supabase/client';\nimport type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';|g" "$file"
    
    # Replace createClient calls with supabase
    sed -i '' "s|createClient(.*)|supabase|g" "$file"
  fi
done

echo "Done! All files updated to use centralized Supabase client."
