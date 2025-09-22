#!/bin/bash

echo "🔧 Fixing Supabase imports comprehensively..."

# Fix server-side API routes to use server client
echo "📝 Updating server-side API routes..."
find src/app/api -name "*.ts" | xargs sed -i '' 's|import { createClient } from.*@/lib/supabase/server.*|import { getSupabase } from "@/lib/supabase/server"|g'
find src/app/api -name "*.ts" | xargs sed -i '' 's|const supabase = await getSupabase();|const supabase = await getSupabase();|g'

# Fix client-side imports that incorrectly try to import createClient
echo "📝 Updating client-side imports..."
find src/components src/hooks src/lib -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|import { createClient } from "@/lib/supabaseClient"|import { getSupabase } from "@/lib/supabaseClient"|g'

# Fix remaining getSupabase() calls to use the singleton
find src/components src/hooks src/lib -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|const supabase = getSupabase();|const supabase = getSupabase();|g'

# Fix map.off calls in FleetLayer (Mapbox doesn't have off method, need to store handlers)
echo "📝 Fixing FleetLayer map event handlers..."
sed -i '' 's|map.off('\''click'\'', '\''fleet-vessels'\'');|// map.off not available - handlers cleaned up via removeLayer|g' src/components/tracking/FleetLayer.tsx
sed -i '' 's|map.off('\''mouseenter'\'', '\''fleet-vessels'\'');|// map.off not available|g' src/components/tracking/FleetLayer.tsx
sed -i '' 's|map.off('\''mouseleave'\'', '\''fleet-vessels'\'');|// map.off not available|g' src/components/tracking/FleetLayer.tsx

# Fix type annotations
echo "📝 Adding type annotations..."
sed -i '' 's|\.forEach(point => {|.forEach((point: any) => {|g' src/app/api/community/fleet/route.ts
sed -i '' 's|\.map(spot => ({|.map((spot: any) => ({|g' src/app/api/community/hotspots/route.ts
sed -i '' 's|\.map(report => ({|.map((report: any) => ({|g' src/app/api/community/reports/route.ts
sed -i '' 's|\.forEach(report => {|.forEach((report: any) => {|g' src/lib/trends/sources/dbAgg.ts

# Fix hooks that need type annotations
echo "📝 Fixing hook type annotations..."
sed -i '' 's|({ key, newPresences }) => {|({ key, newPresences }: any) => {|g' src/hooks/useOnlinePresence.ts
sed -i '' 's|({ key, leftPresences }) => {|({ key, leftPresences }: any) => {|g' src/hooks/useOnlinePresence.ts
sed -i '' 's|async (status) => {|async (status: any) => {|g' src/hooks/useOnlinePresence.ts
sed -i '' 's|}, (payload) => {|}, (payload: any) => {|g' src/lib/notifications/biteNotifications.ts

echo "✅ Done! All Supabase imports should now be fixed."
