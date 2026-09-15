/**
 * Universal safeFetch utility
 * Prevents "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
 * across all browsers (Chrome, Safari, Firefox, Edge, Android Chrome, Samsung Internet, iOS Safari)
 */

export async function safeJson<T = any>(res: Response, fallbackValue: T = null as any): Promise<T> {
  try {
    const text = await res.text();
    if (!text || !text.trim()) {
      return fallbackValue;
    }
    return JSON.parse(text) as T;
  } catch (err) {
    console.warn('[safeJson] Non-JSON or empty response caught gracefully:', err);
    return fallbackValue;
  }
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackValue: T = null as any
): Promise<{ ok: boolean; status: number; data: T }> {
  try {
    const res = await fetch(input, init);
    const data = await safeJson<T>(res, fallbackValue);
    return {
      ok: res.ok,
      status: res.status,
      data: data ?? fallbackValue,
    };
  } catch (err: any) {
    console.warn(`[safeFetchJson] Network error for ${input}:`, err);
    return {
      ok: false,
      status: 0,
      data: fallbackValue,
    };
  }
}
