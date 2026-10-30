/** Analytics abstraction: a no-op until VITE_ANALYTICS_ENDPOINT is configured AND the player opts in. No personal data is collected. */
const env = (import.meta as any).env ?? {};
const ENDPOINT: string = env.VITE_ANALYTICS_ENDPOINT ?? '';
let enabled = false;
export const analyticsConfigured = () => !!ENDPOINT;
export function setAnalytics(on: boolean) { enabled = on && !!ENDPOINT; }
export function track(event: string, props: Record<string, string | number | boolean> = {}) {
  if (!enabled) return;
  try { navigator.sendBeacon?.(ENDPOINT, JSON.stringify({ e: event, p: props, t: Date.now() })); } catch { /* ignore */ }
}
