// Environment detection utility for cross-platform compatibility
// Works with both traditional React apps and Vite-based apps

declare const process:
  | { env?: Record<string, string | undefined> }
  | undefined;

// Helper function to safely access Vite's import.meta.env
function getViteEnv(): Record<string, any> | null {
  try {
    // Use dynamic access to avoid TypeScript import.meta issues
    const globalThis_ = globalThis as any;
    if (typeof window !== 'undefined' && globalThis_.__vite_env) {
      return globalThis_.__vite_env;
    }

    // Try to access import.meta via eval to avoid compile-time issues
    if (typeof window !== 'undefined') {
      try {
        const importMeta = new Function('return typeof import !== "undefined" && import.meta')();
        if (importMeta && importMeta.env) {
          return importMeta.env;
        }
      } catch {
        // Ignore errors when import.meta is not available
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Safe way to check if we're in development mode
 * Works with both Node.js process.env and Vite import.meta.env
 */
export function isDevelopment(): boolean {
  // Check if we have process.env (Node.js or bundler that provides it)
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'development';
  }

  // Check Vite environment
  const viteEnv = getViteEnv();
  if (viteEnv) {
    return viteEnv.MODE === 'development';
  }

  // Fallback to false (assume production for safety)
  return false;
}

/**
 * Safe way to check if we're in production mode
 */
export function isProduction(): boolean {
  // Check if we have process.env (Node.js or bundler that provides it)
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'production';
  }

  // Check Vite environment
  const viteEnv = getViteEnv();
  if (viteEnv) {
    return viteEnv.MODE === 'production';
  }

  // Fallback to true (assume production for safety)
  return true;
}

/**
 * Get API base URL from environment variables
 * Supports both REACT_APP_ and VITE_ prefixes
 */
export function getApiBaseUrl(): string {
  // Check process.env (traditional React apps)
  if (typeof process !== 'undefined' && process.env) {
    return process.env.REACT_APP_API_BASE_URL || 'https://api.sublay.io/v8';
  }

  // Check Vite environment
  const viteEnv = getViteEnv();
  if (viteEnv) {
    return viteEnv.VITE_API_BASE_URL || 'https://api.sublay.io/v8';
  }

  // Fallback to default
  return 'https://api.sublay.io/v8';
}

/**
 * Get any environment variable with fallback
 * Tries both VITE_ and REACT_APP_ prefixes
 */
export function getEnvVar(name: string, defaultValue: string = ''): string {
  // Check process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env[`REACT_APP_${name}`] || process.env[`VITE_${name}`] || defaultValue;
  }

  // Check Vite environment
  const viteEnv = getViteEnv();
  if (viteEnv) {
    return viteEnv[`VITE_${name}`] || viteEnv[`REACT_APP_${name}`] || defaultValue;
  }

  return defaultValue;
}