let enabled = false;

export function enableDebug() {
  enabled = true;
  console.info('[DEBUG] Debugging enabled');
}

export function disableDebug() {
  enabled = false;
  console.info('[DEBUG] Debugging disabled');
}

export function debug(...args: unknown[]) {
  if (enabled) {
    console.log('[DEBUG]', ...args);
  }
}

/**
 * Wrap a function with debugging logs for arguments and result.
 */
export function debugWrap<T extends (...args: unknown[]) => unknown>(fn: T, name?: string): T {
  return ((...args: unknown[]) => {
    debug(`${name || fn.name} called with:`, ...args);
    const result = fn(...args);
    if (result instanceof Promise) {
      return result.then((res) => {
        debug(`${name || fn.name} resolved:`, res);
        return res;
      });
    } else {
      debug(`${name || fn.name} returned:`, result);
      return result;
    }
  }) as T;
}