#!/bin/bash

# Create .env.local with your Supabase credentials
cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://hobvjmmambhonsugehge.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvYnZqbW1hbWJob25zdWdlaGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjcxMzEsImV4cCI6MjA3MzIwMzEzMX0.20xMzE0nYoDFzfLc4vIMnvprk48226exALM38FhXQqM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvYnZqbW1hbWJob25zdWdlaGdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzYyNzEzMSwiZXhwIjoyMDczMjAzMTMxfQ.5BMjXQ0kev81tbU6CVVX7cjvZeA49tbqKKZZ2F2wgbg
EOF

echo "✅ .env.local created with Supabase credentials"
echo ""
echo "⚠️  IMPORTANT: Add your other environment variables:"
echo "   - COPERNICUS_USER"
echo "   - COPERNICUS_PASS"
echo "   - NEXT_PUBLIC_MAPBOX_TOKEN"
echo ""
echo "📝 Next steps:"
echo "1. Run the ML schema in Supabase SQL Editor"
echo "2. Update these same variables in Vercel"
echo "3. Test at /api/test-supabase"
