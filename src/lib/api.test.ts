import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch, AnalyzeSchema } from './api';
import { z } from 'zod';

// Mock fetch
global.fetch = vi.fn();

describe('apiFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle successful response', async () => {
    const mockData = {
      timeUsed: '2025-09-24T12:00:00Z',
      results: {
        sst: {
          units: '°F' as const,
          count: 100,
          mean: 78.5,
          min: 76.0,
          max: 81.0,
          p10: 76.5,
          p50: 78.5,
          p90: 80.5,
          stdev: 1.2,
          gradient: 0.5
        }
      },
      requested_at: '2025-09-24T12:00:00Z'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const result = await apiFetch('/api/test', {}, AnalyzeSchema);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.results.sst?.mean).toBe(78.5);
    }
  });

  it('should handle network errors with retry', async () => {
    (global.fetch as any)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ timeUsed: '2025-09-24T12:00:00Z', results: {}, requested_at: '2025-09-24T12:00:00Z' })
      });

    const result = await apiFetch('/api/test', {}, AnalyzeSchema, { retries: 1 });

    expect(result.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should handle validation errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalid: 'data' })
    });

    const result = await apiFetch('/api/test', {}, AnalyzeSchema);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Invalid response format');
    }
  });

  it('should timeout after specified duration', async () => {
    (global.fetch as any).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 200))
    );

    const result = await apiFetch('/api/test', {}, AnalyzeSchema, { timeoutMs: 50 });

    expect(result.ok).toBe(false);
  });
});
