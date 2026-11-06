/**
 * Turns an axios error into a message a human can act on.
 * Backend validation errors return `{ error, details }` with NO `message`,
 * and network/CORS failures return no response at all — both used to show
 * the useless generic fallback (e.g. "Registration failed").
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const error = err as {
    response?: { data?: { message?: string; details?: Array<{ field: string; message: string }> } };
    request?: unknown;
  };

  const data = error?.response?.data;

  if (data?.message) return data.message;

  if (Array.isArray(data?.details) && data.details.length > 0) {
    return data.details.map((d) => `${d.field}: ${d.message}`).join(' · ');
  }

  if (error?.request && !error?.response) {
    return 'Cannot reach the API server. Check NEXT_PUBLIC_API_URL (Vercel env var) and that the backend is deployed and running.';
  }

  return fallback;
}
