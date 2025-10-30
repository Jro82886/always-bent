'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Flame } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface HotBiteAlertProps {
  inletId?: string | null; // If provided, only show alert for this inlet (can be null from store)
  className?: string;
}

interface InletHotBite {
  id: string;
  name: string;
  hot_bite_active: boolean;
  hot_bite_timestamp: string;
  hot_bite_count: number;
}

// Error classification
enum ErrorType {
  MIGRATION_NOT_RUN = 'migration_not_run',
  NETWORK = 'network',
  PERMISSION = 'permission',
  TIMEOUT = 'timeout',
  INVALID_DATA = 'invalid_data',
  UNKNOWN = 'unknown',
}

// Classify error for appropriate handling
function classifyError(error: any): ErrorType {
  // Migration not run yet (expected)
  if (
    !error ||
    Object.keys(error).length === 0 ||
    error.message?.includes('relation') ||
    error.message?.includes('does not exist') ||
    error.code === '42P01' // PostgreSQL: relation does not exist
  ) {
    return ErrorType.MIGRATION_NOT_RUN;
  }

  // Network errors
  if (
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    error.message?.includes('Failed to fetch') ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT'
  ) {
    return ErrorType.NETWORK;
  }

  // Permission errors
  if (
    error.message?.includes('permission') ||
    error.message?.includes('not authorized') ||
    error.code === '42501' // PostgreSQL: insufficient privilege
  ) {
    return ErrorType.PERMISSION;
  }

  // Timeout
  if (error.message?.includes('timeout') || error.code === 'ABORT_ERR') {
    return ErrorType.TIMEOUT;
  }

  // Invalid data
  if (error.message?.includes('invalid') || error.message?.includes('parse')) {
    return ErrorType.INVALID_DATA;
  }

  return ErrorType.UNKNOWN;
}

