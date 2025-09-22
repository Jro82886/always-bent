#!/bin/bash

# Update all imports to use the singleton Supabase client

echo "Updating Supabase imports to use singleton..."

# Replace imports of supabase from old client
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*@/lib/supabase/client.*|from "@/lib/supabaseClient"|g'

# Replace createClient imports with getSupabase
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|import { createClient } from.*@/lib/supabase/client.*|import { getSupabase } from "@/lib/supabaseClient"|g'

# Update any createClient() calls to getSupabase()
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|createClient(|getSupabase(|g'

echo "Done! Updated all Supabase imports to use singleton."
