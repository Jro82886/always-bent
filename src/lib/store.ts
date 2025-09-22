/**
 * Simple app state store
 * This is a minimal implementation to fix build errors
 * Replace with actual state management solution as needed
 */

interface AppState {
  selectedInletId: string | null;
  isoDate: string;
  user: {
    id: string;
  } | null;
}

// Default state
const defaultState: AppState = {
  selectedInletId: null,
  isoDate: new Date().toISOString().split('T')[0],
  user: null
};

// Simple hook that returns static state
// In production, this should connect to actual state management
export function useAppState(): AppState {
  return defaultState;
}
