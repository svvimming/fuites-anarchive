/**
 * Composable for URL validation
 * @returns {Object} Object containing URL validation methods
 */
export function useValidateUrl() {
  /**
   * Validates if a string is a valid URL
   * @param {string} url - The URL string to validate
   * @returns {boolean} True if the URL is valid, false otherwise
   */
  const isValidUrl = (url) => {
    if (!url) return false
    
    try {
      // Create URL object to validate
      new URL(url)
      return true
    } catch (error) {
      return false
    }
  }

  return {
    isValidUrl
  }
}
