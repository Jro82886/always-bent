import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import HotBiteAlert from '@/components/HotBiteAlert';
import { supabase } from '@/lib/supabaseClient';

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
  },
}));

describe('HotBiteAlert Component', () => {
  const mockSubscribe = vi.fn();
  const mockUnsubscribe = vi.fn();
  const mockOn = vi.fn();
  let mockChannel: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Setup channel mock
    mockChannel = {
      on: mockOn.mockReturnThis(),
      subscribe: mockSubscribe.mockReturnValue({
        unsubscribe: mockUnsubscribe,
      }),
    };

    (supabase.channel as any).mockReturnValue(mockChannel);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('should render nothing when loading', () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: null,
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      const { container } = render(<HotBiteAlert />);
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when no hot bites', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      const { container } = render(<HotBiteAlert />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('should handle table not existing gracefully', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: {},
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      const { container } = render(<HotBiteAlert />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('Hot Bite Display', () => {
    it('should display hot bite alert when active', async () => {
      const mockHotBite = {
        id: 'md-ocean-city',
        name: 'Ocean City, MD',
        hot_bite_active: true,
        hot_bite_timestamp: new Date().toISOString(),
        hot_bite_count: 5,
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [mockHotBite],
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(<HotBiteAlert />);

      await waitFor(() => {
        expect(screen.getByText(/HOT BITE ALERT/i)).toBeInTheDocument();
        expect(screen.getByText('Ocean City, MD')).toBeInTheDocument();
        expect(screen.getByText(/5 bites reported in the last hour/i)).toBeInTheDocument();
      });
    });

    it('should display time elapsed correctly (minutes)', async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const mockHotBite = {
        id: 'md-ocean-city',
        name: 'Ocean City, MD',
        hot_bite_active: true,
        hot_bite_timestamp: fiveMinutesAgo,
        hot_bite_count: 4,
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [mockHotBite],
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(<HotBiteAlert />);

      await waitFor(() => {
        expect(screen.getByText(/5m ago/i)).toBeInTheDocument();
      });
    });

    it('should display time elapsed correctly (hours)', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      const mockHotBite = {
        id: 'md-ocean-city',
        name: 'Ocean City, MD',
        hot_bite_active: true,
        hot_bite_timestamp: twoHoursAgo,
        hot_bite_count: 6,
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [mockHotBite],
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(<HotBiteAlert />);

      await waitFor(() => {
        expect(screen.getByText(/2h ago/i)).toBeInTheDocument();
      });
    });

    it('should display multiple hot bite alerts', async () => {
      const mockHotBites = [
        {
          id: 'md-ocean-city',
          name: 'Ocean City, MD',
          hot_bite_active: true,
          hot_bite_timestamp: new Date().toISOString(),
          hot_bite_count: 5,
        },
        {
          id: 'ma-cape-cod',
          name: 'Cape Cod, MA',
          hot_bite_active: true,
          hot_bite_timestamp: new Date().toISOString(),
          hot_bite_count: 7,
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockHotBites,
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(<HotBiteAlert />);

      await waitFor(() => {
        expect(screen.getByText('Ocean City, MD')).toBeInTheDocument();
        expect(screen.getByText('Cape Cod, MA')).toBeInTheDocument();
        expect(screen.getByText(/5 bites reported in the last hour/i)).toBeInTheDocument();
        expect(screen.getByText(/7 bites reported in the last hour/i)).toBeInTheDocument();
      });
    });
  });

  describe('Inlet Filtering', () => {
    it('should filter alerts by inlet ID', async () => {
      const mockHotBite = {
        id: 'md-ocean-city',
        name: 'Ocean City, MD',
        hot_bite_active: true,
        hot_bite_timestamp: new Date().toISOString(),
        hot_bite_count: 4,
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [mockHotBite],
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(<HotBiteAlert inletId="md-ocean-city" />);

      await waitFor(() => {
        expect(screen.getByText('Ocean City, MD')).toBeInTheDocument();
      });

      // Verify filter was applied
      const fromCall = (supabase.from as any).mock.calls[0][0];
      expect(fromCall).toBe('inlets');
    });

    it('should not filter when inletId is "overview"', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(<HotBiteAlert inletId="overview" />);

      await waitFor(() => {
        const selectCalls = mockFrom.mock.results[0].value.select.mock.calls;
        expect(selectCalls.length).toBeGreaterThan(0);
      });
    });

    it('should handle null inletId gracefully', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(<HotBiteAlert inletId={null} />);

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalled();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should subscribe to real-time updates', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(<HotBiteAlert />);

      await waitFor(() => {
        expect(supabase.channel).toHaveBeenCalledWith('hot-bite-alerts');
        expect(mockOn).toHaveBeenCalledWith(
          'postgres_changes',
          expect.objectContaining({
            event: '*',
            schema: 'public',
            table: 'inlets',
          }),
          expect.any(Function)
        );
        expect(mockSubscribe).toHaveBeenCalled();
      });
    });

    it('should unsubscribe on unmount', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      const { unmount } = render(<HotBiteAlert />);

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should refetch data when real-time update received', async () => {
      let realtimeCallback: Function;

      mockOn.mockImplementation((event: string, config: any, callback: Function) => {
        realtimeCallback = callback;
        return mockChannel;
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(<HotBiteAlert />);

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalled();
      });

      // Clear previous calls
      mockFrom.mockClear();

      // Simulate real-time update
      realtimeCallback!({ eventType: 'UPDATE' });

      // Should refetch data
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('inlets');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle empty error objects gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: {},
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      const { container } = render(<HotBiteAlert />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });

      // Should not log error for empty error object
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle relation errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'relation "inlets" does not exist' },
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      const { container } = render(<HotBiteAlert />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });

      // Should not log error for relation errors (expected before migration)
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle network errors gracefully', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockRejectedValue(new Error('Network error')),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      const { container } = render(<HotBiteAlert />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', async () => {
      const mockHotBite = {
        id: 'md-ocean-city',
        name: 'Ocean City, MD',
        hot_bite_active: true,
        hot_bite_timestamp: new Date().toISOString(),
        hot_bite_count: 4,
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [mockHotBite],
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(<HotBiteAlert />);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });

    it('should have fire icon with aria-hidden', async () => {
      const mockHotBite = {
        id: 'md-ocean-city',
        name: 'Ocean City, MD',
        hot_bite_active: true,
        hot_bite_timestamp: new Date().toISOString(),
        hot_bite_count: 4,
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [mockHotBite],
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      const { container } = render(<HotBiteAlert />);

      await waitFor(() => {
        const icon = container.querySelector('[aria-hidden="true"]');
        expect(icon).toBeInTheDocument();
      });
    });
  });
});
