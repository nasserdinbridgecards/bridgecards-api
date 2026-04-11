/**
 * Thin wrapper around the native `fetch` API that adds a configurable timeout.
 *
 * Throws an error with message `'TIMEOUT'` when the deadline is exceeded so
 * callers can distinguish network timeouts from other errors.
 *
 * @param {string} url        Request URL.
 * @param {RequestInit} opts  Standard fetch options.
 * @param {number} ms         Timeout in milliseconds (default: 12 000).
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, opts = {}, ms = 12_000) {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timer);
    return response;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('TIMEOUT');
    throw err;
  }
}
