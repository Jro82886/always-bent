const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Create a simple 192x192 blue icon for the app
async function createIcon() {
  const iconPath = path.join(__dirname, '..', 'public', 'icon-192.png');

  try {
    // Create a blue gradient icon
    const svg = `
      <svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0066CC;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#004499;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="192" height="192" fill="url(#grad)" rx="20" />
        <text x="96" y="110" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">ABFI</text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(iconPath);

    console.log('Icon created successfully at:', iconPath);
  } catch (error) {
    console.error('Error creating icon:', error);

    // Fallback: create a simple blue square
    try {
      await sharp({
        create: {
          width: 192,
          height: 192,
          channels: 4,
          background: { r: 0, g: 102, b: 204, alpha: 1 }
        }
      })
      .png()
      .toFile(iconPath);

      console.log('Fallback icon created successfully');
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
  }
}

createIcon();