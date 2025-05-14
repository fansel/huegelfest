export function getWebSocketUrl(path = '/ws'): string {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${path}`;
  }
  // Fallback für SSR/Tests
  return `ws://localhost:3000${path}`;
} 