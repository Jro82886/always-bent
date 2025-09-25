import { z } from "zod";
import type { Result } from "@/types/domain";

// Schema definitions for API responses
export const AnalyzeSchema = z.object({
  timeUsed: z.string(),
  results: z.object({
    sst: z.object({
      units: z.literal("°F"),
      count: z.number().int(),
      mean: z.number(),
      min: z.number(),
      max: z.number(),
      p10: z.number(),
      p50: z.number(),
      p90: z.number(),
      stdev: z.number(),
      gradient: z.number()
    }).optional(),
    chl: z.object({
      units: z.literal("mg/m³"),
      count: z.number().int(),
      mean: z.number(),
      min: z.number(),
      max: z.number(),
      p10: z.number(),
      p50: z.number(),
      p90: z.number(),
      stdev: z.number(),
      gradient: z.number()
    }).optional()
  }),
  notes: z.array(z.string()).optional(),
  requested_at: z.string(),
  request_id: z.string().optional()
});

export const WeatherSchema = z.object({
  wind: z.object({
    speed: z.number(),
    direction: z.number(),
    gusts: z.number().optional()
  }),
  waves: z.object({
    height: z.number(),
    period: z.number(),
    direction: z.number().optional()
  }),
  temperature: z.object({
    air: z.number(),
    water: z.number()
  }),
  conditions: z.string(),
  updated_at: z.string()
});

// Centralized fetch with timeout, retry, and validation
export async function apiFetch<T extends z.ZodTypeAny>(
  url: string,
  init: RequestInit,
  schema: T,
  { timeoutMs = 10000, retries = 1 }: { timeoutMs?: number; retries?: number } = {}
): Promise<Result<z.infer<T>>> {
  for (let i = 0; i <= retries; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    
    try {
      const res = await fetch(url, { 
        ...init, 
        signal: ctrl.signal, 
        headers: { 
          "X-ABFI-Client": "web", 
          ...(init.headers || {}) 
        }
      });
      
      clearTimeout(t);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const json = await res.json();
      const parsed = schema.parse(json);
      
      return { ok: true, data: parsed };
    } catch (e) {
      clearTimeout(t);
      
      if (i === retries) {
        if (e instanceof z.ZodError) {
          return { 
            ok: false, 
            error: new Error(`Invalid response format: ${e.errors.map(err => err.message).join(', ')}`)
          };
        }
        
        return { 
          ok: false, 
          error: e instanceof Error ? e : new Error(String(e)) 
        };
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  return { ok: false, error: new Error("Unknown error") };
}

// Convenience wrappers for common API calls
export async function fetchAnalysis(body: unknown) {
  return apiFetch(
    "/api/rasters/sample",
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" }
    },
    AnalyzeSchema
  );
}

export async function fetchWeather(inletId: string) {
  return apiFetch(
    `/api/weather?inlet=${inletId}`,
    { method: "GET" },
    WeatherSchema
  );
}
