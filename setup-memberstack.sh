#!/bin/bash

# Memberstack Setup Script
echo "🔐 Setting up Memberstack Authentication..."

# Create or append to .env.local
echo "" >> .env.local
echo "# Memberstack Authentication" >> .env.local
echo "NEXT_PUBLIC_MEMBERSTACK_APP_ID=app_cmfpavrtq00zb0wws6asv8xf3" >> .env.local

echo "✅ Added Memberstack App ID to .env.local"

# Create a Vercel env file for easy copying
cat > MEMBERSTACK_ENV_FOR_VERCEL.txt << EOF
NEXT_PUBLIC_MEMBERSTACK_APP_ID=app_cmfpavrtq00zb0wws6asv8xf3
EOF

echo "✅ Created MEMBERSTACK_ENV_FOR_VERCEL.txt for easy copying to Vercel"

# Commit the changes
git add -A
git commit -m "feat: integrate Memberstack authentication

- Add MemberstackProvider for auth management
- Create ProtectedRoute component
- Add auth landing page at /auth
- Update AuthProvider to use Memberstack
- Configure app ID: app_cmfpavrtq00zb0wws6asv8xf3"

echo ""
echo "🎯 Next Steps:"
echo "1. Add this to Vercel Environment Variables:"
echo "   NEXT_PUBLIC_MEMBERSTACK_APP_ID=app_cmfpavrtq00zb0wws6asv8xf3"
echo ""
echo "2. Configure Memberstack Dashboard:"
echo "   - Add custom fields: captainName, boatName"
echo "   - Create Beta Access plan"
echo "   - Set redirects"
echo ""
echo "3. Test locally: npm run dev"
echo "4. Visit http://localhost:3000/auth"
echo ""
echo "✅ Memberstack integration is ready!"
