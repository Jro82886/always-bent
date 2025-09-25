import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, AnalyzeSchema, WeatherSchema } from '@/lib/api';
import type { Result } from '@/types/domain';

// Keys for React Query
export const queryKeys = {
  weather: (inletId: string) => ['weather', inletId] as const,
  analysis: (params: any) => ['analysis', params] as const,
  vessels: (bbox: number[]) => ['vessels', bbox] as const,
  reports: (userId: string) => ['reports', userId] as const,
};

// Weather data hook
export function useWeather(inletId: string | null) {
  return useQuery({
    queryKey: queryKeys.weather(inletId || 'none'),
    queryFn: async () => {
      if (!inletId) throw new Error('No inlet selected');
      
      const result = await apiFetch(
        `/api/weather?inlet=${inletId}`,
        { method: 'GET' },
        WeatherSchema
      );
      
      if (!result.ok) throw result.error;
      return result.data;
    },
    enabled: !!inletId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
}

// Analysis data hook
export function useAnalysis(params: {
  polygon: GeoJSON.Polygon;
  timeISO: string;
  layers: string[];
} | null) {
  return useQuery({
    queryKey: queryKeys.analysis(params),
    queryFn: async () => {
      if (!params) throw new Error('No analysis parameters');
      
      const result = await apiFetch(
        '/api/rasters/sample',
        {
          method: 'POST',
          body: JSON.stringify(params),
          headers: { 'Content-Type': 'application/json' }
        },
        AnalyzeSchema
      );
      
      if (!result.ok) throw result.error;
      return result.data;
    },
    enabled: !!params,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// Save report mutation
export function useSaveReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (report: {
      source: string;
      type: string;
      version: number;
      snip_id: string;
      inlet_id: string;
      analysis_json: any;
    }) => {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate reports list
      queryClient.invalidateQueries({ 
        queryKey: ['reports'] 
      });
    }
  });
}
