import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hot Bite Detection Integration Tests
 *
 * IMPORTANT: These tests require the database migration to be run first
 * Run: supabase/migrations/20251027_hot_bite_alerts.sql
 *
 * Tests the PostgreSQL trigger logic for hot bite detection
 */

describe('Hot Bite Detection System', () => {
  const TEST_USER_ID = 'test-user-hot-bite-' + Date.now();
  const TEST_INLET = 'md-ocean-city';

  beforeAll(async () => {
    // Verify database tables exist
    const { error: inletsError } = await supabase
      .from('inlets')
      .select('id')
      .limit(1);

    if (inletsError) {
      throw new Error(
        'Database tables not found. Please run migration first: ' +
        'supabase/migrations/20251027_hot_bite_alerts.sql'
      );
    }
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await supabase
      .from('bite_reports')
      .delete()
      .ilike('bite_id', 'test-hot-bite-%');

    // Reset hot bite status for test inlet
    await supabase
      .from('inlets')
      .update({
        hot_bite_active: false,
        hot_bite_count: 0,
        hot_bite_timestamp: null,
      })
      .eq('id', TEST_INLET);
  });

  afterAll(async () => {
    // Clean up all test data
    await supabase
      .from('bite_reports')
      .delete()
      .ilike('bite_id', 'test-hot-bite-%');

    // Reset test inlet
    await supabase
      .from('inlets')
      .update({
        hot_bite_active: false,
        hot_bite_count: 0,
        hot_bite_timestamp: null,
      })
      .eq('id', TEST_INLET);
  });

  describe('Trigger Activation', () => {
    it('should NOT activate hot bite alert with 3 bites', async () => {
      // Create 3 bite reports
      const bites = [
        {
          bite_id: `test-hot-bite-1-${Date.now()}`,
          user_id: TEST_USER_ID,
          lat: 38.3286,
          lon: -75.0906,
          inlet_id: TEST_INLET,
          created_at: new Date().toISOString(),
        },
        {
          bite_id: `test-hot-bite-2-${Date.now()}`,
          user_id: TEST_USER_ID,
          lat: 38.3286,
          lon: -75.0906,
          inlet_id: TEST_INLET,
          created_at: new Date().toISOString(),
        },
        {
          bite_id: `test-hot-bite-3-${Date.now()}`,
          user_id: TEST_USER_ID,
          lat: 38.3286,
          lon: -75.0906,
          inlet_id: TEST_INLET,
          created_at: new Date().toISOString(),
        },
      ];

      for (const bite of bites) {
        await supabase.from('bite_reports').insert(bite);
      }

      // Check inlet status
      const { data: inlet } = await supabase
        .from('inlets')
        .select('hot_bite_active, hot_bite_count')
        .eq('id', TEST_INLET)
        .single();

      expect(inlet?.hot_bite_active).toBe(false);
      expect(inlet?.hot_bite_count).toBeLessThan(4);
    });

    it('should activate hot bite alert with 4 bites', async () => {
      // Create 4 bite reports
      const bites = [
        {
          bite_id: `test-hot-bite-1-${Date.now()}`,
          user_id: TEST_USER_ID,
          lat: 38.3286,
          lon: -75.0906,
          inlet_id: TEST_INLET,
          created_at: new Date().toISOString(),
        },
        {
          bite_id: `test-hot-bite-2-${Date.now()}`,
          user_id: TEST_USER_ID,
          lat: 38.3286,
          lon: -75.0906,
          inlet_id: TEST_INLET,
          created_at: new Date().toISOString(),
        },
        {
          bite_id: `test-hot-bite-3-${Date.now()}`,
          user_id: TEST_USER_ID,
          lat: 38.3286,
          lon: -75.0906,
          inlet_id: TEST_INLET,
          created_at: new Date().toISOString(),
        },
        {
          bite_id: `test-hot-bite-4-${Date.now()}`,
          user_id: TEST_USER_ID,
          lat: 38.3286,
          lon: -75.0906,
          inlet_id: TEST_INLET,
          created_at: new Date().toISOString(),
        },
      ];

      for (const bite of bites) {
        await supabase.from('bite_reports').insert(bite);
      }

      // Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check inlet status
      const { data: inlet } = await supabase
        .from('inlets')
        .select('*')
        .eq('id', TEST_INLET)
        .single();

      expect(inlet?.hot_bite_active).toBe(true);
      expect(inlet?.hot_bite_count).toBeGreaterThanOrEqual(4);
      expect(inlet?.hot_bite_timestamp).toBeTruthy();
    });

    it('should keep hot bite active with 5+ bites', async () => {
      // Create 6 bite reports
      const bites = Array.from({ length: 6 }, (_, i) => ({
        bite_id: `test-hot-bite-${i + 1}-${Date.now()}`,
        user_id: TEST_USER_ID,
        lat: 38.3286,
        lon: -75.0906,
        inlet_id: TEST_INLET,
        created_at: new Date().toISOString(),
      }));

      for (const bite of bites) {
        await supabase.from('bite_reports').insert(bite);
      }

      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check inlet status
      const { data: inlet } = await supabase
        .from('inlets')
        .select('hot_bite_active, hot_bite_count')
        .eq('id', TEST_INLET)
        .single();

      expect(inlet?.hot_bite_active).toBe(true);
      expect(inlet?.hot_bite_count).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Bite Highlighting', () => {
    it('should highlight bite reports when hot bite activates', async () => {
      // Create 4 bite reports
      const biteIds = Array.from({ length: 4 }, (_, i) =>
        `test-hot-bite-highlight-${i + 1}-${Date.now()}`
      );

      for (const biteId of biteIds) {
        await supabase.from('bite_reports').insert({
          bite_id: biteId,
          user_id: TEST_USER_ID,
          lat: 38.3286,
          lon: -75.0906,
          inlet_id: TEST_INLET,
          created_at: new Date().toISOString(),
        });
      }

      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check that bites are highlighted
      const { data: highlightedBites } = await supabase
        .from('bite_reports')
        .select('bite_id, is_highlighted')
        .in('bite_id', biteIds);

      expect(highlightedBites).toBeTruthy();
      expect(highlightedBites?.length).toBe(4);

      // All should be highlighted
      const allHighlighted = highlightedBites?.every(bite => bite.is_highlighted === true);
      expect(allHighlighted).toBe(true);
    });

    it('should NOT highlight old bites outside 1-hour window', async () => {
      // Create old bite (2 hours ago)
      const oldBiteId = `test-hot-bite-old-${Date.now()}`;
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      await supabase.from('bite_reports').insert({
        bite_id: oldBiteId,
        user_id: TEST_USER_ID,
        lat: 38.3286,
        lon: -75.0906,
        inlet_id: TEST_INLET,
        created_at: twoHoursAgo,
      });

      // Create 4 recent bites
      const recentBiteIds = Array.from({ length: 4 }, (_, i) =>
        `test-hot-bite-recent-${i + 1}-${Date.now()}`
      );

      for (const biteId of recentBiteIds) {
        await supabase.from('bite_reports').insert({
          bite_id: biteId,
          user_id: TEST_USER_ID,
          lat: 38.3286,
          lon: -75.0906,
          inlet_id: TEST_INLET,
          created_at: new Date().toISOString(),
        });
      }

      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check old bite is NOT highlighted
      const { data: oldBite } = await supabase
        .from('bite_reports')
        .select('is_highlighted')
        .eq('bite_id', oldBiteId)
        .single();

      expect(oldBite?.is_highlighted).toBe(false);

      // Check recent bites ARE highlighted
      const { data: recentBites } = await supabase
        .from('bite_reports')
        .select('is_highlighted')
        .in('bite_id', recentBiteIds);

      const allRecentHighlighted = recentBites?.every(bite => bite.is_highlighted === true);
      expect(allRecentHighlighted).toBe(true);
    });
  });

  describe('Multi-Inlet Isolation', () => {
    it('should NOT trigger alert in different inlet', async () => {
      const OTHER_INLET = 'ma-cape-cod';

      // Create 4 bites in Ocean City
      const oceanCityBites = Array.from({ length: 4 }, (_, i) => ({
        bite_id: `test-hot-bite-oc-${i + 1}-${Date.now()}`,
        user_id: TEST_USER_ID,
        lat: 38.3286,
        lon: -75.0906,
        inlet_id: TEST_INLET,
        created_at: new Date().toISOString(),
      }));

      for (const bite of oceanCityBites) {
        await supabase.from('bite_reports').insert(bite);
      }

      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check Ocean City has hot bite
      const { data: oceanCity } = await supabase
        .from('inlets')
        .select('hot_bite_active')
        .eq('id', TEST_INLET)
        .single();

      expect(oceanCity?.hot_bite_active).toBe(true);

      // Check Cape Cod does NOT have hot bite
      const { data: capeCod } = await supabase
        .from('inlets')
        .select('hot_bite_active')
        .eq('id', OTHER_INLET)
        .single();

      expect(capeCod?.hot_bite_active).toBe(false);
    });

    it('should track separate bite counts per inlet', async () => {
      const OTHER_INLET = 'ma-cape-cod';

      // Create 4 bites in Ocean City
      for (let i = 0; i < 4; i++) {
        await supabase.from('bite_reports').insert({
          bite_id: `test-hot-bite-oc-${i}-${Date.now()}`,
          user_id: TEST_USER_ID,
          lat: 38.3286,
          lon: -75.0906,
          inlet_id: TEST_INLET,
          created_at: new Date().toISOString(),
        });
      }

      // Create 2 bites in Cape Cod
      for (let i = 0; i < 2; i++) {
        await supabase.from('bite_reports').insert({
          bite_id: `test-hot-bite-cc-${i}-${Date.now()}`,
          user_id: TEST_USER_ID,
          lat: 41.7717,
          lon: -70.5183,
          inlet_id: OTHER_INLET,
          created_at: new Date().toISOString(),
        });
      }

      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check counts are separate
      const { data: oceanCity } = await supabase
        .from('inlets')
        .select('hot_bite_count, hot_bite_active')
        .eq('id', TEST_INLET)
        .single();

      const { data: capeCod } = await supabase
        .from('inlets')
        .select('hot_bite_count, hot_bite_active')
        .eq('id', OTHER_INLET)
        .single();

      expect(oceanCity?.hot_bite_count).toBeGreaterThanOrEqual(4);
      expect(oceanCity?.hot_bite_active).toBe(true);

      expect(capeCod?.hot_bite_count).toBeLessThan(4);
      expect(capeCod?.hot_bite_active).toBe(false);
    });
  });

  describe('Cleanup Function', () => {
    it('should deactivate alerts older than 2 hours', async () => {
      // Manually set an old hot bite
      const twoHoursOneMinuteAgo = new Date(Date.now() - (2 * 60 + 1) * 60 * 1000).toISOString();

      await supabase
        .from('inlets')
        .update({
          hot_bite_active: true,
          hot_bite_timestamp: twoHoursOneMinuteAgo,
          hot_bite_count: 5,
        })
        .eq('id', TEST_INLET);

      // Call cleanup function
      const { error } = await supabase.rpc('cleanup_hot_bites');

      expect(error).toBeNull();

      // Check alert is deactivated
      const { data: inlet } = await supabase
        .from('inlets')
        .select('hot_bite_active')
        .eq('id', TEST_INLET)
        .single();

      expect(inlet?.hot_bite_active).toBe(false);
    });

    it('should NOT deactivate recent alerts', async () => {
      // Set a recent hot bite
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      await supabase
        .from('inlets')
        .update({
          hot_bite_active: true,
          hot_bite_timestamp: oneHourAgo,
          hot_bite_count: 5,
        })
        .eq('id', TEST_INLET);

      // Call cleanup function
      await supabase.rpc('cleanup_hot_bites');

      // Check alert is still active
      const { data: inlet } = await supabase
        .from('inlets')
        .select('hot_bite_active')
        .eq('id', TEST_INLET)
        .single();

      expect(inlet?.hot_bite_active).toBe(true);
    });
  });

  describe('Row Level Security', () => {
    it('should allow anyone to read inlet status', async () => {
      // This should work without authentication
      const { data, error } = await supabase
        .from('inlets')
        .select('*')
        .eq('id', TEST_INLET)
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });

    it('should have inlets seeded with data', async () => {
      const { data: inlets } = await supabase
        .from('inlets')
        .select('id, name');

      expect(inlets).toBeTruthy();
      expect(inlets?.length).toBeGreaterThanOrEqual(7); // 7 East Coast inlets seeded
    });
  });
});
