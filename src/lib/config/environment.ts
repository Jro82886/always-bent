/**
 * Environment Configuration
 * Centralized environment variable management with validation
 */

// Copernicus Configuration
export const copernicusConfig = {
  user: process.env.COPERNICUS_USER,
  pass: process.env.COPERNICUS_PASS,
  wmtsBase: process.env.COPERNICUS_WMTS_BASE || 'https://wmts.marine.copernicus.eu/teroWmts',
  
  // Layer Templates
  layers: {
    sst: process.env.CMEMS_SST_WMTS_TEMPLATE,
    chl: process.env.CMEMS_CHL_WMTS_TEMPLATE,
  },
  
  // Validate required variables
  validate() {
    const required = ['COPERNICUS_USER', 'COPERNICUS_PASS'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.warn(`Missing Copernicus environment variables: ${missing.join(', ')}`);
      return false;
    }
    return true;
  }
};

// Helper to check if Copernicus is properly configured
export const isCopernicusConfigured = () => {
  return copernicusConfig.validate() && 
         (copernicusConfig.layers.sst || copernicusConfig.layers.chl);
};

// Export validated config
export const getWMTSConfig = (layer: 'sst' | 'chl') => {
  if (!isCopernicusConfigured()) {
    throw new Error('Copernicus not properly configured. Check environment variables.');
  }
  
  return {
    template: copernicusConfig.layers[layer],
    auth: {
      user: copernicusConfig.user!,
      pass: copernicusConfig.pass!
    }
  };
};
