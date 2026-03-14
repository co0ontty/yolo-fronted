/**
 * API utility functions for authenticated requests
 */

/**
 * Get authorization headers for API requests
 * @param {string|null} authToken - The auth token to use
 * @returns {Object} Headers object with Authorization if token exists
 */
export function getAuthHeaders(authToken) {
  const headers = {
    'Content-Type': 'application/json',
  }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }
  return headers
}