export default function HotBiteAlert({ inletId, className = '' }: HotBiteAlertProps) {
  const [hotBiteInlets, setHotBiteInlets] = useState<InletHotBite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 3000, 5000]; // Progressive backoff

  const fetchHotBites = useCallback(async (attemptNumber = 0) => {
    try {
      let query = supabase
        .from('inlets')
        .select('*')
        .eq('hot_bite_active', true);

      // Filter by specific inlet if provided (skip if null or 'overview')
      if (inletId && inletId !== 'overview') {
        query = query.eq('id', inletId);
      }

      const { data, error } = await query;

      if (error) {
        const errorType = classifyError(error);

        switch (errorType) {
          case ErrorType.MIGRATION_NOT_RUN:
            // Expected - migration hasn't been run yet
            // Silently fail, no retry needed
            setHotBiteInlets([]);
            setIsLoading(false);
            return;

          case ErrorType.NETWORK:
          case ErrorType.TIMEOUT:
            // Transient errors - retry with backoff
            if (attemptNumber < MAX_RETRIES) {
              const delay = RETRY_DELAYS[attemptNumber] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
              if (process.env.NODE_ENV === 'development') {
                console.warn(
                  `[HotBiteAlert] ${errorType} error, retrying in ${delay}ms (attempt ${attemptNumber + 1}/${MAX_RETRIES})`,
                  error
                );
              }

              retryTimeoutRef.current = setTimeout(() => {
                fetchHotBites(attemptNumber + 1);
              }, delay);
              return;
            } else {
              // Max retries reached
              if (process.env.NODE_ENV === 'development') {
                console.error(`[HotBiteAlert] Max retries reached for ${errorType}`, error);
              }
              setHotBiteInlets([]);
              setIsLoading(false);
              return;
            }

          case ErrorType.PERMISSION:
            // Permission error - log for debugging but don't retry
            console.error('[HotBiteAlert] Permission denied:', error);
            setHotBiteInlets([]);
            setIsLoading(false);
            return;

          case ErrorType.INVALID_DATA:
            // Data error - log and fail gracefully
            console.error('[HotBiteAlert] Invalid data received:', error);
            setHotBiteInlets([]);
            setIsLoading(false);
            return;

          case ErrorType.UNKNOWN:
          default:
            // Unknown error - log and fail gracefully
            if (process.env.NODE_ENV === 'development') {
              console.error('[HotBiteAlert] Unknown error:', error);
            }
            setHotBiteInlets([]);
            setIsLoading(false);
            return;
        }
      }

      // Success - validate data before setting state
      if (data && Array.isArray(data)) {
        // Validate each inlet has required fields
        const validInlets = data.filter((inlet) => {
          return (
            inlet.id &&
            inlet.name &&
            typeof inlet.hot_bite_active === 'boolean' &&
            inlet.hot_bite_timestamp &&
            typeof inlet.hot_bite_count === 'number'
          );
        });

        setHotBiteInlets(validInlets);
        setRetryCount(0); // Reset retry count on success
      } else {
        setHotBiteInlets([]);
      }

      setIsLoading(false);
    } catch (error: any) {
      const errorType = classifyError(error);

      // Handle thrown exceptions (not Supabase errors)
      if (errorType === ErrorType.MIGRATION_NOT_RUN) {
        // Silently fail
        setHotBiteInlets([]);
        setIsLoading(false);
        return;
      }

      // For network/timeout, retry
      if (
        (errorType === ErrorType.NETWORK || errorType === ErrorType.TIMEOUT) &&
        attemptNumber < MAX_RETRIES
      ) {
        const delay = RETRY_DELAYS[attemptNumber] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `[HotBiteAlert] Exception caught, retrying in ${delay}ms (attempt ${attemptNumber + 1}/${MAX_RETRIES})`,
            error
          );
        }

        retryTimeoutRef.current = setTimeout(() => {
          fetchHotBites(attemptNumber + 1);
        }, delay);
        return;
      }

      // Log other errors
      if (process.env.NODE_ENV === 'development') {
        console.error('[HotBiteAlert] Failed to fetch hot bites:', error);
      }

      setHotBiteInlets([]);
      setIsLoading(false);
    }
  }, [inletId]);

  useEffect(() => {
    let subscription: any;

    // Clear any pending retries
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    // Initial fetch
    fetchHotBites();

    // Subscribe to real-time updates
    subscription = supabase
      .channel('hot-bite-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inlets',
          filter: inletId && inletId !== 'overview' ? `id=eq.${inletId}` : undefined
        },
        (payload) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[HotBiteAlert] Real-time update received:', payload);
          }
          fetchHotBites();
        }
      )
      .subscribe((status, err) => {
        if (err) {
          const errorType = classifyError(err);
          if (errorType !== ErrorType.MIGRATION_NOT_RUN) {
            console.error('[HotBiteAlert] Subscription error:', err);
          }
        }
        if (status === 'SUBSCRIBED' && process.env.NODE_ENV === 'development') {
          console.log('[HotBiteAlert] Subscribed to real-time updates');
        }
      });

    return () => {
      // Clear any pending retries
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      // Unsubscribe from real-time updates
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [inletId, fetchHotBites]);

  if (isLoading || hotBiteInlets.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {hotBiteInlets.map((inlet) => {
        // Safely calculate time elapsed
        let timeAgoText = 'now';
        try {
          const timestamp = new Date(inlet.hot_bite_timestamp);
          if (!isNaN(timestamp.getTime())) {
            const minutesAgo = Math.floor((Date.now() - timestamp.getTime()) / 60000);
            if (minutesAgo < 0) {
              timeAgoText = 'now'; // Future timestamp (clock skew)
            } else if (minutesAgo < 60) {
              timeAgoText = `${minutesAgo}m ago`;
            } else {
              const hoursAgo = Math.floor(minutesAgo / 60);
              timeAgoText = `${hoursAgo}h ago`;
            }
          }
        } catch (error) {
          // Invalid timestamp - use fallback
          if (process.env.NODE_ENV === 'development') {
            console.warn('[HotBiteAlert] Invalid timestamp:', inlet.hot_bite_timestamp);
          }
        }

        // Safely get bite count
        const biteCount = typeof inlet.hot_bite_count === 'number' ? inlet.hot_bite_count : 0;

        return (
          <div
            key={inlet.id}
            className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 rounded-lg backdrop-blur-sm animate-pulse-slow"
            role="alert"
          >
            <Flame
              className="w-5 h-5 text-orange-400 flex-shrink-0 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-orange-100 text-sm uppercase tracking-wide">
                  🔥 HOT BITE ALERT
                </span>
                <span className="text-xs text-orange-300/80">{timeAgoText}</span>
              </div>
              <p className="text-sm text-white/90 mt-0.5">
                <span className="font-medium">{inlet.name || 'Unknown Location'}</span>
                {' — '}
                <span className="text-orange-200">
                  {biteCount} {biteCount === 1 ? 'bite' : 'bites'} reported in the last hour
                </span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
