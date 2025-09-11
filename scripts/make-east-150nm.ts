// Simplified 150 nm East Coast offshore strip
import fs from "fs";
import path from "path";

// Create a simplified 150 nm offshore strip for the East Coast
// This is a basic rectangle covering East Coast from Maine to Florida
const EAST_COAST_150NM = {
  type: "Feature",
  properties: {
    name: "East Coast 150 nm Offshore Strip",
    description: "150 nautical miles seaward from U.S. East Coast (ME-FL, Atlantic only)"
  },
  geometry: {
    type: "Polygon",
    coordinates: [[
      [-85, 24], // Southwest corner
      [-60, 24], // Southeast corner
      [-60, 46], // Northeast corner
      [-85, 46], // Northwest corner
      [-85, 24]  // Close the polygon
    ]]
  }
};

function main() {
  const outputDir = path.join(process.cwd(), "public", "aoi");
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, "east_150nm.geojson");
  fs.writeFileSync(outputPath, JSON.stringify(EAST_COAST_150NM, null, 2));

  console.log("✅ Wrote simplified East Coast 150 nm AOI to:", outputPath);
  console.log("📍 Bounding box: [-85, 24, -60, 46] (SW lng/lat, NE lng/lat)");
  console.log("📏 Approximate area: ~150 nm offshore from Maine to Florida");
}

main();


