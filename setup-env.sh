#!/bin/bash

# ABFI Environment Setup Script
# This script helps manage environment variables properly

echo "🌊 ABFI Environment Setup"
echo "========================"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    touch .env.local
fi

# Function to update or add environment variable
update_env() {
    local key=$1
    local value=$2
    
    if grep -q "^${key}=" .env.local; then
        # Update existing
        sed -i.bak "s|^${key}=.*|${key}=${value}|" .env.local
        echo "✅ Updated: ${key}"
    else
        # Add new
        echo "${key}=${value}" >> .env.local
        echo "✅ Added: ${key}"
    fi
}

echo ""
echo "Updating Copernicus credentials..."
update_env "COPERNICUS_USER" "jrosenkilde"
update_env "COPERNICUS_PASS" "fevhuh-wuvmo2-mafFus"

echo ""
echo "Adding Chlorophyll WMTS endpoint..."
update_env "CMEMS_CHL_WMTS_TEMPLATE" "https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OCEANCOLOUR_GLO_BGC_L4_NRT_009_102/cmems_obs-oc_glo_bgc-plankton_nrt_l4-gapfree-multi-4km_P1D_202311/CHL&STYLE=cmap:turbo&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&TIME={TIME}"

# Clean up backup files
rm -f .env.local.bak

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Review .env.local to ensure all variables are correct"
echo "2. Copy these same values to Vercel Environment Variables"
echo "3. Restart your development server: npm run dev"
echo ""
echo "For Vercel:"
echo "- Go to: https://vercel.com/dashboard"
echo "- Select your 'always-bent' project"
echo "- Go to Settings → Environment Variables"
echo "- Add/Update the variables above"
echo "- Redeploy your application"