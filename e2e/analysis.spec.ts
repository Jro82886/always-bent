import { test, expect } from '@playwright/test';

test.describe('Analysis Page', () => {
  test('should load without errors', async ({ page }) => {
    // Navigate to analysis page
    await page.goto('/legendary/analysis');
    
    // Wait for map to load
    await page.waitForSelector('.mapboxgl-canvas', { timeout: 10000 });
    
    // Check that page loaded
    await expect(page.locator('text=Analysis')).toBeVisible();
    
    // Check for no console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Give page time to fully load
    await page.waitForTimeout(2000);
    
    expect(consoleErrors).toHaveLength(0);
  });

  test('should show SST toggle', async ({ page }) => {
    await page.goto('/legendary/analysis');
    
    // Check for SST toggle
    await expect(page.locator('text=SST')).toBeVisible();
  });

  test('should show Draw Analysis Area button', async ({ page }) => {
    await page.goto('/legendary/analysis');
    
    // Check for snip tool button
    await expect(page.locator('text=Draw Analysis Area')).toBeVisible();
  });
});
