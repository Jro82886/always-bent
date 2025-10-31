import { toVM } from '@/types/analyze';
import { useAppState } from '@/lib/store';

export async function runAnalyze(polygon: GeoJSON.Polygon, dateISO: string) {
  const inletId = useAppState.getState().selectedInletId;

  // Use today's date for real-time ocean data
  const today = new Date();
  const analyzeDate = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  console.log('[analyzeClient] Using date:', analyzeDate, '(requested:', dateISO, ')');

  // Create an AbortController for timeout - match API's maxDuration
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn('[analyzeClient] Request timed out after 125 seconds');
    controller.abort();
  }, 125000); // 125 second timeout (giving 5s buffer beyond API's 120s limit)

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        polygon,
        date: analyzeDate,
        want: { sst: true, chl: true },
        inletId
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[analyzeClient] API error:', res.status, errorText);

      // Try to parse error details
      try {
        const errorData = JSON.parse(errorText);
        console.error('[analyzeClient] Error details:', errorData);
      } catch {}

      throw new Error(`Analysis failed: ${res.status}`);
    }

    const api = await res.json();
    return toVM(api); // your converter (°C→°F, gradient per mile, etc.)
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.error('[analyzeClient] Request timed out');
      throw new Error('Analysis request timed out. The Copernicus API may be slow. Please try again.');
    }
    throw error;
  }
}
