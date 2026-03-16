const stripTrailingSlash = (url) => (url ? url.replace(/\/+$/, '') : '');

const resolveBrowserBase = (envKey, fallback = '') => {
  const value = import.meta.env[envKey];
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname?.toLowerCase() ?? '';
    const isReachableHost =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.includes('.') ||
      /^[\d:]+$/.test(host); // IPv4/IPv6
    if (!isReachableHost) {
      return fallback;
    }
    const normalizedPath = parsed.pathname.replace(/\/+$/, '');
    return stripTrailingSlash(`${parsed.protocol}//${parsed.host}${normalizedPath}`);
  } catch (err) {
    // 非合法 URL（例如 design-api:8001）視為容器 hostname，改走 proxy/相對路徑
    return fallback;
  }
};

export const DESIGN_API_BASE_URL = resolveBrowserBase('VITE_DESIGN_API_URL', '');
export const PREDICTION_API_BASE_URL = resolveBrowserBase('VITE_PREDICTION_API_URL', '');
